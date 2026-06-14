import random
from collections import Counter

class Card:
    """
    トランプのカード1枚を表すクラス。
    """
    SUITS = ["♠", "♥", "♦", "♣"]
    RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"]
    RANK_VALUES = {r: i for i, r in enumerate(RANKS, 2)}

    def __init__(self, suit, rank):
        self.suit = suit
        self.rank = rank
        self.value = self.RANK_VALUES[rank]

    def __repr__(self):
        return f"{self.suit}{self.rank}"

class Deck:
    """
    52枚のトランプを管理するデッキクラス。
    """
    def __init__(self):
        self.cards = [Card(s, r) for s in Card.SUITS for r in Card.RANKS]
        random.shuffle(self.cards)

    def draw(self):
        return self.cards.pop() if self.cards else None

class PokerHand:
    """
    手札の役判定と強さ比較を行うクラス。
    """
    ROYAL_FLUSH = 9
    STRAIGHT_FLUSH = 8
    FOUR_OF_A_KIND = 7
    FULL_HOUSE = 6
    FLUSH = 5
    STRAIGHT = 4
    THREE_OF_A_KIND = 3
    TWO_PAIR = 2
    ONE_PAIR = 1
    HIGH_CARD = 0

    RANK_NAMES = {
        9: "ロイヤルストレートフラッシュ",
        8: "ストレートフラッシュ",
        7: "フォーカード",
        6: "フルハウス",
        5: "フラッシュ",
        4: "ストレート",
        3: "スリーカード",
        2: "ツーペア",
        1: "ワンペア",
        0: "ハイカード"
    }

    @classmethod
    def evaluate(cls, cards):
        """
        手札(5枚)の役を判定し、(役の強さ, 比較用カード値リスト)を返す。
        """
        values = sorted([c.value for c in cards], reverse=True)
        suits = [c.suit for c in cards]
        counts = Counter(values)
        sorted_counts = counts.most_common()
        
        # フラッシュとストレートの判定
        is_flush = len(set(suits)) == 1
        is_straight = len(set(values)) == 5 and (max(values) - min(values) == 4)
        
        # A,2,3,4,5 のストレート対応
        if not is_straight and set(values) == {14, 2, 3, 4, 5}:
            is_straight = True
            values = [5, 4, 3, 2, 1] # Aを1として扱う
        
        # 役判定
        if is_flush and is_straight and max(values) == 14:
            return cls.ROYAL_FLUSH, values
        if is_flush and is_straight:
            return cls.STRAIGHT_FLUSH, values
        
        if sorted_counts[0][1] == 4:
            return cls.FOUR_OF_A_KIND, [sorted_counts[0][0], sorted_counts[1][0]]
        
        if sorted_counts[0][1] == 3 and sorted_counts[1][1] == 2:
            return cls.FULL_HOUSE, [sorted_counts[0][0], sorted_counts[1][0]]
        
        if is_flush:
            return cls.FLUSH, values
        
        if is_straight:
            return cls.STRAIGHT, values
        
        if sorted_counts[0][1] == 3:
            return cls.THREE_OF_A_KIND, [sorted_counts[0][0]] + sorted([c for c, n in sorted_counts[1:]], reverse=True)
        
        if sorted_counts[0][1] == 2 and sorted_counts[1][1] == 2:
            pairs = sorted([sorted_counts[0][0], sorted_counts[1][0]], reverse=True)
            kicker = sorted_counts[2][0]
            return cls.TWO_PAIR, pairs + [kicker]
        
        if sorted_counts[0][1] == 2:
            pair = sorted_counts[0][0]
            kickers = sorted([c for c, n in sorted_counts[1:]], reverse=True)
            return cls.ONE_PAIR, [pair] + kickers
        
        return cls.HIGH_CARD, values

class PokerGame:
    """
    ポーカーの進行・ルール管理を行うクラス。
    """
    def __init__(self, difficulty="Easy"):
        self.deck = Deck()
        self.difficulty = difficulty
        self.player_hand = []
        self.cpu_hands = []
        self.cpu_count = 1 if difficulty == "Easy" else 3
        
    def start(self):
        """カードを配布する。"""
        self.player_hand = [self.deck.draw() for _ in range(5)]
        self.cpu_hands = [[self.deck.draw() for _ in range(5)] for _ in range(self.cpu_count)]
        
    def exchange_player_cards(self, indices):
        """プレイヤーのカードを交換する。"""
        for i in sorted(indices, reverse=True):
            if 0 <= i < 5:
                self.player_hand[i] = self.deck.draw()
                
    def exchange_cpu_cards(self):
        """
        CPUのカード交換ロジック。
        仕様に基づいた思考を行う。
        """
        for i in range(len(self.cpu_hands)):
            hand = self.cpu_hands[i]
            rank, _ = PokerHand.evaluate(hand)
            
            indices_to_replace = []
            if rank >= PokerHand.FULL_HOUSE:
                # フルハウス以上は交換しない
                pass
            elif rank == PokerHand.THREE_OF_A_KIND:
                # 3枚以外を交換
                counts = Counter([c.value for c in hand])
                three_val = [v for v, c in counts.items() if c == 3][0]
                indices_to_replace = [idx for idx, c in enumerate(hand) if c.value != three_val]
            elif rank == PokerHand.TWO_PAIR:
                # 1枚だけ交換
                counts = Counter([c.value for c in hand])
                pair_vals = [v for v, c in counts.items() if c == 2]
                indices_to_replace = [idx for idx, c in enumerate(hand) if c.value not in pair_vals]
            elif rank == PokerHand.ONE_PAIR:
                # ペア以外を交換
                counts = Counter([c.value for c in hand])
                pair_val = [v for v, c in counts.items() if c == 2][0]
                indices_to_replace = [idx for idx, c in enumerate(hand) if c.value != pair_val]
            else:
                # 役なし: ランダムに2〜3枚交換
                count = random.randint(2, 3)
                indices_to_replace = random.sample(range(5), count)
                
            for idx in indices_to_replace:
                self.cpu_hands[i][idx] = self.deck.draw()

    def determine_winners(self):
        """
        勝敗を判定し、順位(プレイヤーが勝利したか等)を返す。
        """
        p_rank, p_vals = PokerHand.evaluate(self.player_hand)
        p_score = (p_rank, p_vals)
        
        cpu_scores = []
        for h in self.cpu_hands:
            rank, vals = PokerHand.evaluate(h)
            cpu_scores.append((rank, vals))
            
        # プレイヤーと各CPUを比較
        # TrueならプレイヤーがそのCPUより強い
        results = []
        for cs in cpu_scores:
            if p_score > cs:
                results.append(1) # Win
            elif p_score < cs:
                results.append(-1) # Lose
            else:
                results.append(0) # Draw
        
        # 全員に勝利したか、一人にでも負けたか
        if all(r == 1 for r in results):
            return "WIN"
        elif any(r == -1 for r in results):
            return "LOSE"
        else:
            return "DRAW"
