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
        document.getElementById('current-renga').innerText = val;
    }

    updateBet(val) {
        document.getElementById('bet-amount').innerText = val;
        document.getElementById('info-bet').innerText = val;
    }

    renderPlayerHand(hand, selectable = true) {
        const container = document.getElementById('player-hand');
        container.innerHTML = '';
        hand.forEach((card, i) => {
            const cardEl = document.createElement('div');
            const color = (card.suit === 'H' || card.suit === 'D') ? 'red' : 'black';
            cardEl.className = `card ${color}`;
            cardEl.innerHTML = `<div>${this.suitMap[card.suit]}</div><div>${card.rank}</div>`;
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
            cpuEl.innerHTML = `<h4>CPU ${i+1}</h4><div class="hand cpu-hand"></div>`;
            const handEl = cpuEl.querySelector('.cpu-hand');
            hand.forEach(card => {
                const cardEl = document.createElement('div');
                cardEl.className = 'card';
                if (hidden) {
                    cardEl.innerHTML = '🌙';
                    cardEl.style.background = '#4b0082';
                } else {
                    const color = (card.suit === 'H' || card.suit === 'D') ? 'red' : 'black';
                    cardEl.className += ` ${color}`;
                    cardEl.innerHTML = `<div>${this.suitMap[card.suit]}</div><div>${card.rank}</div>`;
                }
                handEl.appendChild(cardEl);
            });
            container.appendChild(cpuEl);
        });
    }

    showResult(result, pRank, bet) {
        const titleEl = document.getElementById('result-title');
        titleEl.innerText = result === "WIN" ? "✨ YOU WIN! ✨" : (result === "LOSE" ? "闇に飲まれました..." : "DRAW");
        titleEl.className = `result-title ${result}`;
        
        const detailEl = document.getElementById('result-details');
        detailEl.innerHTML = `
            <p>役: <strong>${PokerHand.RANK_NAMES[pRank]}</strong></p>
            <p>${result === "WIN" ? '+' : (result === "LOSE" ? '-' : '')}${bet} Renga</p>
        `;
        this.showScreen('result-screen');
    }

    showOverlay(title, content) {
        document.getElementById('overlay-text').innerHTML = `<h3>${title}</h3>${content}`;
        document.getElementById('overlay').classList.remove('hidden');
    }
}
