import os
import time
from games.poker import PokerHand, PokerGame

class PokerUI:
    """
    ポーカーの表示と入力を管理するクラス。
    夢かわいい世界観をテキストで演出します。
    """
    PURPLE = "\033[95m"
    CYAN = "\033[96m"
    GOLD = "\033[93m"
    RESET = "\033[0m"
    PINK = "\033[91m"

    @classmethod
    def clear(cls):
        os.system('cls' if os.name == 'nt' else 'clear')

    @classmethod
    def print_header(cls, title):
        print(f"{cls.PURPLE}🌙✨ * . : · {title} · : . * ✨🌙{cls.RESET}\n")

    @classmethod
    def show_main_menu(cls):
        cls.clear()
        cls.print_header("月夜のポーカー")
        print(f"{cls.CYAN}1. ゲーム開始 🎀")
        print(f"2. 遊び方 🌙")
        print(f"3. 役一覧 ⭐")
        print(f"4. 戻る{cls.RESET}\n")
        return input("選びたい星の番号を教えて？ > ")

    @classmethod
    def show_how_to_play(cls):
        cls.clear()
        cls.print_header("遊び方")
        print(f"{cls.PINK}月夜のポーカーへようこそ。")
        print("Rengaを賭けて対戦相手と勝負します。")
        print("カードを交換して強い役を作り、")
        print(f"相手より強い手札を揃えましょう。{cls.RESET}\n")
        input("画面を閉じるにはEnterを押してね... ")

    @classmethod
    def show_hand_ranks(cls):
        cls.clear()
        cls.print_header("役一覧")
        ranks = [
            ("ロイヤルストレートフラッシュ", "同じマークで 10 J Q K A"),
            ("ストレートフラッシュ", "同じマークで連続した5枚"),
            ("フォーカード", "同じ数字4枚"),
            ("フルハウス", "スリーカード ＋ ワンペア"),
            ("フラッシュ", "同じマーク5枚"),
            ("ストレート", "数字が連続した5枚"),
            ("スリーカード", "同じ数字3枚"),
            ("ツーペア", "ペアが2組"),
            ("ワンペア", "ペアが1組"),
            ("ハイカード", "役なし")
        ]
        for name, desc in ranks:
            print(f"{cls.GOLD}✦ {name}{cls.RESET}")
            print(f"  {desc}")
        print()
        input("画面を閉じるにはEnterを押してね... ")

    @classmethod
    def select_difficulty(cls):
        cls.clear()
        cls.print_header("難易度選択")
        print("1. Easy   (CPU 1人)")
        print("2. Normal (CPU 3人)")
        choice = input("\n難易度を選んでね > ")
        return "Normal" if choice == "2" else "Easy"

    @classmethod
    def place_bet(cls, current_renga):
        bet = 10
        while True:
            cls.clear()
            cls.print_header("ベットタイム")
            print(f"{cls.PURPLE}所持Renga：{current_renga}{cls.RESET}")
            print(f"{cls.GOLD}現在のベット：{bet} Renga{cls.RESET}\n")
            print("[+] 10増やす")
            print("[-] 10減らす")
            print("[f] 決定")
            
            cmd = input("\n操作を選んでね (+ / - / f) > ").lower()
            if cmd == "+":
                if bet + 10 <= current_renga: bet += 10
            elif cmd == "-":
                if bet - 10 >= 10: bet -= 10
            elif cmd == "f":
                return bet

    @classmethod
    def display_game_screen(cls, player_hand, bet, message=""):
        cls.clear()
        cls.print_header("対局中")
        print(f"ベット額: {bet} Renga\n")
        
        # カードの表示
        print("あなたの手札:")
        card_str = "  ".join([f"[{c}]" for c in player_hand])
        print(f"{cls.CYAN}{card_str}{cls.RESET}")
        idx_str = "   ".join([f"({i})" for i in range(len(player_hand))])
        print(f"  {idx_str}\n")
        
        if message:
            print(f"{cls.PINK}>> {message}{cls.RESET}\n")

    @classmethod
    def select_exchange_cards(cls):
        print("交換したいカードの番号をスペース区切りで入力してね。")
        print("(例: 0 2 4 / 交換しない場合はそのままEnter)")
        val = input("> ")
        try:
            if not val.strip(): return []
            return [int(x) for x in val.split()]
        except ValueError:
            print("数字で入力してね。")
            return cls.select_exchange_cards()

    @classmethod
    def show_result(cls, player_hand, cpu_hands, result, bet):
        cls.clear()
        cls.print_header("結果発表")
        
        p_rank, _ = PokerHand.evaluate(player_hand)
        print(f"あなたの役: {cls.CYAN}{PokerHand.RANK_NAMES[p_rank]}{cls.RESET}")
        print(f"手札: {' '.join([str(c) for c in player_hand])}\n")
        
        for i, cpu_h in enumerate(cpu_hands):
            c_rank, _ = PokerHand.evaluate(cpu_h)
            print(f"CPU {i+1} の役: {PokerHand.RANK_NAMES[c_rank]}")
            print(f"  手札: {' '.join([str(c) for c in cpu_h])}")
        
        print("\n" + "="*30)
        if result == "WIN":
            print(f"{cls.GOLD}✨ あなたの勝利！ +{bet} Renga ✨{cls.RESET}")
        elif result == "LOSE":
            print(f"{cls.PINK}闇に飲まれました... -{bet} Renga{cls.RESET}")
        else:
            print(f"{cls.CYAN}引き分けです。 変動なし{cls.RESET}")
        print("="*30 + "\n")
        
        print("1. もう一度遊ぶ")
        print("2. カジノへ戻る")
        return input("どうする？ > ")
