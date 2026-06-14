/**
 * ポーカーの手札判定とデッキ管理（純粋なロジック）
 */

class Card {
    constructor(suit, rank) {
        this.suit = suit;
        this.rank = rank;
        this.value = this.getValue(rank);
    }
    getValue(rank) {
        const v = { '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14 };
        return v[rank];
    }
}

class Deck {
    constructor() {
        const suits = ['S', 'H', 'D', 'C'];
        const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
        this.cards = suits.flatMap(s => ranks.map(r => new Card(s, r)));
        this.shuffle();
    }
    shuffle() {
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }
    draw() { return this.cards.pop(); }
}

const PokerHand = {
    RANK_NAMES: ["ハイカード", "ワンペア", "ツーペア", "スリーカード", "ストレート", "フラッシュ", "フルハウス", "フォーカード", "ストレートフラッシュ", "ロイヤルストレートフラッシュ"],
    
    evaluate(cards) {
        const values = cards.map(c => c.value).sort((a, b) => b - a);
        const suits = cards.map(c => c.suit);
        const counts = values.reduce((acc, v) => (acc[v] = (acc[v] || 0) + 1, acc), {});
        const sortedCounts = Object.entries(counts).sort((a, b) => b[1] - a[1] || b[0] - a[0]);
        const isFlush = new Set(suits).size === 1;
        let isStraight = new Set(values).size === 5 && (values[0] - values[4] === 4);
        if (!isStraight && values.join(',') === '14,5,4,3,2') isStraight = true;

        if (isFlush && isStraight && values[0] === 14 && values[4] === 10) return [9, values];
        if (isFlush && isStraight) return [8, values];
        if (sortedCounts[0][1] === 4) return [7, [Number(sortedCounts[0][0])]];
        if (sortedCounts[0][1] === 3 && sortedCounts[1][1] === 2) return [6, [Number(sortedCounts[0][0])]];
        if (isFlush) return [5, values];
        if (isStraight) return [4, values];
        if (sortedCounts[0][1] === 3) return [3, [Number(sortedCounts[0][0])]];
        if (sortedCounts[0][1] === 2 && sortedCounts[1][1] === 2) return [2, [Number(sortedCounts[0][0]), Number(sortedCounts[1][0])]];
        if (sortedCounts[0][1] === 2) return [1, [Number(sortedCounts[0][0])]];
        return [0, values];
    }
};
