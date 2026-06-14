from utils.player_manager import PlayerManager
from ui.poker_ui import PokerUI
from games.poker import PokerGame

def start_game(player_data):
    """
    ポーカーの開始関数。仕様に基づいたエントリーポイント。
    
    Args:
        player_data (dict): プレイヤーのステータスデータ
    Returns:
        dict: 更新後のプレイヤーデータ
    """
    manager = PlayerManager()
    manager.set_data(player_data)
    
    while True:
        choice = PokerUI.show_main_menu()
        
        if choice == "1":
            # ゲーム本編
            play_poker(manager)
        elif choice == "2":
            PokerUI.show_how_to_play()
        elif choice == "3":
            PokerUI.show_hand_ranks()
        elif choice == "4":
            break
            
    return manager.get_data()

def play_poker(manager):
    """
    ポーカーの1ゲーム（ベット〜勝敗判定）の流れを制御する。
    """
    while True:
        difficulty = PokerUI.select_difficulty()
        bet = PokerUI.place_bet(manager.get_renga())
        
        # ゲーム初期化
        game = PokerGame(difficulty)
        game.start()
        
        # 1. プレイヤーのカード交換
        PokerUI.display_game_screen(game.player_hand, bet, "カードを選んで交換してね。")
        indices = PokerUI.select_exchange_cards()
        game.exchange_player_cards(indices)
        
        # 2. CPUのカード交換
        game.exchange_cpu_cards()
        
        # 3. 勝敗判定
        result = game.determine_winners()
        
        # 4. 配当
        if result == "WIN":
            manager.update_renga(bet)
        elif result == "LOSE":
            manager.update_renga(-bet)
            
        # 5. 結果表示
        choice = PokerUI.show_result(game.player_hand, game.cpu_hands, result, bet)
        
        if choice == "2": # カジノへ戻る
            break
        # 1の場合はループしてもう一度

if __name__ == "__main__":
    # 単体実行時のテストコード
    pm = PlayerManager()
    start_game(pm.get_data())
