from utils.save_manager import SaveManager

class PlayerManager:
    """
    プレイヤーデータを保持・管理するクラス。
    各ミニゲームから共通して利用されます。
    """
    def __init__(self):
        self.data = SaveManager.load()

    def get_renga(self):
        return self.data.get("renga", 0)

    def update_renga(self, amount):
        """所持Rengaを更新し、保存する。"""
        self.data["renga"] += amount
        SaveManager.save(self.data)
        return self.data["renga"]

    def get_data(self):
        return self.data

    def set_data(self, data):
        self.data = data
        SaveManager.save(self.data)
