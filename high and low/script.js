// ==========================================
// ゲーム状態の管理
// ==========================================
let money = 50000;            // 初期所持金
const debt = 100000000;       // 借金
let stress = 0;               // ストレス
let winStreak = 0;            // 連勝数

let currentCardValue = 0;
let nextCardValue = 0;

// ==========================================
// DOM要素の取得
// ==========================================
const moneyDisplay = document.getElementById('money-display');
const debtDisplay = document.getElementById('debt-display');
const stressDisplay = document.getElementById('stress-display');
const streakDisplay = document.getElementById('streak-display');

const currentCardEl = document.getElementById('current-card');
const nextCardEl = document.getElementById('next-card');
const messageText = document.getElementById('message-text');
const betInput = document.getElementById('bet-input');
const historyLog = document.getElementById('history-log');

const btnHigh = document.getElementById('btn-high');
const btnLow = document.getElementById('btn-low');
const btnMax = document.getElementById('btn-max');
const btnNextRound = document.getElementById('btn-next-round');
const btnRestart = document.getElementById('btn-restart');

const stressOverlay = document.getElementById('stress-overlay');
const flashOverlay = document.getElementById('flash-overlay');
const gameOverScreen = document.getElementById('game-over-screen');
const sparkleContainer = document.getElementById('sparkle-container');

// 【追加】ホーム画面用・ポップアップ用の要素取得
const btnStart = document.getElementById('btn-start');
const btnHowTo = document.getElementById('btn-how-to');
const btnRules = document.getElementById('btn-rules');
const btnCasino = document.getElementById('btn-casino');
const modalHowTo = document.getElementById('modal-how-to');
const modalRules = document.getElementById('modal-rules');
const closeButtons = document.querySelectorAll('.close-btn');
const seFlip = document.getElementById('se-flip'); // オーディオ要素

// ==========================================
// 初期化・更新処理
// ==========================================
function initGame() {
    money = 50000;
    stress = 0;
    winStreak = 0;
    if (historyLog) historyLog.innerHTML = '';
    if (gameOverScreen) gameOverScreen.classList.add('hidden');
    
    updateDisplay();
    startNewRound();
}

function updateDisplay() {
    // 既存のエラー防止用if文を追加しつつUI更新
    if (moneyDisplay) moneyDisplay.textContent = money.toLocaleString();
    if (stressDisplay) stressDisplay.textContent = stress;
    if (streakDisplay) streakDisplay.textContent = winStreak;
    
    // 【追加】上中央パネルと右下Renga表示への連動（HTMLに存在するIDのみ更新）
    const infoCoins = document.getElementById('info-coins');
    const rengaCoins = document.getElementById('renga-coins');
    const infoStress = document.querySelector('.stress-fill');
    
    if (infoCoins) infoCoins.textContent = money.toLocaleString();
    if (rengaCoins) rengaCoins.textContent = money.toLocaleString();
    if (infoStress) infoStress.style.width = `${stress}%`;

    // ストレス値による画面への影響（暗転・ブラーの強化）
    const stressRatio = stress / 100;
    if (stressOverlay) stressOverlay.style.opacity = Math.min(stressRatio, 0.9); // 最大90%まで暗転
    
    // 画面全体（主画面）を徐々にぼかし、狂気を表現
    const mainScreen = document.querySelector('.main-game-screen');
    if (mainScreen) {
        mainScreen.style.filter = `blur(${stressRatio * 2}px)`;
    }
}

function startNewRound() {
    currentCardValue = getRandomCard();
    if (currentCardEl) {
        currentCardEl.textContent = getCardName(currentCardValue);
        currentCardEl.classList.remove('card-back');
    }
    
    if (nextCardEl) {
        nextCardEl.textContent = '?';
        nextCardEl.classList.add('card-back');
        nextCardEl.classList.remove('flip-animation');
    }
    
    if (btnHigh) btnHigh.disabled = false;
    if (btnLow) btnLow.disabled = false;
    if (btnNextRound) btnNextRound.classList.add('hidden');
    
    typeMessage("カードが配られたよ。さあ、次を予想して……ウフフ。");
}

// ==========================================
// ゲームコアロジック
// ==========================================
function getRandomCard() {
    return Math.floor(Math.random() * 13) + 1;
}

function getCardName(value) {
    if (value === 1) return 'A';
    if (value === 11) return 'J';
    if (value === 12) return 'Q';
    if (value === 13) return 'K';
    return value.toString();
}

// 不気味なタイピング風メッセージ表示
function typeMessage(text) {
    if (messageText) messageText.textContent = text;
}

if (btnMax) {
    btnMax.addEventListener('click', () => {
        if (betInput) betInput.value = money;
    });
}

// 【追加】効果音を鳴らす関数
function playFlipSound() {
    if (seFlip) {
        seFlip.currentTime = 0; // 連続再生用リセット
        seFlip.play().catch(err => console.log("オーディオ再生エラー:", err));
    }
}

function play(choice) {
    if (!betInput) return;
    const bet = parseInt(betInput.value);

    if (isNaN(bet) || bet <= 0) {
        typeMessage("ねえ、ままとこな金額を賭けてくれない…？");
        return;
    }
    if (bet > money) {
        typeMessage("そんな大金、どこにあるの……？");
        return;
    }

    if (btnHigh) btnHigh.disabled = true;
    if (btnLow) btnLow.disabled = true;

    nextCardValue = getRandomCard();
    
    if (nextCardEl) {
        nextCardEl.classList.add('flip-animation');
        // 【修正】カードが裏返ってアニメーションが開始される「この瞬間」に効果音を鳴らす
        playFlipSound();
    }
    
    setTimeout(() => {
        if (nextCardEl) {
            nextCardEl.textContent = getCardName(nextCardValue);
            nextCardEl.classList.remove('card-back');
        }
        judgeResult(choice, bet);
    }, 250);
}

function judgeResult(choice, bet) {
    let result = "";
    
    if (nextCardValue === currentCardValue) {
        result = "draw";
    } else if ((choice === 'HIGH' && nextCardValue > currentCardValue) ||
               (choice === 'LOW' && nextCardValue < currentCardValue)) {
        result = "win";
    } else {
        result = "lose";
    }

    if (result === "win") {
        winStreak++;
        
        let bonusMultiplier = 1.0;
        if (winStreak >= 5) bonusMultiplier = 1.5;
        else if (winStreak >= 3) bonusMultiplier = 1.2;
        
        const payout = Math.floor(bet * bonusMultiplier);
        money += payout;
        stress = Math.max(0, stress - 2);
        
        let msg = `……正解。 +${payout} rengaを手に入れたね。`;
        if (bonusMultiplier > 1.0) msg += ` (${winStreak}連勝ボナス発動: ${bonusMultiplier}倍)`;
        typeMessage(msg);
        
        createSparkles();
        addHistory(`◯ 勝利: +${payout}renga (${winStreak}連勝)`);
        
    } else if (result === "lose") {
        winStreak = 0;
        money -= bet;
        stress = Math.min(100, stress + 10);
        
        typeMessage(`あはは、ハズレ。 -${bet} renga 没収。痛い、痛いねぇ？`);
        
        triggerFlash();
        addHistory(`● 敗北: -${bet}renga`);
    } else {
        typeMessage("奇妙に同じ数字。引き分けだからお返しするよ。");
        addHistory(`▲ 払戻: 引き分け`);
    }

    updateDisplay();

    if (money <= 0) {
        setTimeout(showGameOver, 1000);
    } else {
        if (btnNextRound) btnNextRound.classList.remove('hidden');
    }
}

// ==========================================
// 演出用関数
// ==========================================
function createSparkles() {
    if (!sparkleContainer) return;
    const colors = ['#ffb7ce', '#a2d2ff', '#b19ffb', '#73fcd6'];
    for (let i = 0; i < 25; i++) {
        const sparkle = document.createElement('div');
        sparkle.classList.add('sparkle');
        
        sparkle.style.left = (window.innerWidth / 2) + 'px';
        sparkle.style.top = (window.innerHeight / 2) + 'px';
        sparkle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        
        const mx = (Math.random() - 0.5) * 350;
        const my = (Math.random() - 0.5) * 350;
        sparkle.style.setProperty('--mx', `${mx}px`);
        sparkle.style.setProperty('--my', `${my}px`);
        
        sparkleContainer.appendChild(sparkle);
        sparkle.addEventListener('animationend', () => sparkle.remove());
    }
}

function triggerFlash() {
    if (!flashOverlay) return;
    flashOverlay.classList.add('flash-animation');
    flashOverlay.addEventListener('animationend', () => {
        flashOverlay.classList.remove('flash-animation');
    }, { once: true });
}

function addHistory(text) {
    if (!historyLog) return;
    const item = document.createElement('div');
    item.classList.add('history-item');
    item.textContent = text;
    historyLog.insertBefore(item, historyLog.firstChild);
}

function showGameOver() {
    if (gameOverScreen) gameOverScreen.classList.remove('hidden');
}

// ==========================================
// 【追加】ポップアップとナビゲーションのイベント制御
// ==========================================
if (btnHowTo) {
    btnHowTo.addEventListener('click', () => modalHowTo.classList.add('is-open'));
}
if (btnRules) {
    btnRules.addEventListener('click', () => modalRules.classList.add('is-open'));
}

closeButtons.forEach(btn => {
    btn.addEventListener('click', closeModal);
});

window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
        closeModal();
    }
});

function closeModal() {
    if (modalHowTo) modalHowTo.classList.remove('is-open');
    if (modalRules) modalRules.classList.remove('is-open');
}

// ホームナビゲーション用イベント
if (btnStart) {
    btnStart.addEventListener('click', () => {
        console.log('ゲーム開始ボタンが押されました');
        initGame(); // ゲームを初期化してスタート
    });
}
if (btnCasino) {
    btnCasino.addEventListener('click', () => {
        alert('カジノに戻ります。');
    });
}

// ==========================================
// イベントリスナーの登録（本編用）
// ==========================================
if (btnHigh) btnHigh.addEventListener('click', () => play('HIGH'));
if (btnLow) btnLow.addEventListener('click', () => play('LOW'));
if (btnNextRound) btnNextRound.addEventListener('click', startNewRound);
if (btnRestart) btnRestart.addEventListener('click', initGame);

window.onload = initGame;