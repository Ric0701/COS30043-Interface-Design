import { defineStore } from 'pinia'

export const useGachaStore = defineStore('gacha', {
    state: () => ({
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

            // let new5Pity = 0;
            // let new4Pity = 0;

            // for (const pull of historyArray) {
            //     if (pull.rarity === 5) {
            //         new5Pity = 0;
            //         new4Pity++;
            //     } else if (pull.rarity === 4) {
            //         new4Pity = 0;
            //         new5Pity++;
            //     } else {
            //         new5Pity++;
            //         new4Pity++;
            //     }
            // }

            // this[`${type}_five_star_pity`] = new5Pity;
            // this[`${type}_four_star_pity`] = new4Pity;
        },

        force_update_pity(payload) {
            const type = payload.type;
            this[`${type}_five_star_pity`] = payload.fivePity;
            this[`${type}_four_star_pity`] = payload.fourPity;
        }
    }
});