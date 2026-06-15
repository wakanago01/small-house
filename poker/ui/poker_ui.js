/**
 * 画面の描画とユーザー入力を担当
 */
class PokerUI {
    constructor(gameInstance) {
        this.game = gameInstance;
        this.suitMap = { 'S': '♠', 'H': '♥', 'D': '♦', 'C': '♣' };
        
        // サウンドの設定
        this.sounds = {
            click: new Audio('assets/sound/click.mp3'),
            deal: new Audio('assets/sound/deal.mp3'),
            flip: new Audio('assets/sound/flip.mp3'),
            win: new Audio('assets/sound/win.mp3'),
            bgm: new Audio('assets/sound/bgm.mp3')
        };

        // ミュート状態の管理
        this.isMuted = false;

        // 音量を1/3程度に調整
        this.sounds.bgm.loop = true;
        this.setVolume();

        this.isBgmStarted = false;

        document.addEventListener('click', () => this.startBgm(), { once: true });
    }

    setVolume() {
        const bgmVol = this.isMuted ? 0 : 0.07;
        const seVol = this.isMuted ? 0 : 0.13;

        this.sounds.bgm.volume = bgmVol;
        Object.keys(this.sounds).forEach(k => {
            if (k !== 'bgm') this.sounds[k].volume = seVol;
        });
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        this.setVolume();
        
        // アイコンの更新
        const icon = document.getElementById('sound-icon');
        if (icon) {
            icon.innerText = this.isMuted ? '🔇' : '🔊';
        }

        // ミュート解除時にBGMが止まっていたら再生
        if (!this.isMuted && this.isBgmStarted) {
            this.sounds.bgm.play().catch(() => {});
        } else if (this.isMuted) {
            this.sounds.bgm.pause();
        }
        
        this.playAudio('click');
    }

    startBgm() {
        if (!this.isBgmStarted && !this.isMuted) {
            this.sounds.bgm.play()
                .then(() => {
                    this.isBgmStarted = true;
                })
                .catch(e => console.log("BGM pending user interaction or file missing:", e));
        } else if (!this.isBgmStarted && this.isMuted) {
            this.isBgmStarted = true; // ミュート中も開始フラグだけは立てる
        }
    }

    playAudio(name) {
        if (this.isMuted) return;
        const sound = this.sounds[name];
        if (sound) {
            sound.currentTime = 0;
            sound.play().catch(e => console.log(`${name} play failed:`, e));
        }
    }

    clear() {
        document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    }

    showScreen(id) {
        this.clear();
        document.getElementById(id).classList.remove('hidden');
        this.playAudio('click');
        this.startBgm();
    }

    updateRenga(val, stress = 0) {
        const formatted = val.toLocaleString();
        const targets = ['current-renga', 'permanent-renga'];
        targets.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.innerText = formatted;
        });
        this.updateStress(stress);
    }

    updateStress(val) {
        const fill = document.getElementById('stress-gauge-fill');
        if (fill) {
            fill.style.width = val + '%';
        }
    }

    updateBet(val) {
        document.getElementById('bet-amount').innerText = val.toLocaleString();
        const infoBet = document.getElementById('info-bet');
        if (infoBet) infoBet.innerText = val.toLocaleString();
        this.playAudio('click');
    }

    renderPlayerHand(hand, selectable = true, highlightIndices = [], currentRankName = "") {
        const container = document.getElementById('player-hand');
        container.innerHTML = '';
        
        let rankLabel = document.getElementById('player-current-rank');
        if (!rankLabel) {
            rankLabel = document.createElement('div');
            rankLabel.id = 'player-current-rank';
            rankLabel.className = 'player-rank-label';
            document.getElementById('play-screen').appendChild(rankLabel);
        }
        rankLabel.innerText = currentRankName || "";
        rankLabel.style.display = currentRankName ? "block" : "none";

        hand.forEach((card, i) => {
            const cardEl = document.createElement('div');
            const color = (card.suit === 'H' || card.suit === 'D') ? 'red' : 'black';
            cardEl.className = `card ${color}`;
            if (highlightIndices.includes(i)) cardEl.classList.add('highlight');
            
            cardEl.innerHTML = `
                <div class="rank">${card.rank}</div>
                <div class="suit">${this.suitMap[card.suit]}</div>
                <div class="rank" style="transform: rotate(180deg)">${card.rank}</div>
            `;
            if (selectable) {
                cardEl.onclick = () => {
                    cardEl.classList.toggle('selected');
                    this.game.toggleSelection(i);
                    this.playAudio('click');
                };
            }
            container.appendChild(cardEl);
        });
    }

    async dealInitialCards(playerHand, cpuHands) {
        // コンテナのクリア
        document.getElementById('player-hand').innerHTML = '';
        const cpuArea = document.getElementById('cpu-area');
        cpuArea.innerHTML = '';

        const isNormal = cpuHands.length === 3;
        const cpuContainers = cpuHands.map((hand, i) => {
            const cpuEl = document.createElement('div');
            cpuEl.className = isNormal ? `cpu-player pos-${i}` : `cpu-player pos-easy`;
            cpuEl.innerHTML = `
                <h4 style="text-shadow:2px 2px 4px #000; margin:5px; color:white;">CPU ${i+1}</h4>
                <div class="hand cpu-hand"></div>
            `;
            cpuArea.appendChild(cpuEl);
            return cpuEl.querySelector('.cpu-hand');
        });

        // 1枚ずつ順番に配る
        const totalCards = 5;
        for (let cardIdx = 0; cardIdx < totalCards; cardIdx++) {
            // CPUに配る
            for (let cpuIdx = 0; cpuIdx < cpuHands.length; cpuIdx++) {
                const cardEl = document.createElement('div');
                cardEl.className = 'card back deal-animation';
                cardEl.innerHTML = '<div style="font-size:2rem">🌙</div>';
                cpuContainers[cpuIdx].appendChild(cardEl);
                this.playAudio('deal');
                await new Promise(r => setTimeout(r, 80));
            }
            // プレイヤーに配る
            const card = playerHand[cardIdx];
            const color = (card.suit === 'H' || card.suit === 'D') ? 'red' : 'black';
            const cardEl = document.createElement('div');
            cardEl.className = `card ${color} deal-animation`;
            cardEl.innerHTML = `
                <div class="rank">${card.rank}</div>
                <div class="suit">${this.suitMap[card.suit]}</div>
                <div class="rank" style="transform: rotate(180deg)">${card.rank}</div>
            `;
            document.getElementById('player-hand').appendChild(cardEl);
            this.playAudio('deal');
            await new Promise(r => setTimeout(r, 80));
        }
        await new Promise(r => setTimeout(r, 500));
    }

    async flipCards(indices, newCards, currentHand, highlightIndices, rankName) {
        this.playAudio('flip');
        const container = document.getElementById('player-hand');
        const cardElements = container.querySelectorAll('.card');

        indices.forEach(idx => cardElements[idx].classList.add('flipping'));
        await new Promise(r => setTimeout(r, 400));

        indices.forEach((idx, i) => {
            const card = newCards[i];
            const color = (card.suit === 'H' || card.suit === 'D') ? 'red' : 'black';
            cardElements[idx].className = `card ${color} flipping`;
            cardElements[idx].innerHTML = `
                <div class="rank">${card.rank}</div>
                <div class="suit">${this.suitMap[card.suit]}</div>
                <div class="rank" style="transform: rotate(180deg)">${card.rank}</div>
            `;
        });

        const rankLabel = document.getElementById('player-current-rank');
        if (rankLabel) rankLabel.innerText = rankName;

        await new Promise(r => setTimeout(r, 50));
        indices.forEach(idx => cardElements[idx].classList.remove('flipping'));

        await new Promise(r => setTimeout(r, 600));
        this.renderPlayerHand(currentHand, false, highlightIndices, rankName);
    }

    async renderCpuHands(hands, hidden = true, highlightInfo = []) {
        const container = document.getElementById('cpu-area');
        const isNormal = hands.length === 3;
        
        if (hidden) {
            // 初期配布時などは一気に（あるいは非表示状態で）描画
            container.innerHTML = '';
            hands.forEach((hand, i) => {
                const cpuEl = document.createElement('div');
                cpuEl.className = isNormal ? `cpu-player pos-${i}` : `cpu-player pos-easy`;
                cpuEl.innerHTML = `
                    <h4 style="text-shadow:2px 2px 4px #000; margin:5px; color:white;">CPU ${i+1}</h4>
                    <div class="hand cpu-hand"></div>
                `;
                const handEl = cpuEl.querySelector('.cpu-hand');
                hand.forEach(() => {
                    const cardEl = document.createElement('div');
                    cardEl.className = 'card back';
                    cardEl.innerHTML = '<div style="font-size:2rem">🌙</div>';
                    handEl.appendChild(cardEl);
                });
                container.appendChild(cpuEl);
            });
        } else {
            // 勝負の開示：一人ずつ順番にめくる
            const cpuElements = container.querySelectorAll('.cpu-player');
            for (let i = 0; i < hands.length; i++) {
                const hand = hands[i];
                const cpuEl = cpuElements[i];
                const handEl = cpuEl.querySelector('.cpu-hand');
                
                let rankLabel = "";
                let currentHighlights = [];
                if (highlightInfo[i]) {
                    rankLabel = `<div class="cpu-rank-label">${PokerHand.RANK_NAMES[highlightInfo[i].rank]}</div>`;
                    currentHighlights = highlightInfo[i].rankIndices;
                }

                // 手札をクリアして表向きに再描画
                handEl.innerHTML = '';
                hand.forEach((card, cardIdx) => {
                    const cardEl = document.createElement('div');
                    const color = (card.suit === 'H' || card.suit === 'D') ? 'red' : 'black';
                    cardEl.className = `card ${color}`;
                    if (currentHighlights.includes(cardIdx)) cardEl.classList.add('highlight');
                    cardEl.innerHTML = `<div class="rank">${card.rank}</div><div class="suit">${this.suitMap[card.suit]}</div>`;
                    handEl.appendChild(cardEl);
                });

                // 役ラベルを表示
                const existingLabel = cpuEl.querySelector('.cpu-rank-label');
                if (existingLabel) existingLabel.remove();
                cpuEl.insertAdjacentHTML('beforeend', rankLabel);

                this.playAudio('flip');
                await new Promise(r => setTimeout(r, 800)); // 0.8秒待って次へ
            }
        }
    }

    showResult(result, pRank, bet, winnerMsg = "") {
        const titleEl = document.getElementById('result-title');
        titleEl.style.textAlign = "center";
        if (result === "WIN") {
            titleEl.innerText = "勝利！";
            titleEl.style.color = "var(--star-gold)";
            this.playAudio('win');
            this.createWinEffect(); // キラキラ演出
        } else if (result === "LOSE") {
            titleEl.innerText = "敗北...";
            titleEl.style.color = "#ff4444";
        } else {
            titleEl.innerText = "引き分け";
            titleEl.style.color = "white";
        }
        
        const detailEl = document.getElementById('result-details');
        const rankName = PokerHand.RANK_NAMES[pRank];
        detailEl.style.textAlign = "center";
        detailEl.innerHTML = `
            <div style="color: white; font-size: 1.2rem; text-align: center;">${winnerMsg}</div>
            <div style="color: white; margin-top: 10px; text-align: center;">汝の役：${rankName}</div>
            <div style="font-size:3rem; margin-top:10px; color: white; text-align: center;">${result === "WIN" ? '+' : (result === "LOSE" ? '-' : '')}${bet.toLocaleString()} Renga</div>
        `;
        this.showScreen('result-screen');
    }

    createWinEffect() {
        const container = document.getElementById('game-container');
        const starCount = 60;
        const starTypes = ['✦', '✧', '✨', '・'];

        for (let i = 0; i < starCount; i++) {
            setTimeout(() => {
                const star = document.createElement('div');
                star.className = 'win-particle';
                star.innerText = starTypes[Math.floor(Math.random() * starTypes.length)];
                
                // 画面全体に広がるよう修正 (半角%を使用)
                star.style.left = (Math.random() * 100) + '%';
                // 主張しすぎない小さなサイズ
                star.style.fontSize = (Math.random() * 0.8 + 0.5) + 'rem';
                // 左右のゆらぎ幅をランダムに設定
                const drift = (Math.random() - 0.5) * 200; // -100px 〜 100px
                star.style.setProperty('--drift', `${drift}px`);
                // 落下速度にバリエーション
                star.style.animationDuration = (Math.random() * 1.5 + 2.5) + 's';
                
                container.appendChild(star);

                setTimeout(() => {
                    star.remove();
                }, 4000);
            }, i * 40);
        }
    }

    showOverlay(title, content) {
        document.getElementById('overlay-text').innerHTML = `<h2>${title}</h2><hr>${content}`;
        document.getElementById('overlay').classList.remove('hidden');
        this.playAudio('flip');
    }

    hideOverlay() {
        document.getElementById('overlay').classList.add('hidden');
        this.playAudio('click');
    }

    toggleBetActions(show) {
        document.getElementById('bet-actions').style.display = show ? 'flex' : 'none';
    }

    togglePot(show, val = 0, yourBet = 0) {
        const potEl = document.getElementById('pot-display');
        const permBetEl = document.getElementById('permanent-bet-display');
        
        potEl.style.display = show ? 'block' : 'none';
        if (permBetEl) permBetEl.style.display = show ? 'block' : 'none';

        if (show) {
            document.getElementById('current-pot').innerText = val.toLocaleString();
            const yourBetEls = [document.getElementById('your-total-bet'), document.getElementById('your-total-bet-permanent')];
            yourBetEls.forEach(el => {
                if (el) el.innerText = yourBet.toLocaleString();
            });
        }
    }
}
