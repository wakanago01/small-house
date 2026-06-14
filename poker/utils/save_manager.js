/**
 * データの保存・読み込みを管理する
 */
const SaveManager = {
    SAVE_KEY: 'small-house-data',

    load() {
        const data = localStorage.getItem(this.SAVE_KEY);
        return data ? JSON.parse(data) : null;
    },

    save(data) {
        localStorage.setItem(this.SAVE_KEY, JSON.stringify(data));
    }
};
