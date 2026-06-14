import json
import os

class SaveManager:
    """
    セーブデータの読み書きを管理するクラス。
    JSON形式でプレイヤーのステータスを保存します。
    """
    SAVE_FILE = "data/save.json"

    @classmethod
    def load(cls):
        if not os.path.exists(cls.SAVE_FILE):
            return {"renga": 50000, "hunger": 100, "items": []}
        try:
            with open(cls.SAVE_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {"renga": 50000, "hunger": 100, "items": []}

    @classmethod
    def save(cls, data):
        os.makedirs(os.path.dirname(cls.SAVE_FILE), exist_ok=True)
        with open(cls.SAVE_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=4, ensure_ascii=False)
