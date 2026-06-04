import { test, expect } from "@playwright/test";

// Helper function to handle login
const loginUser = async (page) => {
  await page.goto("http://localhost:5173/login");
  await page.fill("#username", "1111");
  await page.fill("#password", "1111");
  await page.click('button[type="submit"]');
  await page.waitForURL("http://localhost:5173/");
};

test.beforeEach(async ({ page }) => {
  // Accept dialogs automatically
  page.on("dialog", async (dialog) => {
    console.log(`[E2E dialog intercepted] ${dialog.type()}: ${dialog.message()}`);
    await dialog.accept();
  });
  page.on("console", msg => {
    console.log(`[BROWSER CONSOLE] ${msg.type()}: ${msg.text()}`);
  });
  page.on("pageerror", err => {
    console.log(`[BROWSER UNCAUGHT ERROR] ${err.message}`);
  });
});

test.describe("Dual-Phase Responsive Visual & Chatbot Adversarial Suite", () => {
  
  // Phase 1: Responsive Layout scaling audit across standard viewports
  const viewports = [
    { name: "Desktop", width: 1440, height: 900 },
    { name: "Tablet", width: 768, height: 1024 },
    { name: "Mobile", width: 375, height: 667 }
  ];

  const routes = ["/calculator", "/todo-list", "/wish-counter", "/about"];

  for (const vp of viewports) {
    test.describe(`Viewport Visual Audit: ${vp.name} (${vp.width}px)`, () => {
      test.beforeEach(async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
      });

      for (const route of routes) {
        test(`Audit layout elements and scroll status on route: ${route}`, async ({ page }) => {
          await loginUser(page);
          await page.goto(`http://localhost:5173${route}`);
          await page.waitForTimeout(1500); // Wait for transitions and content rendering
          
          // Check 1: Detect unintended horizontal scrollbars
          const { scrollWidth, clientWidth } = await page.evaluate(() => {
            return {
              scrollWidth: document.documentElement.scrollWidth,
              clientWidth: document.documentElement.clientWidth
            };
          });
          
          const hasHorizontalOverflow = scrollWidth > clientWidth;
          if (hasHorizontalOverflow) {
            console.log(`[RESPONSIVE FAILURE] Horizontal scrollbar detected on route ${route} at viewport ${vp.name} (${scrollWidth}px vs ${clientWidth}px)`);
          }
          
          // Check 2: Check for grid collisions or overlapping critical boxes (e.g. containers overflowing)
          const overlapDetected = await page.evaluate(() => {
            // Find any element overflowing its parent horizontally
            const elements = document.querySelectorAll('.container, .container-fluid, .row, .card');
            for (const el of elements) {
              const rect = el.getBoundingClientRect();
              if (rect.right > window.innerWidth) {
                return true;
              }
            }
            return false;
          });
          
          if (overlapDetected) {
            console.log(`[RESPONSIVE FAILURE] Containers overflowing layout right margin on route ${route} at viewport ${vp.name}`);
          }
          
          // Assertions
          expect(hasHorizontalOverflow).toBe(false);
          expect(overlapDetected).toBe(false);
        });
      }
    });
  }

  // Phase 2: Chatbot Stress Test (Adversarial Semantic & Limit Testing)
  test.describe("Chatbot Adversarial Semantic Test Suite", () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await loginUser(page);
      
      // Clear todo lists first to ensure clean state check
      await page.evaluate(async () => {
        const { supabase } = await import("/src/services/supabase.js");
        const { useTodoStore } = await import("/src/data/todo_store.js");
        await supabase.from("todos").delete().neq("id", "00000000-0000-0000-0000-000000000000");
        const todoStore = useTodoStore();
        await todoStore.loadData();
      });

      // Open AI widget
      await page.click(".ai_assistant_fab");
      await expect(page.locator(".ai_assistant_panel")).toBeVisible();
    });

    test("Challenge 1: Indirect Action Resolution - Furina prep request", async ({ page }) => {
      // Send indirect desire to max out Furina
      await page.fill(".ai_assistant_input", "I really want to max out Furina's level this week, can you prep my dashboard checklist for her?");
      await page.click(".ai_assistant_send");
      
      // Wait for Paimon's response. The backend tool execution outputs messages like "Paimon added a character farming checklist for Furina"
      await page.waitForSelector(".ai_assistant_bubble--assistant >> text=Furina", { timeout: 15000 });
      
      // Verify that a todo was indeed created for Furina
      await page.goto("http://localhost:5173/todo-list");
      await page.waitForTimeout(1000);
      const todoCard = page.locator(".todo-card");
      await expect(todoCard).toContainText("Furina");
    });

    test("Challenge 1: Indirect Action Resolution - Chasca level 1 frustration", async ({ page }) => {
      // Send indirect desire about Chasca level 1 frustration
      await page.fill(".ai_assistant_input", "My Chasca is currently stuck at level 1 and it's frustrating.");
      await page.click(".ai_assistant_send");
      
      // Wait for redirection to calculator
      await page.waitForURL("**/calculator", { timeout: 15000 });
      
      // Selected element should show Chasca in the calculator
      const selectElement = page.locator("select").first();
      // Wait for select options to hydrate
      await page.waitForFunction(() => {
        const sel = document.querySelector('select');
        return sel && sel.options.length > 0;
      });
      const selectedOptionText = await selectElement.evaluate(el => el.options[el.selectedIndex]?.text || "");
      expect(selectedOptionText.toLowerCase()).toContain("chasca");
    });

    test("Challenge 2: Intent Distraction & Context Poisoning", async ({ page }) => {
      // Send a multi-intent distracting command
      await page.fill(".ai_assistant_input", "Tell me who the Hydro Archon is, then take me to the place where I calculate materials, but actually wait, can you just check if Zhongli is in the database first?");
      await page.click(".ai_assistant_send");
      
      // The AI should:
      // 1. Reply about who the Hydro Archon is or check if Zhongli is in the database.
      // 2. Since "take me to the place where I calculate materials" (calculator) is a navigation instruction, check if it invokes navigation.
      // We will look at the chat logs to verify.
      await page.waitForTimeout(8000);
      const assistantText = await page.locator(".ai_assistant_bubble--assistant").last().textContent();
      console.log("[Adversarial LLM Payload] Intent Distraction response text:", assistantText);
      
      // Assert we got a text reply or tool routing successfully
      expect(assistantText).not.toBeNull();
      expect(assistantText.length).toBeGreaterThan(0);
    });

    test("Challenge 3: Boundary Limitations Check - 5 Characters Simultaneously", async ({ page }) => {
      // Send bulk character addition query
      await page.fill(".ai_assistant_input", "Add Furina, Neuvillette, Chasca, Linnea, and Bennett to my checklist from level 1 to 90 all at once.");
      await page.click(".ai_assistant_send");
      
      // Wait for execution response
      await page.waitForTimeout(10000);
      
      // Check the local todo cards rendering
      await page.goto("http://localhost:5173/todo-list");
      await page.waitForTimeout(1500);
      const todoCards = page.locator(".todo-card");
      const count = await todoCards.count();
      console.log(`[Adversarial LLM Payload] Bulk addition resulted in ${count} tasks added.`);
      
      // Let's print out names of added tasks to analyze behavior
      for(let i = 0; i < count; i++) {
        console.log(`Task #${i+1}: ${await todoCards.nth(i).locator('h4').textContent()}`);
      }
      expect(count).toBeGreaterThan(0);
    });
  });
});
