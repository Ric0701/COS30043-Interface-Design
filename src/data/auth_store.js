import { defineStore } from "pinia";
import { useTodoStore } from "./todo_store.js";
import { useGachaStore } from "../gacha_store.js";
import { useGoalStore } from "./goal_store.js";
import { supabase } from "../services/supabase.js";
import CryptoJS from "crypto-js";

function hashPassword(password) {
  return CryptoJS.SHA256(password).toString(CryptoJS.enc.Hex);
}

export const useAuthStore = defineStore("auth", {
  state: () => ({
    users: [],
    currentUser: sessionStorage.getItem("genshin_current_user") || null,
    toastMessage: "",
    toastType: "",
  }),
  actions: {
    showToast(message, type = "warning") {
      this.toastMessage = message;
      this.toastType = type;
      setTimeout(() => {
        if (this.toastMessage === message) {
          this.toastMessage = "";
          this.toastType = "";
        }
      }, 4000);
    },
    async loadData() {
      try {
        const { data, error } = await supabase.from("profiles").select("*");
        if (error) throw error;
        if (data) {
          // Normalize profiles property casing for compatibility
          this.users = data.map((u) => ({
            ...u,
            displayName: u.display_name || u.displayName || "",
            dateOfBirth: u.date_of_birth || u.dateOfBirth || "",
          }));
        }
      } catch (error) {
        console.error(
          "[Auth Store] Failed to load profiles from Supabase:",
          error,
        );
      }
    },
    async registerUser(username, password, dateOfBirth = "") {
      const userExists = this.users.find((u) => u.username === username);

      if (userExists) {
        return { success: false, message: "Username already exists." };
      }

      const sanitizedDob = dateOfBirth ? dateOfBirth : null;
      const hashedPassword = await hashPassword(password);
      const newProfile = {
        username,
        password: hashedPassword,
        display_name: "",
        date_of_birth: sanitizedDob,
      };

      try {
        const { error } = await supabase.from("profiles").insert([newProfile]);
        if (error) throw error;

        this.users.push({
          username,
          password: hashedPassword,
          displayName: "",
          dateOfBirth: dateOfBirth || "",
          display_name: "",
          date_of_birth: dateOfBirth || "",
        });

        return { success: true, message: "Registration successful!" };
      } catch (error) {
        console.error(
          "[Auth Store] Failed to register user in Supabase:",
          error,
        );
        return {
          success: false,
          message: `Registration failed: ${error.message}`,
        };
      }
    },
    async loginUser(username, password) {
      const hashedPassword = await hashPassword(password);

      try {
        const { data: user, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("username", username)
          .eq("password", hashedPassword)
          .maybeSingle();

        if (error) throw error;

        if (user) {
          this.currentUser = username;
          sessionStorage.setItem("genshin_current_user", username);

          // Populate local users list if empty
          await this.loadData();

          // Trigger hydration across other data stores
          await Promise.all([
            useTodoStore().loadData(),
            useGachaStore().loadData(),
            useGoalStore().loadData(),
          ]);

          return { success: true, message: "Login successful!" };
        }
        return { success: false, message: "Invalid username or password." };
      } catch (error) {
        console.error("[Auth Store] Login failed:", error);
        return { success: false, message: `Login failed: ${error.message}` };
      }
    },
    logout() {
      this.currentUser = null;
      sessionStorage.removeItem("genshin_current_user");

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

      const oldUsername = this.currentUser;
      const sanitizedDob = dateOfBirth ? dateOfBirth : null;

      if (newUsername !== oldUsername) {
        const userExists = this.users.find((u) => u.username === newUsername);
        if (userExists) {
          return { success: false, message: "Username already exists." };
        }

        try {
          // Cascading updates manually to keep tables clean
          await Promise.all([
            supabase
              .from("todos")
              .update({ username: newUsername })
              .eq("username", oldUsername),
            supabase
              .from("goals")
              .update({ username: newUsername })
              .eq("username", oldUsername),
            supabase
              .from("wishes")
              .update({ username: newUsername })
              .eq("username", oldUsername),
          ]);

          const { error } = await supabase
            .from("profiles")
            .update({
              username: newUsername,
              display_name: displayName,
              date_of_birth: sanitizedDob,
            })
            .eq("username", oldUsername);

          if (error) throw error;

          this.currentUser = newUsername;
          sessionStorage.setItem("genshin_current_user", newUsername);
        } catch (error) {
          console.error(
            "[Auth Store] Failed to update profile username in database:",
            error,
          );
          return {
            success: false,
            message: `Profile update failed: ${error.message}`,
          };
        }
      } else {
        try {
          const { error } = await supabase
            .from("profiles")
            .update({ display_name: displayName, date_of_birth: sanitizedDob })
            .eq("username", oldUsername);

          if (error) throw error;
        } catch (error) {
          console.error(
            "[Auth Store] Failed to update profile columns in database:",
            error,
          );
          return {
            success: false,
            message: `Profile update failed: ${error.message}`,
          };
        }
      }

      this.users[userIndex].displayName = displayName;
      this.users[userIndex].display_name = displayName;
      this.users[userIndex].dateOfBirth = dateOfBirth;
      this.users[userIndex].date_of_birth = dateOfBirth;
      if (newUsername !== oldUsername) {
        this.users[userIndex].username = newUsername;
      }

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

      try {
        const { error } = await supabase
          .from("profiles")
          .update({ password: hashedNew })
          .eq("username", this.currentUser);

        if (error) throw error;

        this.users[userIndex].password = hashedNew;
        return { success: true, message: "Password changed successfully!" };
      } catch (error) {
        console.error(
          "[Auth Store] Failed to change password in Supabase:",
          error,
        );
        return {
          success: false,
          message: `Password change failed: ${error.message}`,
        };
      }
    },
    async deleteAccount() {
      const userIndex = this.users.findIndex(
        (u) => u.username === this.currentUser,
      );
      if (userIndex === -1)
        return { success: false, message: "User not found." };

      const oldUsername = this.currentUser;

      try {
        await Promise.all([
          supabase.from("todos").delete().eq("username", oldUsername),
          supabase.from("goals").delete().eq("username", oldUsername),
          supabase.from("wishes").delete().eq("username", oldUsername),
          supabase.from("profiles").delete().eq("username", oldUsername),
        ]);

        this.users.splice(userIndex, 1);
        this.currentUser = null;
        sessionStorage.removeItem("genshin_current_user");

        useTodoStore().loadData();
        useGachaStore().loadData();
        useGoalStore().loadData();

        return { success: true };
      } catch (error) {
        console.error(
          "[Auth Store] Failed to delete account in Supabase:",
          error,
        );
        return {
          success: false,
          message: `Account deletion failed: ${error.message}`,
        };
      }
    },
  },
});
