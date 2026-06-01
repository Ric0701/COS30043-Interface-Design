import { defineStore } from "pinia";
import { useTodoStore } from "./todo_store.js";
import { useGachaStore } from "../gacha_store.js";
import { useGoalStore } from "./goal_store.js";
import CryptoJS from "crypto-js";

function hashPassword(password) {
  // CryptoJS executes SHA-256 purely in JavaScript, bypassing browser Secure Context blocks
  return CryptoJS.SHA256(password).toString(CryptoJS.enc.Hex);
}

export const useAuthStore = defineStore("auth", {
  state: () => ({
    users: JSON.parse(localStorage.getItem("genshin_users")) || [],
    currentUser: localStorage.getItem("genshin_current_user") || null,
  }),
  actions: {
    async registerUser(username, password) {
      const userExists = this.users.find((u) => u.username === username);

      if (userExists) {
        return { success: false, message: "Username already exists." };
      }

      const hashedPassword = await hashPassword(password);

      this.users.push({ username, password: hashedPassword });

      localStorage.setItem("genshin_users", JSON.stringify(this.users));

      return { success: true, message: "Registration successful!" };
    },
    async loginUser(username, password) {
      const hashedPassword = await hashPassword(password);
      const user = this.users.find(
        (u) => u.username === username && u.password === hashedPassword,
      );

      if (user) {
        this.currentUser = username;
        localStorage.setItem("genshin_current_user", username);

        useTodoStore().loadData();
        useGachaStore().loadData();
        useGoalStore().loadData();

        return { success: true, message: "Login successful!" };
      }
      return { success: false, message: "Invalid username or password." };
    },
    logout() {
      this.currentUser = null;
      localStorage.removeItem("genshin_current_user");

      useTodoStore().loadData();
      useGachaStore().loadData();
      useGoalStore().loadData();
    },
    async updateProfile(newUsername, displayName, dateOfBirth) {
      const userIndex = this.users.findIndex(
        (u) => u.username === this.currentUser,
      );
      if (userIndex === -1)
        return { success: false, message: "User not found." };

      if (newUsername !== this.currentUser) {
        const userExists = this.users.find((u) => u.username === newUsername);
        if (userExists) {
          return { success: false, message: "Username already exists." };
        }

        // Migrate localStorage data
        const oldUsername = this.currentUser;

        const gachaData = localStorage.getItem(`gacha_${oldUsername}`);
        if (gachaData) {
          localStorage.setItem(`gacha_${newUsername}`, gachaData);
          localStorage.removeItem(`gacha_${oldUsername}`);
        }

        const todoData = localStorage.getItem(`todos_${oldUsername}`);
        if (todoData) {
          localStorage.setItem(`todos_${newUsername}`, todoData);
          localStorage.removeItem(`todos_${oldUsername}`);
        }

        const goalData = localStorage.getItem(`goals_${oldUsername}`);
        if (goalData) {
          localStorage.setItem(`goals_${newUsername}`, goalData);
          localStorage.removeItem(`goals_${oldUsername}`);
        }

        // Update users list and state
        this.users[userIndex].username = newUsername;
        this.currentUser = newUsername;
        localStorage.setItem("genshin_current_user", newUsername);
      }

      this.users[userIndex].displayName = displayName;
      this.users[userIndex].dateOfBirth = dateOfBirth;

      localStorage.setItem("genshin_users", JSON.stringify(this.users));
      return { success: true, message: "Profile updated successfully!" };
    },
    async changePassword(currentPassword, newPassword) {
      const userIndex = this.users.findIndex(
        (u) => u.username === this.currentUser,
      );
      if (userIndex === -1)
        return { success: false, message: "User not found." };

      const hashedCurrent = await hashPassword(currentPassword);
      if (this.users[userIndex].password !== hashedCurrent) {
        return { success: false, message: "Incorrect current password." };
      }

      const hashedNew = await hashPassword(newPassword);
      this.users[userIndex].password = hashedNew;

      localStorage.setItem("genshin_users", JSON.stringify(this.users));
      return { success: true, message: "Password changed successfully!" };
    },
    deleteAccount() {
      const userIndex = this.users.findIndex(
        (u) => u.username === this.currentUser,
      );
      if (userIndex === -1)
        return { success: false, message: "User not found." };

      const oldUsername = this.currentUser;

      // Remove from list
      this.users.splice(userIndex, 1);

      // Remove user specific data
      localStorage.removeItem(`gacha_${oldUsername}`);
      localStorage.removeItem(`todos_${oldUsername}`);
      localStorage.removeItem(`goals_${oldUsername}`);

      // Log out
      this.currentUser = null;
      localStorage.removeItem("genshin_current_user");
      localStorage.setItem("genshin_users", JSON.stringify(this.users));

      // Reload stores to default states
      useTodoStore().loadData();
      useGachaStore().loadData();
      useGoalStore().loadData();

      return { success: true };
    },
  },
});
