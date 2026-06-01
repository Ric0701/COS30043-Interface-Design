import { defineStore } from "pinia";
import { useAuthStore } from "./data/auth_store";
import { supabase } from "./services/supabase.js";

export const useGachaStore = defineStore("gacha", {
  state: () => ({
    character_list: [],
    weapon_list: [],
    codes_list: [],
    is_fetching_data: false,

    // Limited Banner Character
    limited_character_lifetime_pulls: [],
    limited_character_four_star_pity: 0,
    limited_character_five_star_pity: 0,
    limited_character_five_star_gauaranteed: false,

    // Limited Banner Weapon
    limited_weapon_lifetime_pulls: [],
    limited_weapon_four_star_pity: 0,
    limited_weapon_five_star_pity: 0,
    limited_weapon_five_star_gauaranteed: false,

    // Standard Banner
    standard_lifetime_pulls: [],
    standard_four_star_pity: 0,
    standard_five_star_pity: 0,
  }),
  actions: {
    resetData() {
      this.limited_character_lifetime_pulls = [];
      this.limited_character_four_star_pity = 0;
      this.limited_character_five_star_pity = 0;
      this.limited_character_five_star_gauaranteed = false;
      this.limited_weapon_lifetime_pulls = [];
      this.limited_weapon_four_star_pity = 0;
      this.limited_weapon_five_star_pity = 0;
      this.limited_weapon_five_star_gauaranteed = false;
      this.standard_lifetime_pulls = [];
      this.standard_four_star_pity = 0;
      this.standard_five_star_pity = 0;
    },
    async loadData() {
      const authStore = useAuthStore();
      if (!authStore.currentUser) {
        this.resetData();
        return;
      }

      // Hydrate wishes first
      try {
        const { data: wishesData, error: wishesError } = await supabase
          .from("wishes")
          .select("*")
          .eq("username", authStore.currentUser);

        if (wishesError) throw wishesError;
        if (wishesData) {
          this.limited_character_lifetime_pulls = wishesData
            .filter((w) => w.type === "limited_character")
            .sort((a, b) => a.timestamp - b.timestamp);
          this.limited_weapon_lifetime_pulls = wishesData
            .filter((w) => w.type === "limited_weapon")
            .sort((a, b) => a.timestamp - b.timestamp);
          this.standard_lifetime_pulls = wishesData
            .filter((w) => w.type === "standard")
            .sort((a, b) => a.timestamp - b.timestamp);
        }
      } catch (error) {
        console.error(
          "[Gacha Store] Failed to load wishes from Supabase:",
          error,
        );
      }

      // Hydrate pity metadata from profiles
      try {
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select(
            "limited_character_four_star_pity, limited_character_five_star_pity, limited_character_five_star_gauaranteed, limited_weapon_four_star_pity, limited_weapon_five_star_pity, limited_weapon_five_star_gauaranteed, standard_four_star_pity, standard_five_star_pity",
          )
          .eq("username", authStore.currentUser)
          .maybeSingle();

        if (profileError) throw profileError;
        if (profileData) {
          this.limited_character_four_star_pity =
            profileData.limited_character_four_star_pity ?? 0;
          this.limited_character_five_star_pity =
            profileData.limited_character_five_star_pity ?? 0;
          this.limited_character_five_star_gauaranteed =
            profileData.limited_character_five_star_gauaranteed ?? false;
          this.limited_weapon_four_star_pity =
            profileData.limited_weapon_four_star_pity ?? 0;
          this.limited_weapon_five_star_pity =
            profileData.limited_weapon_five_star_pity ?? 0;
          this.limited_weapon_five_star_gauaranteed =
            profileData.limited_weapon_five_star_gauaranteed ?? false;
          this.standard_four_star_pity =
            profileData.standard_four_star_pity ?? 0;
          this.standard_five_star_pity =
            profileData.standard_five_star_pity ?? 0;
        }
      } catch (error) {
        console.error(
          "[Gacha Store] Failed to load profile gacha metadata from Supabase:",
          error,
        );
      }
    },
    async saveData() {
      const authStore = useAuthStore();
      if (!authStore.currentUser) return;

      try {
        const { error } = await supabase
          .from("profiles")
          .update({
            limited_character_four_star_pity:
              this.limited_character_four_star_pity,
            limited_character_five_star_pity:
              this.limited_character_five_star_pity,
            limited_character_five_star_gauaranteed:
              this.limited_character_five_star_gauaranteed,
            limited_weapon_four_star_pity: this.limited_weapon_four_star_pity,
            limited_weapon_five_star_pity: this.limited_weapon_five_star_pity,
            limited_weapon_five_star_gauaranteed:
              this.limited_weapon_five_star_gauaranteed,
            standard_four_star_pity: this.standard_four_star_pity,
            standard_five_star_pity: this.standard_five_star_pity,
          })
          .eq("username", authStore.currentUser);

        if (error) throw error;
      } catch (error) {
        console.error(
          "[Gacha Store] Failed to save profile gacha metadata to Supabase:",
          error,
        );
      }
    },
    async fetch_game_data() {
      if (this.character_list.length > 0 && this.weapon_list.length > 0) return;

      this.is_fetching_data = true;
      try {
        const [charResponse, weaponResponse] = await Promise.all([
          fetch("/data/characters.json"),
          fetch("/data/weaponList.json"),
        ]);

        if (!charResponse.ok || !weaponResponse.ok)
          throw new Error("Failed to load local database");

        const charData = await charResponse.json();
        const weaponData = await weaponResponse.json();

        const parseRarity = (item) => {
          let numericRarity = 5;
          if (item.rarity === "rare" || item.rarity === 4) numericRarity = 4;
          else if (typeof item.rarity === "number") numericRarity = item.rarity;

          return {
            name: item.id,
            rarity: numericRarity,
          };
        };

        this.character_list = charData.map(parseRarity).sort((a, b) => {
          if (a.rarity !== b.rarity) {
            return a.rarity - b.rarity;
          }
          return a.name.localeCompare(b.name);
        });
        this.weapon_list = weaponData.map(parseRarity).sort((a, b) => {
          if (a.rarity !== b.rarity) {
            return a.rarity - b.rarity;
          }
          return a.name.localeCompare(b.name);
        });
      } catch (error) {
        console.error("Database error:", error);
      } finally {
        this.is_fetching_data = false;
      }
    },

    async fetch_codes_data() {
      if (this.codes_list.length > 0) return;
      try {
        const response = await fetch("/data/codes.json");
        if (!response.ok) throw new Error("Failed to load codes database");
        this.codes_list = await response.json();
      } catch (error) {
        console.error("Codes database error:", error);
      }
    },

    async add_pull(item) {
      const type = item.type;
      const rarity = item.rarity;

      item.previous_five_star_pity = this[`${type}_five_star_pity`];
      item.previous_four_star_pity = this[`${type}_four_star_pity`];

      // Optimistic local push
      this[`${type}_lifetime_pulls`].push(item);

      if (rarity === 5) {
        this[`${type}_five_star_pity`] = 0;
        this[`${type}_four_star_pity`]++;
      } else if (rarity === 4) {
        this[`${type}_four_star_pity`] = 0;
        this[`${type}_five_star_pity`]++;
      } else {
        this[`${type}_five_star_pity`]++;
        this[`${type}_four_star_pity`]++;
      }

      const authStore = useAuthStore();
      if (authStore.currentUser) {
        const dbPull = {
          id: item.timestamp || Date.now(),
          username: authStore.currentUser,
          type: type,
          name: item.name || "Unknown",
          rarity: rarity,
          timestamp: item.timestamp || Date.now(),
          time: item.time || new Date().toISOString(),
          pity: item.pity || null,
          previous_five_star_pity: item.previous_five_star_pity,
          previous_four_star_pity: item.previous_four_star_pity,
        };

        try {
          const { error } = await supabase.from("wishes").insert([dbPull]);
          if (error) throw error;
        } catch (error) {
          console.error("[Gacha Store] Failed to insert wish to Supabase:", error);
        }

        await this.saveData();
      }
    },

    async remove_pull(payload) {
      const type = payload.type;
      const historyArray = this[`${type}_lifetime_pulls`];

      if (historyArray.length === 0) {
        this[`${type}_five_star_pity`] = Math.max(
          0,
          this[`${type}_five_star_pity`] - 1,
        );
        this[`${type}_four_star_pity`] = Math.max(
          0,
          this[`${type}_four_star_pity`] - 1,
        );
        await this.saveData();
        return;
      }

      const poppedItem = historyArray.pop();
      this[`${type}_five_star_pity`] = poppedItem.previous_five_star_pity;
      this[`${type}_four_star_pity`] = poppedItem.previous_four_star_pity;

      const authStore = useAuthStore();
      if (authStore.currentUser) {
        try {
          const { error } = await supabase
            .from("wishes")
            .delete()
            .eq("username", authStore.currentUser)
            .eq("type", type)
            .eq("timestamp", poppedItem.timestamp);

          if (error) throw error;
        } catch (error) {
          console.error(
            "[Gacha Store] Failed to delete wish from Supabase:",
            error,
          );
        }

        await this.saveData();
      }
    },

    async force_update_pity(payload) {
      const type = payload.type;
      const requestedFivePity = payload.fivePity || 0;
      const requestedFourPity = payload.fourPity || 0;

      const currentFiveStarPity = this[`${type}_five_star_pity`] || 0;
      const currentFourStarPity = this[`${type}_four_star_pity`] || 0;

      const deltaFive = Math.max(0, requestedFivePity - currentFiveStarPity);
      const deltaFour = Math.max(0, requestedFourPity - currentFourStarPity);
      const delta = Math.max(deltaFive, deltaFour);

      const authStore = useAuthStore();

      if (delta > 0) {
        const now = new Date();
        const placeholderPulls = [];
        for (let i = 0; i < delta; i++) {
          const timestamp = Date.now() - (delta - i) * 1000;
          const time = new Date(timestamp - now.getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 16);
          const item = {
            type: type,
            name: "Unknown (Historical)",
            rarity: 3,
            timestamp: timestamp,
            time: time,
          };
          this[`${type}_lifetime_pulls`].push(item);

          if (authStore.currentUser) {
            placeholderPulls.push({
              id: timestamp,
              username: authStore.currentUser,
              type: type,
              name: "Unknown (Historical)",
              rarity: 3,
              timestamp: timestamp,
              time: time,
            });
          }
        }

        if (authStore.currentUser && placeholderPulls.length > 0) {
          try {
            const { error } = await supabase
              .from("wishes")
              .insert(placeholderPulls);
            if (error) throw error;
          } catch (error) {
            console.error(
              "[Gacha Store] Failed to insert historical wishes to Supabase:",
              error,
            );
          }
        }
      }

      this[`${type}_five_star_pity`] = requestedFivePity;
      this[`${type}_four_star_pity`] = requestedFourPity;

      if (authStore.currentUser) {
        await this.saveData();
      }
    },

    _getBannerPullCosts(pulls) {
      let costs = [];
      let lastFiveStarIndex = -1;
      for (let i = 0; i < pulls.length; i++) {
        const pull = pulls[i];
        if (pull.rarity === 5) {
          const r = i - (lastFiveStarIndex + 1);
          const p =
            pull.pity ||
            (pull.previous_five_star_pity !== undefined
              ? pull.previous_five_star_pity + 1
              : 1);
          const weight = Math.max(1, p - r);
          costs.push({
            pull,
            cost: weight * 160,
          });
          lastFiveStarIndex = i;
        } else {
          costs.push({
            pull,
            cost: 160,
          });
        }
      }
      return costs;
    },

    async loadDemoData() {
      this.resetData();

      const authStore = useAuthStore();
      if (authStore.currentUser) {
        // Clear all previous wishes in database for user
        try {
          const { error } = await supabase
            .from("wishes")
            .delete()
            .eq("username", authStore.currentUser);
          if (error) throw error;
        } catch (error) {
          console.error(
            "[Gacha Store] Failed to clear previous wishes during demo load:",
            error,
          );
        }
      }

      const dbPulls = [];
      const addPullLocal = (item) => {
        const type = item.type;
        const rarity = item.rarity;
        item.previous_five_star_pity = this[`${type}_five_star_pity`];
        item.previous_four_star_pity = this[`${type}_four_star_pity`];

        this[`${type}_lifetime_pulls`].push(item);

        if (rarity === 5) {
          this[`${type}_five_star_pity`] = 0;
          this[`${type}_four_star_pity`]++;
        } else if (rarity === 4) {
          this[`${type}_four_star_pity`] = 0;
          this[`${type}_five_star_pity`]++;
        } else {
          this[`${type}_five_star_pity`]++;
          this[`${type}_four_star_pity`]++;
        }

        if (authStore.currentUser) {
          dbPulls.push({
            id: item.timestamp || Date.now() + dbPulls.length,
            username: authStore.currentUser,
            type: type,
            name: item.name || "Unknown",
            rarity: rarity,
            timestamp: item.timestamp || Date.now() + dbPulls.length,
            time: item.time || new Date().toISOString(),
            pity: item.pity || null,
            previous_five_star_pity: item.previous_five_star_pity,
            previous_four_star_pity: item.previous_four_star_pity,
          });
        }
      };

      // Character Banner simulation (March)
      for (let i = 0; i < 40; i++) {
        const timestamp = new Date(
          `2026-03-10T12:${i < 10 ? "0" + i : i}`,
        ).getTime();
        addPullLocal({
          rarity: 3,
          name: "Unknown",
          type: "limited_character",
          timestamp,
          time: `2026-03-10T12:${i < 10 ? "0" + i : i}`,
        });
      }
      addPullLocal({
        rarity: 4,
        name: "Bennett",
        type: "limited_character",
        timestamp: new Date("2026-03-10T13:00").getTime(),
        time: "2026-03-10T13:00",
      });
      for (let i = 0; i < 35; i++) {
        const timestamp = new Date(
          `2026-03-15T15:${i < 10 ? "0" + i : i}`,
        ).getTime();
        addPullLocal({
          rarity: 3,
          name: "Unknown",
          type: "limited_character",
          timestamp,
          time: `2026-03-15T15:${i < 10 ? "0" + i : i}`,
        });
      }
      addPullLocal({
        rarity: 5,
        name: "Chasca",
        type: "limited_character",
        timestamp: new Date("2026-03-15T16:00").getTime(),
        time: "2026-03-15T16:00",
        pity: 76,
      });

      // Next character block (April)
      for (let i = 0; i < 79; i++) {
        const timestamp = new Date(
          `2026-04-20T10:${i < 10 ? "0" + i : i}`,
        ).getTime();
        addPullLocal({
          rarity: i % 10 === 9 ? 4 : 3,
          name: i % 10 === 9 ? "Xiangling" : "Unknown",
          type: "limited_character",
          timestamp,
          time: `2026-04-20T10:${i < 10 ? "0" + i : i}`,
        });
      }
      addPullLocal({
        rarity: 5,
        name: "Linnea",
        type: "limited_character",
        timestamp: new Date("2026-04-20T11:00").getTime(),
        time: "2026-04-20T11:00",
        pity: 80,
      });

      // Next character block (May, lucky early)
      for (let i = 0; i < 34; i++) {
        const timestamp = new Date(
          `2026-05-05T08:${i < 10 ? "0" + i : i}`,
        ).getTime();
        addPullLocal({
          rarity: i % 10 === 9 ? 4 : 3,
          name: i % 10 === 9 ? "Kuki Shinobu" : "Unknown",
          type: "limited_character",
          timestamp,
          time: `2026-05-05T08:${i < 10 ? "0" + i : i}`,
        });
      }
      addPullLocal({
        rarity: 5,
        name: "Mualani",
        type: "limited_character",
        timestamp: new Date("2026-05-05T09:00").getTime(),
        time: "2026-05-05T09:00",
        pity: 35,
      });

      // Weapon Banner simulation (May)
      for (let i = 0; i < 64; i++) {
        const timestamp = new Date(
          `2026-05-18T14:${i < 10 ? "0" + i : i}`,
        ).getTime();
        addPullLocal({
          rarity: i % 10 === 9 ? 4 : 3,
          name: i % 10 === 9 ? "Sacrificial Sword" : "Unknown",
          type: "limited_weapon",
          timestamp,
          time: `2026-05-18T14:${i < 10 ? "0" + i : i}`,
        });
      }
      addPullLocal({
        rarity: 5,
        name: "Astral Vulture's Crimson Plumage",
        type: "limited_weapon",
        timestamp: new Date("2026-05-18T15:00").getTime(),
        time: "2026-05-18T15:00",
        pity: 65,
      });

      // Standard Banner simulation (June)
      for (let i = 0; i < 79; i++) {
        const timestamp = new Date(
          `2026-06-01T09:${i < 10 ? "0" + i : i}`,
        ).getTime();
        addPullLocal({
          rarity: i % 10 === 9 ? 4 : 3,
          name: i % 10 === 9 ? "Favonius Bow" : "Unknown",
          type: "standard",
          timestamp,
          time: `2026-06-01T09:${i < 10 ? "0" + i : i}`,
        });
      }
      addPullLocal({
        rarity: 5,
        name: "Diluc",
        type: "standard",
        timestamp: new Date("2026-06-01T10:00").getTime(),
        time: "2026-06-01T10:00",
        pity: 80,
      });

      if (authStore.currentUser && dbPulls.length > 0) {
        try {
          const { error } = await supabase.from("wishes").insert(dbPulls);
          if (error) throw error;
        } catch (error) {
          console.error(
            "[Gacha Store] Failed to insert simulation pulls to Supabase:",
            error,
          );
        }
        await this.saveData();
      }
    },
  },

  getters: {
    allPullsWithCosts() {
      const charCosts = this._getBannerPullCosts(
        this.limited_character_lifetime_pulls,
      ).map((item) => ({
        ...item,
        bannerType: "limited_character",
        bannerLabel: "Limited Character",
      }));
      const weaponCosts = this._getBannerPullCosts(
        this.limited_weapon_lifetime_pulls,
      ).map((item) => ({
        ...item,
        bannerType: "limited_weapon",
        bannerLabel: "Limited Weapon",
      }));
      const stdCosts = this._getBannerPullCosts(
        this.standard_lifetime_pulls,
      ).map((item) => ({
        ...item,
        bannerType: "standard",
        bannerLabel: "Standard",
      }));
      return [...charCosts, ...weaponCosts, ...stdCosts];
    },

    monthlySpendingTrend() {
      const pulls = this.allPullsWithCosts;
      const groups = {};
      pulls.forEach((item) => {
        let key = "Unknown";
        if (item.pull.time) {
          const parts = item.pull.time.split("-");
          if (parts.length >= 2) {
            key = `${parts[0]}-${parts[1]}`; // "YYYY-MM"
          }
        }
        groups[key] = (groups[key] || 0) + item.cost;
      });

      return Object.keys(groups)
        .sort()
        .map((key) => ({
          month: key,
          amount: groups[key],
        }));
    },

    costPerFiveStar() {
      const result = [];
      const banners = [
        {
          list: this.limited_character_lifetime_pulls,
          label: "Limited Character",
        },
        { list: this.limited_weapon_lifetime_pulls, label: "Limited Weapon" },
        { list: this.standard_lifetime_pulls, label: "Standard" },
      ];

      banners.forEach(({ list, label }) => {
        let lastFiveStarIndex = -1;
        for (let i = 0; i < list.length; i++) {
          const pull = list[i];
          if (pull.rarity === 5) {
            const r = i - (lastFiveStarIndex + 1);
            const p =
              pull.pity ||
              (pull.previous_five_star_pity !== undefined
                ? pull.previous_five_star_pity + 1
                : 1);
            result.push({
              name: pull.name || "Unknown 5★",
              pity: p,
              cost: p * 160,
              time: pull.time || "Unknown Date",
              banner: label,
            });
            lastFiveStarIndex = i;
          }
        }
      });

      return result.sort((a, b) => {
        if (a.time === "Unknown Date") return 1;
        if (b.time === "Unknown Date") return -1;
        return a.time.localeCompare(b.time);
      });
    },

    mostExpensiveBanner() {
      const fiveStars = this.costPerFiveStar;
      if (fiveStars.length === 0) return null;
      let maxItem = fiveStars[0];
      for (let i = 1; i < fiveStars.length; i++) {
        if (fiveStars[i].cost > maxItem.cost) {
          maxItem = fiveStars[i];
        }
      }
      return maxItem;
    },

    spendingCategories() {
      const pulls = this.allPullsWithCosts;
      let charTotal = 0;
      let weaponTotal = 0;
      let stdTotal = 0;

      pulls.forEach((item) => {
        if (item.bannerType === "limited_character") charTotal += item.cost;
        else if (item.bannerType === "limited_weapon") weaponTotal += item.cost;
        else if (item.bannerType === "standard") stdTotal += item.cost;
      });

      const grandTotal = charTotal + weaponTotal + stdTotal;
      const getPercent = (amount) =>
        grandTotal > 0 ? parseFloat(((amount / grandTotal) * 100).toFixed(1)) : 0;

      return [
        {
          category: "Limited Character",
          amount: charTotal,
          percentage: getPercent(charTotal),
        },
        {
          category: "Limited Weapon",
          amount: weaponTotal,
          percentage: getPercent(weaponTotal),
        },
        {
          category: "Standard",
          amount: stdTotal,
          percentage: getPercent(stdTotal),
        },
      ];
    },
  },
});
