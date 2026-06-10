// ゲームの状態管理
let deck = [];
let playerHand = [];
let dealerHand = [];
let balance = 100; // 初期レンガ
let currentBet = 0;
let gameOver = false;

// DOM要素
const balanceEl = document.getElementById('balance');
const dealerCardsEl = document.getElementById('dealer-cards');
const playerCardsEl = document.getElementById('player-cards');
const dealerScoreEl = document.getElementById('dealer-score');
const playerScoreEl = document.getElementById('player-score');
const betAmountEl = document.getElementById('bet-amount');
const messageEl = document.getElementById('message-display');
const dealBtn = document.getElementById('deal-btn');
const hitBtn = document.getElementById('hit-btn');
const standBtn = document.getElementById('stand-btn');
const resetBtn = document.getElementById('reset-btn');
const bettingSection = document.getElementById('betting-section');
const actionSection = document.getElementById('action-section');
const historyLogEl = document.getElementById('history-log');

// ベッティング用ボタン
const betMinus10Btn = document.getElementById('bet-minus-10');
const betPlus10Btn = document.getElementById('bet-plus-10');
const betAllInBtn = document.getElementById('bet-all-in');
const betResetBtn = document.getElementById('bet-reset');

// カードの定義
const suits = ['♠', '♥', '♦', '♣'];
const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

function createDeck() {
    let newDeck = [];
    for (let suit of suits) {
        for (let value of values) {
            newDeck.push({ suit, value });
        }
    }
    for (let i = newDeck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
    }
    return newDeck;
}

function getCardValue(card) {
    if (['J', 'Q', 'K'].includes(card.value)) return 10;
    if (card.value === 'A') return 11;
    return parseInt(card.value);
}

function calculateScore(hand) {
    let score = 0;
    let aceCount = 0;
    for (let card of hand) {
        score += getCardValue(card);
        if (card.value === 'A') aceCount++;
    }
    while (score > 21 && aceCount > 0) {
        score -= 10;
        aceCount--;
    }
    return score;
}

function renderCard(card, targetEl, isFlipped = false, animate = false) {
    const cardEl = document.createElement('div');
    cardEl.className = 'card';
    if (card.suit === '♥' || card.suit === '♦') {
        cardEl.classList.add('red');
    }
    const front = document.createElement('div');
    front.className = 'card-face card-front';
    front.innerHTML = `<div>${card.value}</div><div class="card-suit-large">${card.suit}</div>`;
    const back = document.createElement('div');
    back.className = 'card-face card-back';
    cardEl.appendChild(front);
    cardEl.appendChild(back);
    targetEl.appendChild(cardEl);

    if (animate) {
        cardEl.classList.add('dealing');
        setTimeout(() => {
            cardEl.classList.remove('dealing');
            if (isFlipped) {
                setTimeout(() => cardEl.classList.add('flipped'), 300);
            }
        }, 50);
    } else if (isFlipped) {
        cardEl.classList.add('flipped');
    }
    return cardEl;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function updateUI() {
    balanceEl.textContent = balance;
}

function updateScoreDisplays(showFullDealerScore = false) {
    const pScore = calculateScore(playerHand);
    playerScoreEl.textContent = pScore;
    if (pScore > 21) playerScoreEl.style.color = '#ff5252';
    else if (pScore === 21) playerScoreEl.style.color = '#ffeb3b';
    else playerScoreEl.style.color = '#fbc02d';

    if (showFullDealerScore) dealerScoreEl.textContent = `スコア: ${calculateScore(dealerHand)}`;
    else dealerScoreEl.textContent = 'スコア: ?';
}

function addHistory(result, amount) {
    const li = document.createElement('li');
    const timestamp = new Date().toLocaleTimeString();
    let resultClass = '';
    let profitText = '';
    if (result === 'win') {
        resultClass = 'history-win';
        profitText = `+${amount}`;
    } else if (result === 'loss') {
        resultClass = 'history-loss';
        profitText = `-${amount}`;
    } else {
        resultClass = 'history-draw';
        profitText = '±0';
    }
    li.innerHTML = `
        <span>[${timestamp}] ${result === 'win' ? '勝利' : result === 'loss' ? '敗北' : '引分'}</span>
        <span class="${resultClass}">${profitText} 🧱 (残: ${balance})</span>
    `;
    historyLogEl.prepend(li);
}

function renderGame(showFullDealerHand) {
    dealerCardsEl.innerHTML = '';
    playerCardsEl.innerHTML = '';
    dealerHand.forEach((card, index) => {
        if (index === 0 && !showFullDealerHand) renderCard(card, dealerCardsEl, false);
        else renderCard(card, dealerCardsEl, true);
    });
    playerHand.forEach(card => renderCard(card, playerCardsEl, true));
    updateScoreDisplays(showFullDealerHand);
}

async function startGame() {
    currentBet = parseInt(betAmountEl.value);
    if (isNaN(currentBet) || currentBet <= 0) { alert('有効なレンガの数値を入力してください。'); return; }
    if (currentBet > balance) { alert('レンガが足りません！'); return; }

    balance -= currentBet;
    updateUI();
    deck = createDeck();
    playerHand = [deck.pop(), deck.pop()];
    dealerHand = [deck.pop(), deck.pop()];
    gameOver = false;
    messageEl.textContent = '';
    bettingSection.classList.add('hidden');
    actionSection.classList.remove('hidden');
    resetBtn.classList.add('hidden');
    dealerCardsEl.innerHTML = '';
    playerCardsEl.innerHTML = '';
    updateScoreDisplays(false);

    await sleep(300);
    renderCard(playerHand[0], playerCardsEl, true, true);
    updateScoreDisplays(false);
    await sleep(500);
    renderCard(dealerHand[0], dealerCardsEl, false, true); 
    await sleep(500);
    renderCard(playerHand[1], playerCardsEl, true, true);
    updateScoreDisplays(false);
    await sleep(500);
    renderCard(dealerHand[1], dealerCardsEl, true, true);

    if (calculateScore(playerHand) === 21) setTimeout(() => endGame('ブラックジャック！プレイヤーの勝ち！'), 800);
}

async function hit() {
    const newCard = deck.pop();
    playerHand.push(newCard);
    renderCard(newCard, playerCardsEl, true, true);
    updateScoreDisplays(false);
    if (calculateScore(playerHand) > 21) {
        hitBtn.disabled = true; standBtn.disabled = true;
        await sleep(600);
        endGame('バースト！ディーラー（兎のぬいぐるみ）の勝ち！');
    }
}

async function stand() {
    hitBtn.disabled = true; standBtn.disabled = true;
    renderGame(true);
    updateScoreDisplays(true);
    await sleep(1000);
    while (calculateScore(dealerHand) < 17) {
        const newCard = deck.pop();
        dealerHand.push(newCard);
        renderCard(newCard, dealerCardsEl, true, true);
        updateScoreDisplays(true);
        await sleep(1000);
    }
    const pScore = calculateScore(playerHand);
    const dScore = calculateScore(dealerHand);
    if (dScore > 21) endGame('ディーラーがバースト！プレイヤーの勝ち！');
    else if (pScore > dScore) endGame('プレイヤーの勝ち！');
    else if (pScore < dScore) endGame('ディーラー（兎のぬいぐるみ）の勝ち！');
    else endGame('引き分け (Push)');
}

function endGame(message) {
    gameOver = true;
    messageEl.textContent = message;
    let result = 'loss';
    let profit = currentBet;
    if (message.includes('プレイヤーの勝ち')) {
        result = 'win';
        if (message.includes('ブラックジャック')) {
            const winAmount = Math.floor(currentBet * 1.5);
            balance += currentBet + winAmount;
            profit = winAmount;
        } else {
            balance += currentBet * 2;
            profit = currentBet;
        }
    } else if (message.includes('引き分け')) {
        result = 'draw';
        balance += currentBet;
        profit = 0;
    }
    addHistory(result, profit);
    updateUI();
    renderGame(true);
    actionSection.classList.add('hidden');
    resetBtn.classList.remove('hidden');
    hitBtn.disabled = false; standBtn.disabled = false;
}

function resetGame() {
    bettingSection.classList.remove('hidden');
    resetBtn.classList.add('hidden');
    messageEl.textContent = 'レンガを賭けて勝負を開始してください。';
    dealerCardsEl.innerHTML = '';
    playerCardsEl.innerHTML = '';
    dealerScoreEl.textContent = '';
    playerScoreEl.textContent = '0';
    playerScoreEl.style.color = '#fbc02d';
}

dealBtn.addEventListener('click', startGame);
hitBtn.addEventListener('click', hit);
standBtn.addEventListener('click', stand);
resetBtn.addEventListener('click', resetGame);
betMinus10Btn.addEventListener('click', () => { 
    let newVal = (parseInt(betAmountEl.value) || 0) - 10;
    betAmountEl.value = Math.max(1, newVal); 
});
betPlus10Btn.addEventListener('click', () => { betAmountEl.value = (parseInt(betAmountEl.value) || 0) + 10; });
betAllInBtn.addEventListener('click', () => { betAmountEl.value = balance; });
betResetBtn.addEventListener('click', () => { betAmountEl.value = 10; });

updateUI();
messageEl.textContent = 'レンガを賭けて勝負を開始してください。';
