import { defineStore } from 'pinia'
import { useAuthStore } from './data/auth_store';

export const useGachaStore = defineStore('gacha', {
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
        standard_five_star_pity: 0
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
            const authStore = useAuthStore()
            if (!authStore.currentUser) {
                this.resetData()
                return
            }
            const data = localStorage.getItem(`gacha_${authStore.currentUser}`)
            if (data) {
                Object.assign(this, JSON.parse(data))
            } else {
                this.resetData()
            }
        },
        saveData() {
            const authStore = useAuthStore()
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
                standard_five_star_pity: this.standard_five_star_pity
            };
            localStorage.setItem(`gacha_${authStore.currentUser}`, JSON.stringify(dataToSave));
        },
        async fetch_game_data() {
            if (this.character_list.length > 0 && this.weapon_list.length > 0) return;

            this.is_fetching_data = true;
            try {
                const [charResponse, weaponResponse] = await Promise.all([
                    fetch('/data/characters.json'),
                    fetch('/data/weaponList.json')
                ])

                if (!charResponse.ok || !weaponResponse.ok) throw new Error("Failed to load local database")

                const charData = await charResponse.json()
                const weaponData = await weaponResponse.json()
                
                const parseRarity = (item) => {
                    let numericRarity = 5; 
                    if (item.rarity === 'rare' || item.rarity === 4) numericRarity = 4
                    else if (typeof item.rarity === 'number') numericRarity = item.rarity
                    
                    return {
                        name: item.id,
                        rarity: numericRarity
                    }
                }

                this.character_list = charData.map(parseRarity).sort((a, b) => {
                    if (a.rarity !== b.rarity) {
                        return a.rarity - b.rarity
                    }
                    return a.name.localeCompare(b.name)
                })
                this.weapon_list = weaponData.map(parseRarity).sort((a, b) => {
                    if (a.rarity !== b.rarity) {
                        return a.rarity - b.rarity
                    }
                    return a.name.localeCompare(b.name)
                })
            } catch (error) {
                console.error("Database error:", error);
            } finally {
                this.is_fetching_data = false;
            }
        },

        async fetch_codes_data() {
            if (this.codes_list.length > 0) return;
            try {
                const response = await fetch('/data/codes.json');
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

            this[`${type}_lifetime_pulls`].push( item );

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

            this.saveData()
        },

        remove_pull(payload) {
            const type = payload.type;
            const historyArray = this[`${type}_lifetime_pulls`];
    
            if (historyArray.length === 0) {
                this[`${type}_five_star_pity`] = Math.max(0, this[`${type}_five_star_pity`] - 1);
                this[`${type}_four_star_pity`] = Math.max(0, this[`${type}_four_star_pity`] - 1);
                return;
            }

            const poppedItem = historyArray.pop();
            this[`${type}_five_star_pity`] = poppedItem.previous_five_star_pity;
            this[`${type}_four_star_pity`] = poppedItem.previous_four_star_pity;

            this.saveData()
        },

        force_update_pity(payload) {
            const type = payload.type;
            this[`${type}_five_star_pity`] = payload.fivePity;
            this[`${type}_four_star_pity`] = payload.fourPity;

            this.saveData()
        }
    }
});