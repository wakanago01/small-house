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
        this.save();
    }

    get stress() { return this.data.stress || 0; }
    set stress(val) {
        this.data.stress = Math.max(0, Math.min(100, val));
        this.save();
    }

    get hunger() { return this.data.hunger || 100; }
    set hunger(val) {
        this.data.hunger = Math.max(0, Math.min(100, val));
        this.save();
    }

    save() {
        SaveManager.save(this.data);
    }

    get dataCopy() {
        return JSON.parse(JSON.stringify(this.data));
    }
}
