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

// ==========================================
// 初期化・更新処理
// ==========================================
function initGame() {
    money = 50000;
    stress = 0;
    winStreak = 0;
    historyLog.innerHTML = '';
    gameOverScreen.classList.add('hidden');
    
    updateDisplay();
    startNewRound();
}

function updateDisplay() {
    moneyDisplay.textContent = money.toLocaleString();
    stressDisplay.textContent = stress;
    streakDisplay.textContent = winStreak;
    
    // ストレス値による画面への影響（暗転・ブラーの強化）
    const stressRatio = stress / 100;
    stressOverlay.style.opacity = Math.min(stressRatio, 0.9); // 最大90%まで暗転
    
    // 画面全体（主画面）を徐々にぼかし、狂気を表現
    document.querySelector('.main-game-screen').style.filter = `blur(${stressRatio * 2}px)`;
}

function startNewRound() {
    currentCardValue = getRandomCard();
    currentCardEl.textContent = getCardName(currentCardValue);
    currentCardEl.classList.remove('card-back');
    
    nextCardEl.textContent = '?';
    nextCardEl.classList.add('card-back');
    nextCardEl.classList.remove('flip-animation');
    
    btnHigh.disabled = false;
    btnLow.disabled = false;
    btnNextRound.classList.add('hidden');
    
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
    messageText.textContent = text;
}

btnMax.addEventListener('click', () => {
    betInput.value = money;
});

function play(choice) {
    const bet = parseInt(betInput.value);

    if (isNaN(bet) || bet <= 0) {
        typeMessage("ねえ、まともな金額を賭けてくれない…？");
        return;
    }
    if (bet > money) {
        typeMessage("そんな大金、どこにあるの……？");
        return;
    }

    btnHigh.disabled = true;
    btnLow.disabled = true;

    nextCardValue = getRandomCard();
    nextCardEl.classList.add('flip-animation');
    
    setTimeout(() => {
        nextCardEl.textContent = getCardName(nextCardValue);
        nextCardEl.classList.remove('card-back');
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
        btnNextRound.classList.remove('hidden');
    }
}

// ==========================================
// 演出用関数
// ==========================================

// 勝利時のダークキラキラ演出（毒パステルカラー）
function createSparkles() {
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
    flashOverlay.classList.add('flash-animation');
    flashOverlay.addEventListener('animationend', () => {
        flashOverlay.classList.remove('flash-animation');
    }, { once: true });
}

function addHistory(text) {
    const item = document.createElement('div');
    item.classList.add('history-item');
    item.textContent = text;
    historyLog.insertBefore(item, historyLog.firstChild);
}

function showGameOver() {
    gameOverScreen.classList.remove('hidden');
}

btnHigh.addEventListener('click', () => play('HIGH'));
btnLow.addEventListener('click', () => play('LOW'));
btnNextRound.addEventListener('click', startNewRound);
btnRestart.addEventListener('click', initGame);

window.onload = initGame;