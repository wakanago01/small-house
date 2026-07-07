/**
 * データの保存・読み込みを管理する
 */
const SaveManager = {
    SAVE_KEY: 'small_house_game_state',

    load() {
        const data = localStorage.getItem(this.SAVE_KEY);
        return data ? JSON.parse(data) : null;
    },

    save(data) {
        localStorage.setItem(this.SAVE_KEY, JSON.stringify(data));
    }
};
