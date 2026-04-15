import { defineStore } from 'pinia'

export const useGachaStore = defineStore('gacha', {
    state: () => ({
        primogerms: 1600,
        wishes: 0,
        four_star_pity: 0, //Maybe not needed
        five_star_pity: 0,
        five_star_gauaranteed: false,
        pullHistory: []
    }),
    actions: {
        add_pull(item) {
            this.pullHistory.push(item);
            this.five_star_pity++;
            if (item.rarity === 4) {
                this.four_star_pity = 0;
            } else {
                this.four_star_pity++;
            }
            if (item.rarity === 5) {
                this.five_star_pity = 0;
                this.five_star_gauaranteed = false;
            } else if (this.five_star_pity >= 90) {
                this.five_star_pity = 0;
                this.five_star_gauaranteed = true;
            }
        }
    }
});