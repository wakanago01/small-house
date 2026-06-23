// ==========================================
// ゲーム状態の管理（グローバル変数）
// ==========================================
let money = 50000;            // 初期所持金
const debt = 100000000;       // 固定の借金残高
let stress = 0;               // 初期ストレス値
let winStreak = 0;            // 連勝数

let currentCardValue = 0;     // 現在のカードの数値(1〜13)
let nextCardValue = 0;        // 次のカードの数値(1〜13)

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
// 初期化処理
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

// 画面表示の一括更新
function updateDisplay() {
    moneyDisplay.textContent = money.toLocaleString();
    stressDisplay.textContent = stress;
    streakDisplay.textContent = winStreak;
    
    // ストレス値に応じた画面の演出（暗転と歪み）
    const stressRatio = stress / 100;
    stressOverlay.style.opacity = Math.min(stressRatio, 0.85); // 最大85%まで暗くする
    // 改善案：ストレスがたまると画面がぼやけて不気味になる効果
    document.querySelector('.game-container').style.filter = `blur(${stressRatio * 1.5}px)`;
}

// 新しいラウンドの準備
function startNewRound() {
    // 最初のカードをランダム決定 (1〜13)
    currentCardValue = getRandomCard();
    currentCardEl.textContent = getCardName(currentCardValue);
    currentCardEl.classList.remove('card-back');
    
    // 次のカードを裏面にリセット
    nextCardEl.textContent = '?';
    nextCardEl.classList.add('card-back');
    nextCardEl.classList.remove('flip-animation');
    
    // ボタンの制御を戻す
    btnHigh.disabled = false;
    btnLow.disabled = false;
    btnNextRound.classList.add('hidden');
    
    typeMessage("カードが配られたよ。次のはこれより【HIGH】か【LOW】か、選んでね…？");
}

// ==========================================
// ゲームコアロジック
// ==========================================
function getRandomCard() {
    return Math.floor(Math.random() * 13) + 1;
}

// 数値をA, J, Q, Kに変換
function getCardName(value) {
    if (value === 1) return 'A';
    if (value === 11) return 'J';
    if (value === 12) return 'Q';
    if (value === 13) return 'K';
    return value.toString();
}

// 改善案：テキストをカタカタとタイピング風に表示して不気味さを演出
function typeMessage(text) {
    messageText.textContent = text; 
}

// マックスベットボタンの処理
btnMax.addEventListener('click', () => {
    betInput.value = money;
});

// プレイヤーの予想処理 (choice: 'HIGH' または 'LOW')
function play(choice) {
    const bet = parseInt(betInput.value);

    // バリデーションチェック
    if (isNaN(bet) || bet <= 0) {
        typeMessage("嘘つき。ちゃんとした金額を賭けてよ。");
        return;
    }
    if (bet > money) {
        typeMessage("そんなにお金持ってないでしょ…？");
        return;
    }

    // 操作ボタンを一時無効化
    btnHigh.disabled = true;
    btnLow.disabled = true;

    // 次のカードを決定
    nextCardValue = getRandomCard();
    
    // めくるアニメーション
    nextCardEl.classList.add('flip-animation');
    
    // アニメーションの中盤でカードの数字を表示
    setTimeout(() => {
        nextCardEl.textContent = getCardName(nextCardValue);
        nextCardEl.classList.remove('card-back');
        
        // 勝敗判定
        judgeResult(choice, bet);
    }, 300);
}

// 勝敗判定
function judgeResult(choice, bet) {
    let result = ""; // 'win', 'lose', 'draw'
    
    if (nextCardValue === currentCardValue) {
        result = "draw";
    } else if ((choice === 'HIGH' && nextCardValue > currentCardValue) ||
               (choice === 'LOW' && nextCardValue < currentCardValue)) {
        result = "win";
    } else {
        result = "lose";
    }

    // 結果に応じた処理
    if (result === "win") {
        winStreak++;
        
        // 連勝ボーナスの計算
        let bonusMultiplier = 1.0;
        if (winStreak >= 5) bonusMultiplier = 1.5;
        else if (winStreak >= 3) bonusMultiplier = 1.2;
        
        const payout = Math.floor(bet * bonusMultiplier);
        money += payout;
        
        // ストレス減少（下限0）
        stress = Math.max(0, stress - 2);
        
        let msg = `正解！+${payout} renga 獲得。`;
        if (bonusMultiplier > 1.0) msg += `(${winStreak}連勝ボーナス ${bonusMultiplier}倍！)`;
        typeMessage(msg);
        
        createSparkles(); // キラキラ演出
        addHistory(`◯ 勝利: ${bet}renga (現在${winStreak}連勝)`);
        
    } else if (result === "lose") {
        winStreak = 0; // 連勝リセット
        money -= bet;
        
        // ストレス増加
        stress = Math.min(100, stress + 10);
        
        typeMessage(`ざんねん。-${bet} renga 没収。お家が喜んでる。`);
        
        triggerFlash(); // 赤フラッシュ演出
        addHistory(`● 敗北: ${bet}renga`);
        
    } else {
        // 引き分け
        typeMessage("奇妙な一致。引き分けだからお金は返すね。");
        addHistory(`▲ 払戻: 引き分け`);
    }

    updateDisplay();

    // ゲームオーバーチェック
    if (money <= 0) {
        setTimeout(showGameOver, 1000);
    } else {
        // 次のラウンドへ進むボタンを表示
        btnNextRound.classList.remove('hidden');
    }
}

// ==========================================
// 演出用関数
// ==========================================

// 勝利時のキラキラ演出
function createSparkles() {
    const colors = ['#ffb7ce', '#a2d2ff', '#b19ffb', '#fff'];
    for (let i = 0; i < 30; i++) {
        const sparkle = document.createElement('div');
        sparkle.classList.add('sparkle');
        
        // ランダムな位置・色・飛び散る方向を設定
        sparkle.style.left = (window.innerWidth / 2) + 'px';
        sparkle.style.top = (window.innerHeight / 2) + 'px';
        sparkle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        
        const mx = (Math.random() - 0.5) * 300;
        const my = (Math.random() - 0.5) * 300;
        sparkle.style.setProperty('--mx', `${mx}px`);
        sparkle.style.setProperty('--my', `${my}px`);
        
        sparkleContainer.appendChild(sparkle);
        
        // アニメーション終了後に要素を削除
        sparkle.addEventListener('animationend', () => sparkle.remove());
    }
}

// 敗北時の赤フラッシュ
function triggerFlash() {
    flashOverlay.classList.add('flash-animation');
    flashOverlay.addEventListener('animationend', () => {
        flashOverlay.classList.remove('flash-animation');
    }, { once: true });
}

// 履歴の追加
function addHistory(text) {
    const item = document.createElement('div');
    item.classList.add('history-item');
    item.textContent = text;
    historyLog.insertBefore(item, historyLog.firstChild); // 最新を上に
}

// ゲームオーバー表示
function showGameOver() {
    gameOverScreen.classList.remove('hidden');
}

// ==========================================
// イベントリスナーの登録
// ==========================================
btnHigh.addEventListener('click', () => play('HIGH'));
btnLow.addEventListener('click', () => play('LOW'));
btnNextRound.addEventListener('click', startNewRound);
btnRestart.addEventListener('click', initGame);

// 起動時にゲームを開始
window.onload = initGame;