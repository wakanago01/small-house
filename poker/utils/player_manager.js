/**
 * プレイヤーデータを共通管理するクラス
 * ※ home の localStorage (small_house_game_state) と同じストアを参照するため
 *    renga は data.coins にマッピングされる
 */
class PlayerManager {
    constructor(initialData) {
        const saved = SaveManager.load();
        this.data = saved || initialData;

        // 古いデータ互換: rengaフィールドだけ存在してcoinsがない場合の移行処理
        if (this.data.renga !== undefined && this.data.coins === undefined) {
            this.data.coins = this.data.renga;
        }
    }

    // renga は home の coins フィールドと紐づく
    get renga() { return this.data.coins || 0; }
    set renga(val) {
        this.data.coins = val;
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
