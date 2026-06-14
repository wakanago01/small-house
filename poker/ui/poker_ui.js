/**
 * 画面の描画とユーザー入力を担当
 */
class PokerUI {
    constructor(gameInstance) {
        this.game = gameInstance;
        this.suitMap = { 'S': '♠', 'H': '♥', 'D': '♦', 'C': '♣' };
    }

    clear() {
        document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    }

    showScreen(id) {
        this.clear();
        document.getElementById(id).classList.remove('hidden');
    }

    updateRenga(val) {
        document.getElementById('current-renga').innerText = val.toLocaleString();
    }

    updateBet(val) {
        document.getElementById('bet-amount').innerText = val.toLocaleString();
        document.getElementById('info-bet').innerText = val.toLocaleString();
    }

    renderPlayerHand(hand, selectable = true) {
        const container = document.getElementById('player-hand');
        container.innerHTML = '';
        hand.forEach((card, i) => {
            const cardEl = document.createElement('div');
            const color = (card.suit === 'H' || card.suit === 'D') ? 'red' : 'black';
            cardEl.className = `card ${color}`;
            cardEl.innerHTML = `
                <div class="rank">${card.rank}</div>
                <div class="suit" style="font-size:2.5rem">${this.suitMap[card.suit]}</div>
                <div class="rank" style="transform: rotate(180deg)">${card.rank}</div>
            `;
            if (selectable) {
                cardEl.onclick = () => {
                    cardEl.classList.toggle('selected');
                    this.game.toggleSelection(i);
                };
            }
            container.appendChild(cardEl);
        });
    }

    renderCpuHands(hands, hidden = true) {
        const container = document.getElementById('cpu-area');
        container.innerHTML = '';
        hands.forEach((hand, i) => {
            const cpuEl = document.createElement('div');
            cpuEl.className = 'cpu-player';
            cpuEl.innerHTML = `<h4 style="text-shadow:2px 2px 4px #000">CPU ${i+1}</h4><div class="hand cpu-hand"></div>`;
            const handEl = cpuEl.querySelector('.cpu-hand');
            hand.forEach(card => {
                const cardEl = document.createElement('div');
                if (hidden) {
                    cardEl.className = 'card back';
                    cardEl.innerHTML = '<div style="font-size:3rem">🌙</div>';
                } else {
                    const color = (card.suit === 'H' || card.suit === 'D') ? 'red' : 'black';
                    cardEl.className = `card ${color}`;
                    cardEl.style.transform = 'scale(0.8)';
                    cardEl.innerHTML = `
                        <div class="rank">${card.rank}</div>
                        <div class="suit">${this.suitMap[card.suit]}</div>
                    `;
                }
                handEl.appendChild(cardEl);
            });
            container.appendChild(cpuEl);
        });
    }

    showResult(result, pRank, bet) {
        const titleEl = document.getElementById('result-title');
        if (result === "WIN") {
            titleEl.innerText = "勝利！";
            titleEl.style.color = "var(--star-gold)";
        } else if (result === "LOSE") {
            titleEl.innerText = "敗北...";
            titleEl.style.color = "#ff4444";
        } else {
            titleEl.innerText = "引き分け";
            titleEl.style.color = "white";
        }
        
        const detailEl = document.getElementById('result-details');
        const rankName = PokerHand.RANK_NAMES[pRank];
        detailEl.innerHTML = `
            <div>役：${rankName}</div>
            <div style="font-size:3rem; margin-top:10px;">${result === "WIN" ? '+' : (result === "LOSE" ? '-' : '')}${bet.toLocaleString()} Renga</div>
        `;
        this.showScreen('result-screen');
    }

    showOverlay(title, content) {
        document.getElementById('overlay-text').innerHTML = `<h2>${title}</h2><hr>${content}`;
        document.getElementById('overlay').classList.remove('hidden');
    }

    hideOverlay() {
        document.getElementById('overlay').classList.add('hidden');
    }
}
