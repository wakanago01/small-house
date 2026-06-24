// ゲームの状態管理
let deck = [];
let playerHand = [];
let dealerHand = [];
let gameOver = false;

let initialBet = 10;
let currentBet = 10;

/**
 * State Persistence (Synchronized with Home)
 */
const STORAGE_KEY = 'small_house_game_state';
const INITIAL_STATE = {
    coins: 1000,
    debt: 100000000, // 100 Million
    remainingDebt: 100000000,
    hunger: 100,
    stress: 20,
    alcohol: 45,
    cigarette: 10,
    days: 1,
    inventory: [],
    // Extended status fields
    thirst: 90,
    sleep: 0, // 0 is fully awake, 100 is max sleepiness
    health: 100,
    fatigue: 10,
    motivation: 70,
    energy: 100,
    condition: 100
};

let gameState = { ...INITIAL_STATE };

function loadGameState() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            gameState = { ...INITIAL_STATE, ...parsed };
        } catch (e) {
            console.error("Failed to parse saved state:", e);
        }
    }
}

function saveGameState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
}

// DOM要素
const statCoins = document.getElementById('stat-coins');
const statDebt = document.getElementById('stat-debt');
const statDebtRem = document.getElementById('stat-debt-rem');
const statDays = document.getElementById('stat-days');
const sideBarHunger = document.getElementById('side-bar-hunger');
const sideBarStress = document.getElementById('side-bar-stress');

const dealerCardsEl = document.getElementById('dealer-cards');
const playerCardsEl = document.getElementById('player-cards');
const dealerScoreBadge = document.getElementById('dealer-score-badge');
const playerScoreBadge = document.getElementById('player-score-badge');

const betSetupArea = document.getElementById('bet-setup-area');
const currentBetArea = document.getElementById('current-bet-area');
const betAmountDisplay = document.getElementById('bet-amount-display');
const currentBetDisplay = document.getElementById('current-bet-display');

const betM100 = document.getElementById('bet-m100');
const betM50 = document.getElementById('bet-m50');
const betM10 = document.getElementById('bet-m10');
const betP10 = document.getElementById('bet-p10');
const betP50 = document.getElementById('bet-p50');
const betP100 = document.getElementById('bet-p100');
const betAllIn = document.getElementById('bet-allin');
const betClear = document.getElementById('bet-clear');
const dealBtn = document.getElementById('deal-btn');

const bottomRightControls = document.getElementById('bottom-right-controls');
const hitBtn = document.getElementById('hit-btn');
const standBtn = document.getElementById('stand-btn');
const doubleBtn = document.getElementById('double-btn');
const surrenderBtn = document.getElementById('surrender-btn');
const rabbitSpeech = document.getElementById('rabbit-speech');

const resultOverlay = document.getElementById('result-overlay');
const resultContent = document.getElementById('result-content');
const gameOverOverlay = document.getElementById('game-over-overlay');
const resetBtn = document.getElementById('reset-btn');

const particlesContainer = document.getElementById('particles-container');

// メニュー要素
const hamburgerMenu = document.getElementById('hamburger-menu');
const sideMenu = document.getElementById('side-menu');
const homeBtn = document.getElementById('home-btn');
const rulesBtn = document.getElementById('rules-btn');
const closeMenuBtn = document.getElementById('close-menu-btn');
const rulesOverlay = document.getElementById('rules-overlay');
const closeRulesBtn = document.getElementById('close-rules-btn');

// 音源の定義
const sounds = {
    click: new Audio('音源/カーソル移動6.mp3'),
    deal: new Audio('音源/カードを扇状に開く.mp3'),
    knock: new Audio('音源/木のドアをノック1.mp3'),
    paper: new Audio('音源/紙を広げる2.mp3')
};

function playSound(name) {
    if (sounds[name]) {
        sounds[name].currentTime = 0;
        sounds[name].play().catch(e => console.log("Audio play blocked:", e));
    }
}

// 兎のセリフ管理
const rabbitDialogues = {
    start: ["…いらっしゃい。夢の続きを見ましょうか？", "ふふ、また壊しに来たの？", "カードをどうぞ…逃げられないけどね。"],
    hit: ["もっと欲しいの？欲張りさん。", "それ、本当に正解かしら…？", "ふふ、危ない橋を渡るのね。"],
    stand: ["そこで止まるの？賢明ね。", "…わたしの番。見届けてあげる。", "さあ、答え合わせをしましょう。"],
    win: ["おめでとう…次はどうなるかしらね。", "あら、運がいいのね。フフフ。", "…勝っちゃった。つまんないの。"],
    lose: ["あーあ、壊れちゃった。", "…夢はここでおしまい。ふふ。", "負けちゃったね。痛い？"],
    bust: ["欲張りすぎると…弾けちゃうわよ？", "あはは！壊れちゃった！", "…自滅。滑稽ね。"],
    blackjack: ["…最高の夢を見せてくれるのね。", "ブラックジャック…素敵、壊したいわ。", "ふふ、おめでとう。特別なご褒美ね。"],
    push: ["…引き分け。まだ終わらせてくれないのね。", "おそろい. ふふ、不気味ね。", "…変わらない二人。"],
    surrender: ["…逃げ出すの？臆病な子。", "ふふ、賢明な判断…なのかなぁ？", "…逃がさない。今は見逃してあげるだけ。"]
};

let speechTimeout;
function rabbitSpeak(category) {
    const messages = rabbitDialogues[category];
    const msg = messages[Math.floor(Math.random() * messages.length)];
    
    rabbitSpeech.textContent = msg;
    rabbitSpeech.classList.remove('hidden');
    
    clearTimeout(speechTimeout);
    speechTimeout = setTimeout(() => {
        rabbitSpeech.classList.add('hidden');
    }, 4000);
}

function updateProgressBar(el, value, isInverse = false) {
    if (!el) return;
    el.style.width = `${Math.min(100, Math.max(0, value))}%`;
    
    if (isInverse) { // Higher is better (Hunger)
        if (value < 20) el.style.background = 'linear-gradient(90deg, #ff7675, #d63031)';
        else if (value < 50) el.style.background = 'linear-gradient(90deg, #ffeaa7, #fdcb6e)';
        else el.style.background = 'linear-gradient(90deg, #b8e994, #78e08f)';
    } else { // Lower is better (Stress)
        if (value > 80) el.style.background = 'linear-gradient(90deg, #ff7675, #d63031)';
        else if (value > 50) el.style.background = 'linear-gradient(90deg, #ffeaa7, #fdcb6e)';
        else el.style.background = 'linear-gradient(90deg, #b8e994, #78e08f)';
    }
}

function updateUI() {
    if (statCoins) statCoins.textContent = gameState.coins.toLocaleString();
    if (statDebt) statDebt.textContent = gameState.debt.toLocaleString();
    if (statDebtRem) statDebtRem.textContent = gameState.remainingDebt.toLocaleString();
    if (statDays) statDays.textContent = `DAY ${gameState.days}`;

    updateProgressBar(sideBarHunger, gameState.hunger, true);
    updateProgressBar(sideBarStress, gameState.stress, false);

    if (betAmountDisplay) betAmountDisplay.textContent = currentBet.toLocaleString();
    if (currentBetDisplay) currentBetDisplay.textContent = currentBet.toLocaleString();
}

// カードの定義
const suits = ['♠', '♥', '♦', '♣'];
const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

// パーティクル生成
function createParticles(color = '#ff99cc', count = 30) {
    for (let i = 0; i < count; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        // ランダムな位置、サイズ、アニメーション時間
        const size = Math.random() * 8 + 2;
        const left = Math.random() * 100;
        const duration = Math.random() * 3 + 2;
        const delay = Math.random() * 2;
        
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.left = `${left}vw`;
        particle.style.animationDuration = `${duration}s`;
        particle.style.animationDelay = `${delay}s`;
        particle.style.backgroundColor = color;
        particle.style.boxShadow = `0 0 ${size * 2}px ${color}`;
        
        particlesContainer.appendChild(particle);
        
        // アニメーション終了後に削除
        setTimeout(() => {
            particle.remove();
        }, (duration + delay) * 1000);
    }
}

// 常時飛んでいる星
setInterval(() => createParticles('#ffb3e6', 2), 1000);

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

// Yume Kawaii suit display – traditional symbols
const suitClass = { '♥': 'suit-heart', '♦': 'suit-diamond', '♣': 'suit-club', '♠': 'suit-spade' };

function renderCard(card, targetEl, isFlipped = false, animate = false, onComplete = null) {
    const cardEl = document.createElement('div');
    cardEl.className = 'card';

    const sc = suitClass[card.suit];

    const front = document.createElement('div');
    front.className = 'card-face card-front';

    // --- Center artwork by card type ---
    const centerHTML = `
        <div class="card-center number-center">
            <div class="center-suit ${sc}">${card.suit}</div>
        </div>`;

    front.innerHTML = `
        <div class="card-value-top ${sc}">
            <span class="card-rank">${card.value}</span>
            <span class="card-suit-mini">${card.suit}</span>
        </div>
        ${centerHTML}
        <div class="card-value-bottom ${sc}">
            <span class="card-rank">${card.value}</span>
            <span class="card-suit-mini">${card.suit}</span>
        </div>
    `;

    const back = document.createElement('div');
    back.className = 'card-face card-back';
    cardEl.appendChild(front);
    cardEl.appendChild(back);

    targetEl.appendChild(cardEl);

    if (animate) {
        const deckPile = document.getElementById('deck-pile');

        // Temporarily highlight deck
        deckPile.classList.add('glow');
        setTimeout(() => deckPile.classList.remove('glow'), 400);

        // Get coordinates
        const deckRect = deckPile.getBoundingClientRect();
        const targetRect = cardEl.getBoundingClientRect();
        const deltaX = deckRect.left - targetRect.left;
        const deltaY = deckRect.top - targetRect.top;

        // Card starts at deck position, face down
        cardEl.style.transition = 'none';
        cardEl.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(0.8)`;
        cardEl.style.opacity = '0.7';
        cardEl.classList.add('dealing');

        // Particle trail
        const trailInterval = setInterval(() => {
            const rect = cardEl.getBoundingClientRect();
            createTrailParticle(rect.left + rect.width / 2, rect.top + rect.height / 2);
        }, 30);

        // Animate: fly from deck to destination
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                cardEl.style.transition = 'transform 0.8s cubic-bezier(0.23, 1, 0.32, 1), opacity 0.4s ease';
                cardEl.style.transform = 'translate(0, 0) scale(1)';
                cardEl.style.opacity = '1';

                // After arriving, flip the card face-up
                setTimeout(() => {
                    clearInterval(trailInterval);
                    cardEl.classList.remove('dealing');
                    cardEl.style.transform = '';
                    cardEl.style.transition = '';
                    cardEl.style.opacity = '';
                    if (isFlipped) {
                        cardEl.classList.add('flipped');
                    }
                    if (onComplete) onComplete();
                }, 800);
            });
        });
    } else {
        if (isFlipped) cardEl.classList.add('flipped');
        if (onComplete) onComplete();
    }

    return cardEl;
}

function createTrailParticle(x, y) {
    const particle = document.createElement('div');
    particle.className = 'card-trail';
    // Add some random scatter
    const offsetX = (Math.random() - 0.5) * 10;
    const offsetY = (Math.random() - 0.5) * 10;
    particle.style.left = `${x + offsetX}px`;
    particle.style.top = `${y + offsetY}px`;
    document.body.appendChild(particle);
    setTimeout(() => particle.remove(), 600);
}

// Rabbit Doll Magic
function triggerRabbitMagic() {
    const deckArea = document.getElementById('deck-area');
    if (!deckArea) return;
    const glow = document.createElement('div');
    glow.className = 'magic-glow-pulse';
    deckArea.appendChild(glow);
    setTimeout(() => glow.remove(), 3000);
}

setInterval(() => {
    if (Math.random() > 0.6) { // 40% chance every 4s
        triggerRabbitMagic();
    }
}, 4000);

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function updateScoreDisplays(showFullDealerScore = false) {
    const pScore = calculateScore(playerHand);
    playerScoreBadge.textContent = pScore;

    if (showFullDealerScore) {
        dealerScoreBadge.textContent = calculateScore(dealerHand);
    } else {
        dealerScoreBadge.textContent = dealerHand.length > 1 ? getCardValue(dealerHand[1]) : '?';
    }
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
    playSound('click');
    rabbitSpeak('start');
    
    loadGameState();
    
    if (currentBet > gameState.coins) {
        currentBet = gameState.coins;
    }
    
    if (currentBet <= 0 || gameState.coins <= 0) { 
        showGameOver();
        return; 
    }

    gameState.coins -= currentBet;
    saveGameState();
    updateUI();
    
    betSetupArea.classList.add('hidden');
    currentBetArea.classList.remove('hidden');

    deck = createDeck();
    playerHand = [];
    dealerHand = [];
    gameOver = false;
    
    dealerCardsEl.innerHTML = '';
    playerCardsEl.innerHTML = '';
    dealerScoreBadge.textContent = '?';
    playerScoreBadge.textContent = '0';
    
    bottomRightControls.classList.add('hidden');

    await sleep(400);
    playSound('deal');
    
    // Player Card 1
    const p1 = deck.pop();
    renderCard(p1, playerCardsEl, true, true, () => {
        playerHand.push(p1);
        updateScoreDisplays(false);
    });
    await sleep(800);
    
    // Dealer Card 1 (Face down)
    const d1 = deck.pop();
    renderCard(d1, dealerCardsEl, false, true, () => {
        dealerHand.push(d1);
        updateScoreDisplays(false);
    }); 
    await sleep(800);
    
    // Player Card 2
    const p2 = deck.pop();
    renderCard(p2, playerCardsEl, true, true, () => {
        playerHand.push(p2);
        updateScoreDisplays(false);
    });
    await sleep(800);
    
    // Dealer Card 2 (Face up)
    const d2 = deck.pop();
    renderCard(d2, dealerCardsEl, true, true, () => {
        dealerHand.push(d2);
        updateScoreDisplays(false);
    });
    
    bottomRightControls.classList.remove('hidden');
    hitBtn.disabled = false;
    standBtn.disabled = false;
    
    doubleBtn.classList.remove('hidden');
    doubleBtn.disabled = (gameState.coins < currentBet);
    surrenderBtn.classList.remove('hidden');
    surrenderBtn.disabled = false;
}

async function surrender() {
    playSound('click');
    rabbitSpeak('surrender');
    hitBtn.disabled = true;
    standBtn.disabled = true;
    doubleBtn.disabled = true;
    surrenderBtn.disabled = true;

    // Return half the bet
    const refund = Math.floor(currentBet / 2);
    gameState.coins += refund;
    saveGameState();
    
    const loss = currentBet - refund;
    updateUI();

    await endGame('surrender', -loss);
}

async function doubleDown() {
    playSound('click');
    hitBtn.disabled = true;
    standBtn.disabled = true;
    doubleBtn.disabled = true;
    surrenderBtn.disabled = true;

    // Double the bet
    gameState.coins -= currentBet;
    initialBet = currentBet;
    currentBet *= 2;
    saveGameState();
    updateUI();

    playSound('knock');
    await sleep(1000);

    const newCard = deck.pop();
    playSound('paper');
    renderCard(newCard, playerCardsEl, true, true, () => {
        playerHand.push(newCard);
        updateScoreDisplays(false);
    });

    await sleep(1200);

    if (calculateScore(playerHand) > 21) {
        await endGame('bust');
    } else {
        await stand();
    }
}

async function hit() {
    playSound('click');
    rabbitSpeak('hit');
    hitBtn.disabled = true;
    standBtn.disabled = true;
    doubleBtn.disabled = true;
    surrenderBtn.disabled = true;
    
    playSound('knock');
    await sleep(1000);
    
    const newCard = deck.pop();
    playSound('paper');
    renderCard(newCard, playerCardsEl, true, true, () => {
        playerHand.push(newCard);
        updateScoreDisplays(false);
    });
    
    await sleep(1000);
    
    if (calculateScore(playerHand) > 21) {
        await sleep(200);
        await endGame('bust');
    } else {
        hitBtn.disabled = false;
        standBtn.disabled = false;
    }
}

async function stand() {
    playSound('click');
    rabbitSpeak('stand');
    hitBtn.disabled = true;
    standBtn.disabled = true;
    
    renderGame(true);
    await sleep(800);
    
    while (calculateScore(dealerHand) < 17) {
        const newCard = deck.pop();
        playSound('paper');
        renderCard(newCard, dealerCardsEl, true, true, () => {
            dealerHand.push(newCard);
            updateScoreDisplays(true);
        });
        await sleep(1000);
    }
    
    const pScore = calculateScore(playerHand);
    const dScore = calculateScore(dealerHand);
    
    if (dScore > 21) endGame('win');
    else if (pScore > dScore) {
        if (pScore === 21 && playerHand.length === 2) endGame('blackjack');
        else endGame('win');
    }
    else if (pScore < dScore) endGame('lose');
    else endGame('push');
}

function showOverlayEffect(type, profit = 0) {
    resultOverlay.classList.remove('hidden');
    resultContent.className = '';
    
    let amountText = profit > 0 ? `+${profit}` : profit < 0 ? `${profit}` : `±0`;
    
    switch(type) {
        case 'win':
            resultContent.innerHTML = `<div class="victory-text-win">YOU WIN<div class="result-amount win">${amountText}</div></div>`;
            createParticles('#ff66cc', 50);
            createParticles('#fff', 30);
            break;
        case 'lose':
            resultContent.innerHTML = `<div class="victory-text-lose">YOU LOSE<div class="result-amount lose">${amountText}</div></div>`;
            createParticles('#4b0082', 50);
            break;
        case 'blackjack':
            resultContent.innerHTML = `<div class="radiant-light"></div><div class="victory-text-bj">BLACKJACK<div class="result-amount bj">${amountText}</div></div>`;
            createParticles('#00ffff', 50);
            createParticles('#ff00ff', 50);
            break;
        case 'push':
            resultContent.innerHTML = `<div style="color: #ccc; text-shadow: 0 0 10px #fff; font-size: 80px; text-align: center;">PUSH<div class="result-amount">${amountText}</div></div>`;
            break;
        case 'surrender':
            resultContent.innerHTML = `<div style="color: #ff99cc; text-shadow: 0 0 15px #ff00ff; font-size: 80px; text-align: center;">SURRENDER<div class="result-amount lose">${amountText}</div></div>`;
            createParticles('#ffb3e6', 30);
            break;
    }
    
    setTimeout(() => {
        resultOverlay.classList.add('hidden');
        resetRound();
    }, 2500);
}

function showGameOver() {
    gameOverOverlay.classList.remove('hidden');
    createParticles('#ff0000', 30);
}

async function endGame(result, fixedProfit = null) {
    gameOver = true;
    bottomRightControls.classList.add('hidden');
    
    renderGame(true);
    
    let profit = fixedProfit !== null ? fixedProfit : 0;

    if (fixedProfit === null) {
        if (result === 'blackjack' && playerHand.length === 2) {
            rabbitSpeak('blackjack');
            resultOverlay.classList.remove('hidden');
            resultContent.className = '';
            resultContent.innerHTML = `<div class="radiant-light"></div><div class="victory-text-bj">BLACKJACK</div>`;
            createParticles('#00ffff', 50);
            createParticles('#ff00ff', 50);
            await sleep(2000);
            resultOverlay.classList.add('hidden');

            const payout = Math.floor(currentBet * 2.5);
            gameState.coins += payout;
            profit = Math.floor(currentBet * 1.5);
            result = 'win';
        } else if (result === 'win') {
            rabbitSpeak('win');
            gameState.coins += currentBet * 2;
            profit = currentBet;
        } else if (result === 'blackjack') {
            rabbitSpeak('win');
            gameState.coins += currentBet * 2;
            profit = currentBet;
            result = 'win';
        } else if (result === 'push') {
            rabbitSpeak('push');
            gameState.coins += currentBet;
            profit = 0;
        } else if (result === 'bust') {
            rabbitSpeak('bust');
            resultOverlay.classList.remove('hidden');
            resultContent.className = '';
            resultContent.innerHTML = `<div style="color: #ff3333; text-shadow: 0 0 25px #ff0000, 0 0 50px #800000; font-size: 100px; font-weight: bold; letter-spacing: 10px;">BUST</div>`;
            createParticles('#ff0000', 40);
            await sleep(2000);
            resultOverlay.classList.add('hidden');
            
            profit = -currentBet;
            result = 'lose';
        } else {
            rabbitSpeak('lose');
            profit = -currentBet;
        }
    }
    
    if (result === 'lose') {
        gameState.stress = Math.min(100, gameState.stress + 5);
    }
    
    saveGameState();
    showOverlayEffect(result, profit);
    updateUI();
}

function resetRound() {
    loadGameState();
    if (gameState.coins <= 0) {
        showGameOver();
        return;
    }
    
    currentBet = initialBet;
    betSetupArea.classList.remove('hidden');
    currentBetArea.classList.add('hidden');
    
    dealerCardsEl.innerHTML = '';
    playerCardsEl.innerHTML = '';
    dealerScoreBadge.textContent = '?';
    playerScoreBadge.textContent = '0';
    
    if (currentBet > gameState.coins) {
        currentBet = gameState.coins;
    }
    updateUI();
}

function fullReset() {
    gameState = { ...INITIAL_STATE };
    currentBet = 10;
    initialBet = 10;
    saveGameState();
    updateUI();
    gameOverOverlay.classList.add('hidden');
    resetRound();
}

// Event Listeners
dealBtn.addEventListener('click', startGame);
hitBtn.addEventListener('click', hit);
standBtn.addEventListener('click', stand);
doubleBtn.addEventListener('click', doubleDown);
surrenderBtn.addEventListener('click', surrender);
resetBtn.addEventListener('click', () => {
    playSound('click');
    fullReset();
});

betM100.addEventListener('click', () => { 
    playSound('click');
    currentBet = Math.max(10, currentBet - 100);
    updateUI();
});

betM50.addEventListener('click', () => { 
    playSound('click');
    currentBet = Math.max(10, currentBet - 50);
    updateUI();
});

betM10.addEventListener('click', () => { 
    playSound('click');
    currentBet = Math.max(10, currentBet - 10);
    updateUI();
});

betP10.addEventListener('click', () => { 
    playSound('click');
    currentBet = Math.min(gameState.coins, currentBet + 10);
    updateUI();
});

betP50.addEventListener('click', () => { 
    playSound('click');
    currentBet = Math.min(gameState.coins, currentBet + 50);
    updateUI();
});

betP100.addEventListener('click', () => { 
    playSound('click');
    currentBet = Math.min(gameState.coins, currentBet + 100);
    updateUI();
});

betAllIn.addEventListener('click', () => { 
    playSound('click');
    currentBet = gameState.coins;
    updateUI();
});

betClear.addEventListener('click', () => { 
    playSound('click');
    currentBet = 10;
    updateUI();
});

// メニュー操作のロジック
hamburgerMenu.addEventListener('click', () => {
    playSound('click');
    sideMenu.classList.remove('hidden-menu');
});

closeMenuBtn.addEventListener('click', () => {
    playSound('click');
    sideMenu.classList.add('hidden-menu');
});

rulesBtn.addEventListener('click', () => {
    playSound('click');
    sideMenu.classList.add('hidden-menu');
    rulesOverlay.classList.remove('hidden');
});

closeRulesBtn.addEventListener('click', () => {
    playSound('click');
    rulesOverlay.classList.add('hidden');
});

homeBtn.addEventListener('click', () => {
    playSound('click');
    saveGameState(); // Make sure state is saved before returning home
    document.body.style.transition = 'opacity 0.8s ease';
    document.body.style.opacity = '0';
    setTimeout(() => {
        window.location.href = '../home/index.html';
    }, 800);
});

// Survival Loop
const DAY_DURATION_SEC = 20 * 60; // 20 minutes
const HUNGER_DRAIN_PER_SEC = 100 / 3600; 
const SLEEP_INC_PER_SEC = 100 / 1200; // Max in 20 mins
const STRESS_BASE_INC_PER_SEC = 5 / 1200; // Base ~5 per day

let secondsPassed = 0;

function updateSurvivalClock() {
    // If the game over screen (due to out of coins) is visible, do not run the clock
    if (gameOverOverlay && !gameOverOverlay.classList.contains('hidden')) return;

    // 1. Hunger Drain
    gameState.hunger = Math.max(0, gameState.hunger - HUNGER_DRAIN_PER_SEC);
    
    // 2. Sleepiness
    gameState.sleep = Math.min(100, (gameState.sleep || 0) + SLEEP_INC_PER_SEC);
    
    // 3. Stress Growth
    const stressMultiplier = 1 + ((gameState.sleep || 0) / 50); 
    gameState.stress = Math.min(100, gameState.stress + (STRESS_BASE_INC_PER_SEC * stressMultiplier));

    if (gameState.hunger <= 0) {
        triggerGameOver();
        return;
    }

    secondsPassed++;
    const progress = secondsPassed / DAY_DURATION_SEC;
    const offset = 283 * (1 - progress);
    const clockProgress = document.getElementById('clock-progress');
    if (clockProgress) clockProgress.style.strokeDashoffset = offset;

    if (secondsPassed >= DAY_DURATION_SEC) {
        advanceDay(true); // Forced all-nighter
    }
    saveGameState();
    updateUI();
}

function advanceDay(isAllNighter = false) {
    secondsPassed = 0;
    gameState.days += 1;
    
    if (isAllNighter) {
        gameState.stress = Math.min(100, gameState.stress + 5);
        alert("徹夜によりストレスが上昇しました。");
    }
    saveGameState();
    updateUI();
}

function triggerGameOver() {
    alert("【GAME OVER】\n生存の糸が切れてしまいました...\n全ての記録がリセットされます。");
    gameState = { ...INITIAL_STATE };
    saveGameState();
    window.location.href = '../home/index.html';
}

// Start survival loop in blackjack
setInterval(updateSurvivalClock, 1000);

// Initialize
loadGameState();
updateUI();
