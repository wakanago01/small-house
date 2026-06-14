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
        // カードをインデックス付きで保持
        const indexedCards = cards.map((c, i) => ({ card: c, index: i }));
        const values = indexedCards.map(ic => ic.card.value).sort((a, b) => b - a);
        const suits = indexedCards.map(ic => ic.card.suit);
        
        const counts = {};
        indexedCards.forEach(ic => counts[ic.card.value] = (counts[ic.card.value] || 0) + 1);
        
        const sortedCounts = Object.entries(counts).sort((a, b) => b[1] - a[1] || b[0] - a[0]);
        
        const isFlush = new Set(suits).size === 1;
        let isStraight = new Set(values).size === 5 && (values[0] - values[4] === 4);
        
        // A-5 Straight
        if (!isStraight && values.join(',') === '14,5,4,3,2') {
            isStraight = true;
        }

        let rank = 0;
        let rankIndices = [];
        let compareValues = values;

        if (isFlush && isStraight && values[0] === 14 && values[4] === 10) {
            rank = 9; rankIndices = [0,1,2,3,4];
        } else if (isFlush && isStraight) {
            rank = 8; rankIndices = [0,1,2,3,4];
        } else if (sortedCounts[0][1] === 4) {
            rank = 7;
            const val = Number(sortedCounts[0][0]);
            indexedCards.forEach(ic => { if (ic.card.value === val) rankIndices.push(ic.index); });
            compareValues = [val, Number(sortedCounts[1][0])];
        } else if (sortedCounts[0][1] === 3 && sortedCounts[1][1] === 2) {
            rank = 6;
            rankIndices = [0,1,2,3,4];
            compareValues = [Number(sortedCounts[0][0]), Number(sortedCounts[1][0])];
        } else if (isFlush) {
            rank = 5; rankIndices = [0,1,2,3,4];
        } else if (isStraight) {
            rank = 4; rankIndices = [0,1,2,3,4];
        } else if (sortedCounts[0][1] === 3) {
            rank = 3;
            const val = Number(sortedCounts[0][0]);
            indexedCards.forEach(ic => { if (ic.card.value === val) rankIndices.push(ic.index); });
            compareValues = [val, ...values.filter(v => v !== val)];
        } else if (sortedCounts[0][1] === 2 && sortedCounts[1][1] === 2) {
            rank = 2;
            const v1 = Number(sortedCounts[0][0]);
            const v2 = Number(sortedCounts[1][0]);
            indexedCards.forEach(ic => { if (ic.card.value === v1 || ic.card.value === v2) rankIndices.push(ic.index); });
            compareValues = [v1, v2, ...values.filter(v => v !== v1 && v !== v2)];
        } else if (sortedCounts[0][1] === 2) {
            rank = 1;
            const val = Number(sortedCounts[0][0]);
            indexedCards.forEach(ic => { if (ic.card.value === val) rankIndices.push(ic.index); });
            compareValues = [val, ...values.filter(v => v !== val)];
        }

        return { rank, compareValues, rankIndices };
    }
};
