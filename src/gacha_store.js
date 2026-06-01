import { defineStore } from "pinia";
import { useAuthStore } from "./data/auth_store";

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
      this.limited_weapon_lifetime_pulls = [];
      this.limited_weapon_four_star_pity = 0;
      this.limited_weapon_five_star_pity = 0;
      this.standard_lifetime_pulls = [];
      this.standard_four_star_pity = 0;
      this.standard_five_star_pity = 0;
    },
    loadData() {
      const authStore = useAuthStore();
      if (!authStore.currentUser) {
        this.resetData();
        return;
      }
      const data = localStorage.getItem(`gacha_${authStore.currentUser}`);
      if (data) {
        Object.assign(this, JSON.parse(data));
      } else {
        this.resetData();
      }
    },
    saveData() {
      const authStore = useAuthStore();
      if (!authStore.currentUser) return;

      const dataToSave = {
        limited_character_lifetime_pulls: this.limited_character_lifetime_pulls,
        limited_character_four_star_pity: this.limited_character_four_star_pity,
        limited_character_five_star_pity: this.limited_character_five_star_pity,
        limited_weapon_lifetime_pulls: this.limited_weapon_lifetime_pulls,
        limited_weapon_four_star_pity: this.limited_weapon_four_star_pity,
        limited_weapon_five_star_pity: this.limited_weapon_five_star_pity,
        standard_lifetime_pulls: this.standard_lifetime_pulls,
        standard_four_star_pity: this.standard_four_star_pity,
        standard_five_star_pity: this.standard_five_star_pity,
      };
      localStorage.setItem(
        `gacha_${authStore.currentUser}`,
        JSON.stringify(dataToSave),
      );
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

    add_pull(item) {
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

      this.saveData();
    },

    remove_pull(payload) {
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
        return;
      }

      const poppedItem = historyArray.pop();
      this[`${type}_five_star_pity`] = poppedItem.previous_five_star_pity;
      this[`${type}_four_star_pity`] = poppedItem.previous_four_star_pity;

      this.saveData();
    },

    force_update_pity(payload) {
      const type = payload.type;
      this[`${type}_five_star_pity`] = payload.fivePity;
      this[`${type}_four_star_pity`] = payload.fourPity;

      this.saveData();
    },

    _getBannerPullCosts(pulls) {
      let costs = [];
      let lastFiveStarIndex = -1;
      for (let i = 0; i < pulls.length; i++) {
        const pull = pulls[i];
        if (pull.rarity === 5) {
          const r = i - (lastFiveStarIndex + 1);
          const p = pull.pity || (pull.previous_five_star_pity !== undefined ? pull.previous_five_star_pity + 1 : 1);
          const weight = Math.max(1, p - r);
          costs.push({
            pull,
            cost: weight * 160
          });
          lastFiveStarIndex = i;
        } else {
          costs.push({
            pull,
            cost: 160
          });
        }
      }
      return costs;
    },

    loadDemoData() {
      this.resetData();
      
      // Character Banner simulation (March)
      for (let i = 0; i < 40; i++) {
        this.add_pull({ rarity: 3, name: "Unknown", type: "limited_character", time: `2026-03-10T12:${i < 10 ? '0' + i : i}` });
      }
      this.add_pull({ rarity: 4, name: "Bennett", type: "limited_character", time: "2026-03-10T13:00" });
      for (let i = 0; i < 35; i++) {
        this.add_pull({ rarity: 3, name: "Unknown", type: "limited_character", time: `2026-03-15T15:${i < 10 ? '0' + i : i}` });
      }
      this.add_pull({ rarity: 5, name: "Chasca", type: "limited_character", time: "2026-03-15T16:00", pity: 76 });

      // Next character block (April)
      for (let i = 0; i < 79; i++) {
        this.add_pull({ rarity: i % 10 === 9 ? 4 : 3, name: i % 10 === 9 ? "Xiangling" : "Unknown", type: "limited_character", time: `2026-04-20T10:${i < 10 ? '0' + i : i}` });
      }
      this.add_pull({ rarity: 5, name: "Linnea", type: "limited_character", time: "2026-04-20T11:00", pity: 80 });

      // Next character block (May, lucky early)
      for (let i = 0; i < 34; i++) {
        this.add_pull({ rarity: i % 10 === 9 ? 4 : 3, name: i % 10 === 9 ? "Kuki Shinobu" : "Unknown", type: "limited_character", time: `2026-05-05T08:${i < 10 ? '0' + i : i}` });
      }
      this.add_pull({ rarity: 5, name: "Mualani", type: "limited_character", time: "2026-05-05T09:00", pity: 35 });

      // Weapon Banner simulation (May)
      for (let i = 0; i < 64; i++) {
        this.add_pull({ rarity: i % 10 === 9 ? 4 : 3, name: i % 10 === 9 ? "Sacrificial Sword" : "Unknown", type: "limited_weapon", time: `2026-05-18T14:${i < 10 ? '0' + i : i}` });
      }
      this.add_pull({ rarity: 5, name: "Astral Vulture's Crimson Plumage", type: "limited_weapon", time: "2026-05-18T15:00", pity: 65 });

      // Standard Banner simulation (June)
      for (let i = 0; i < 79; i++) {
        this.add_pull({ rarity: i % 10 === 9 ? 4 : 3, name: i % 10 === 9 ? "Favonius Bow" : "Unknown", type: "standard", time: `2026-06-01T09:${i < 10 ? '0' + i : i}` });
      }
      this.add_pull({ rarity: 5, name: "Diluc", type: "standard", time: "2026-06-01T10:00", pity: 80 });

      this.saveData();
    },
  },

  getters: {
    allPullsWithCosts() {
      const charCosts = this._getBannerPullCosts(this.limited_character_lifetime_pulls).map(item => ({
        ...item,
        bannerType: "limited_character",
        bannerLabel: "Limited Character"
      }));
      const weaponCosts = this._getBannerPullCosts(this.limited_weapon_lifetime_pulls).map(item => ({
        ...item,
        bannerType: "limited_weapon",
        bannerLabel: "Limited Weapon"
      }));
      const stdCosts = this._getBannerPullCosts(this.standard_lifetime_pulls).map(item => ({
        ...item,
        bannerType: "standard",
        bannerLabel: "Standard"
      }));
      return [...charCosts, ...weaponCosts, ...stdCosts];
    },

    monthlySpendingTrend() {
      const pulls = this.allPullsWithCosts;
      const groups = {};
      pulls.forEach(item => {
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
        .map(key => ({
          month: key,
          amount: groups[key]
        }));
    },

    costPerFiveStar() {
      const result = [];
      const banners = [
        { list: this.limited_character_lifetime_pulls, label: "Limited Character" },
        { list: this.limited_weapon_lifetime_pulls, label: "Limited Weapon" },
        { list: this.standard_lifetime_pulls, label: "Standard" }
      ];

      banners.forEach(({ list, label }) => {
        let lastFiveStarIndex = -1;
        for (let i = 0; i < list.length; i++) {
          const pull = list[i];
          if (pull.rarity === 5) {
            const r = i - (lastFiveStarIndex + 1);
            const p = pull.pity || (pull.previous_five_star_pity !== undefined ? pull.previous_five_star_pity + 1 : 1);
            result.push({
              name: pull.name || "Unknown 5★",
              pity: p,
              cost: p * 160,
              time: pull.time || "Unknown Date",
              banner: label
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

      pulls.forEach(item => {
        if (item.bannerType === "limited_character") charTotal += item.cost;
        else if (item.bannerType === "limited_weapon") weaponTotal += item.cost;
        else if (item.bannerType === "standard") stdTotal += item.cost;
      });

      const grandTotal = charTotal + weaponTotal + stdTotal;
      const getPercent = (amount) => grandTotal > 0 ? parseFloat(((amount / grandTotal) * 100).toFixed(1)) : 0;

      return [
        { category: "Limited Character", amount: charTotal, percentage: getPercent(charTotal) },
        { category: "Limited Weapon", amount: weaponTotal, percentage: getPercent(weaponTotal) },
        { category: "Standard", amount: stdTotal, percentage: getPercent(stdTotal) }
      ];
    }
  }
});
