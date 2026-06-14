/**
 * プレイヤーデータを共通管理するクラス
 */
class PlayerManager {
    constructor(initialData) {
        const saved = SaveManager.load();
        this.data = saved || initialData;
    }

    get renga() { return this.data.renga; }
    set renga(val) {
        this.data.renga = val;
        SaveManager.save(this.data);
    }

    get dataCopy() {
        return JSON.parse(JSON.stringify(this.data));
    }
}
