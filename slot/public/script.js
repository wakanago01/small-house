/**
 * small-house slot
 * script.js - 基本的なリール表示の実装
 */

// シンボルの定義
const SYMBOLS = [
    { id: 'seven', label: '7️⃣', name: '777' },
    { id: 'bar', label: '🎰', name: 'BAR' },
    { id: 'bell', label: '🔔', name: 'ベル' },
    { id: 'grape', label: '🍇', name: 'ぶどう' },
    { id: 'cherry', label: '🍒', name: 'チェリー' },
    { id: 'rabbit', label: '🐰', name: 'うさぎ' }
];

// ゲームの状態
let renga = 1000;
let currentBet = 0;
let isSpinning = false;
let reelsState = [false, false, false]; // 各リールが回転中かどうか
let reelsResult = [null, null, null];   // 停止したシンボルの記録

// リールの初期化
function initReels() {
    updateUI();
    const reelsContainer = document.getElementById('reels-container');
    if (!reelsContainer) return;

    reelsContainer.innerHTML = '';

    for (let i = 0; i < 3; i++) {
        const reelElement = document.createElement('div');
        reelElement.className = 'reel';
        reelElement.id = `reel-${i}`;

        const reelContent = document.createElement('div');
        reelContent.className = 'reel-content';

        // 初期表示用にシンボルをランダムに配置（3つ分）
        for (let j = 0; j < 3; j++) {
            const randomSymbol = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
            addSymbolElement(reelContent, randomSymbol);
        }

        reelElement.appendChild(reelContent);
        reelsContainer.appendChild(reelElement);
    }
}

function addSymbolElement(container, symbol) {
    const symbolElement = document.createElement('div');
    symbolElement.className = 'symbol';
    symbolElement.innerHTML = `<span>${symbol.label}</span>`;
    symbolElement.setAttribute('data-id', symbol.id);
    container.appendChild(symbolElement);
}

function updateUI() {
    // 所持金とクレジットの表示更新
    const rengaValue = document.getElementById('renga-value');
    const creditValue = document.getElementById('credit-value');
    if (rengaValue) rengaValue.textContent = renga;
    if (creditValue) creditValue.textContent = renga.toString().padStart(5, '0');

    // BETボタンの状態更新
    const betButtons = document.querySelectorAll('.btn-bet');
    betButtons.forEach((btn, index) => {
        if (currentBet === index + 1) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

function handleBet(amount) {
    if (isSpinning) return;
    if (renga < amount) {
        console.log('Not enough renga');
        return;
    }
    currentBet = amount;
    updateUI();
}

function handleMaxBet() {
    handleBet(3);
}

// スピン開始
function startSpin() {
    if (isSpinning || currentBet === 0) {
        if (currentBet === 0) console.log('Please place a BET');
        return;
    }
    
    if (renga < currentBet) {
        console.log('Not enough renga');
        return;
    }

    // レバー演出
    const lever = document.getElementById('slot-lever');
    if (lever) {
        lever.classList.add('pulled');
        setTimeout(() => lever.classList.remove('pulled'), 500);
    }

    // 支払い
    renga -= currentBet;
    isSpinning = true;
    reelsState = [true, true, true];
    reelsResult = [null, null, null];
    
    // UI更新
    updateUI();
    document.getElementById('rabbit-lamp').classList.remove('lit');
    document.getElementById('payout-value').textContent = '0000';
    document.getElementById('count-value').textContent = currentBet.toString().padStart(3, '0');
    
    console.log(`Spin started with BET ${currentBet}.`);

    for (let i = 0; i < 3; i++) {
        const reel = document.getElementById(`reel-${i}`);
        reel.classList.add('spinning');
    }
}

// リール停止
function stopReel(index) {
    if (!reelsState[index]) return;

    const reel = document.getElementById(`reel-${index}`);
    const content = reel.querySelector('.reel-content');
    
    const resultSymbol = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
    reelsResult[index] = resultSymbol;
    
    reel.classList.remove('spinning');
    reelsState[index] = false;
    
    content.innerHTML = '';
    addSymbolElement(content, SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]);
    addSymbolElement(content, resultSymbol);
    addSymbolElement(content, SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]);
    
    console.log(`Reel ${index} stopped at: ${resultSymbol.name}`);

    if (reelsState.every(state => state === false)) {
        isSpinning = false;
        checkResult();
    }
}

// 役判定と払い出し処理
function checkResult() {
    const [r1, r2, r3] = reelsResult;
    let winType = 'NONE';
    let payout = 0;

    // 1. BIG BONUS (7-7-7)
    if (r1.id === 'seven' && r2.id === 'seven' && r3.id === 'seven') {
        winType = 'BIG';
        payout = 340;
    }
    // 2. REG BONUS (7-7-BAR)
    else if (r1.id === 'seven' && r2.id === 'seven' && r3.id === 'bar') {
        winType = 'REG';
        payout = 120;
    }
    // 3. RETRY (うさぎ-うさぎ-うさぎ)
    else if (r1.id === 'rabbit' && r2.id === 'rabbit' && r3.id === 'rabbit') {
        winType = 'RETRY';
        payout = currentBet; // 賭け金をそのまま戻す
    }
    // 4. BELL (ベル-ベル-ベル)
    else if (r1.id === 'bell' && r2.id === 'bell' && r3.id === 'bell') {
        winType = 'BELL';
        payout = 15;
    }
    // 5. GRAPE (ぶどう-ぶどう-ぶどう)
    else if (r1.id === 'grape' && r2.id === 'grape' && r3.id === 'grape') {
        winType = 'GRAPE';
        payout = 10;
    }
    // 6. CHERRY (左リールにチェリー)
    else if (r1.id === 'cherry') {
        winType = 'CHERRY';
        payout = 2;
    }

    console.log(`判定結果: ${winType}, 払い出し: ${payout} renga`);

    // 払い出し処理
    if (payout > 0 || winType === 'RETRY') {
        renga += payout;
        
        // PAYOUTデジタル表示の更新
        const payoutDisplay = document.getElementById('payout-value');
        if (payoutDisplay) {
            payoutDisplay.textContent = payout.toString().padStart(4, '0');
        }
        
        // 当たり演出 (ランプ点灯)
        if (winType === 'BIG' || winType === 'REG') {
            const lamp = document.getElementById('rabbit-lamp');
            if (lamp) lamp.classList.add('lit');
        }
    }

    // 次のゲームのためにBETをリセットし、UIを更新
    const savedBet = currentBet; // ログ用
    currentBet = 0;
    updateUI();
    
    if (winType === 'RETRY') {
        console.log(`RETRY発生: ${savedBet} renga を返却しました。`);
    }
}

// キーボード入力の処理
function handleKeyDown(event) {
    const key = event.key.toLowerCase();
    
    // スペースキーでスタート
    if (key === ' ' || key === 'Enter') {
        event.preventDefault();
        startSpin();
    }
    
    // J, K, L または 1, 2, 3 で停止
    if (key === 'j' || key === '1') {
        stopReel(0);
    }
    if (key === 'k' || key === '2') {
        stopReel(1);
    }
    if (key === 'l' || key === '3') {
        stopReel(2);
    }
}

// ページ読み込み時に実行
document.addEventListener('DOMContentLoaded', () => {
    initReels();
    
    // スタートボタンのイベント
    const startButton = document.getElementById('start-button');
    if (startButton) {
        startButton.addEventListener('click', startSpin);
    }

    // BETボタンのイベント
    const betButtons = document.querySelectorAll('.btn-bet');
    betButtons.forEach((btn, index) => {
        btn.addEventListener('click', () => handleBet(index + 1));
    });

    // MAX BETボタンのイベント
    const maxBetButton = document.getElementById('max-bet-button');
    if (maxBetButton) {
        maxBetButton.addEventListener('click', handleMaxBet);
    }

    // レバーのイベント
    const lever = document.getElementById('slot-lever');
    if (lever) {
        lever.addEventListener('click', startSpin);
    }

    // キーボードイベントの登録
    document.addEventListener('keydown', handleKeyDown);
});
