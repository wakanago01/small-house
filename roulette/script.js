// --- Constants & Data ---
const WHEEL_NUMBERS = [
    0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
];

const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

// --- State ---
let balance = 50000;
let debt = 100000000;
let currentChipValue = 100;
let bets = []; // Array of { type: string, value: number, amount: number, chipPositions: [] }
let isSpinning = false;
let history = [];
let stats = {
    red: 0, black: 0, zero: 0,
    counts: Array(37).fill(0),
    totalSpins: 0
};

// --- DOM Elements ---
const balanceEl = document.getElementById('balance');
const debtEl = document.getElementById('debt');
const numbersGrid = document.getElementById('numbers-grid');
const historyList = document.getElementById('history-list');
const statsContainer = document.getElementById('stats-container');
const wheelCanvas = document.getElementById('wheel-canvas');
const ctx = wheelCanvas.getContext('2d');
const spinBtn = document.getElementById('spin-btn');
const winMessage = document.getElementById('win-message');
const chipBtns = document.querySelectorAll('.chip');
const customBetInput = document.getElementById('custom-bet-input');

// --- Initialization ---
function init() {
    createBettingBoard();
    drawWheel();
    updateUI();
    setupEventListeners();
}

function createBettingBoard() {
    // Standard European Roulette Grid (3 rows, 12 columns)
    // Row 1: 3, 6, 9... 36
    // Row 2: 2, 5, 8... 35
    // Row 3: 1, 4, 7... 34
    
    for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 12; c++) {
            const num = (11 - c) * 3 + (3 - r); // Reversed for layout
            const displayNum = (c * 3) + (3 - r);
            
            const cell = document.createElement('div');
            const colorClass = RED_NUMBERS.includes(displayNum) ? 'red' : 'black';
            cell.className = `cell num-cell ${colorClass}`;
            cell.textContent = displayNum;
            cell.dataset.bet = displayNum;
            
            // Positioning for grid layout
            cell.style.gridColumn = c + 1;
            cell.style.gridRow = r + 1;
            
            cell.onclick = (e) => handleBetClick(e, displayNum.toString());
            numbersGrid.appendChild(cell);
        }
    }
}

function setupEventListeners() {
    spinBtn.onclick = spin;
    
    document.getElementById('clear-btn').onclick = () => {
        if (isSpinning) return;
        bets = [];
        clearChipsFromBoard();
    };

    document.getElementById('undo-btn').onclick = () => {
        if (isSpinning) return;
        const lastBet = bets.pop();
        if (lastBet) {
            removeLastChipFromBoard();
        }
    };

    chipBtns.forEach(btn => {
        btn.onclick = () => {
            chipBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentChipValue = parseInt(btn.dataset.value);
            customBetInput.value = '';
        };
    });

    customBetInput.oninput = () => {
        chipBtns.forEach(b => b.classList.remove('active'));
        currentChipValue = parseInt(customBetInput.value) || 0;
    };

    // Outside bets
    document.querySelectorAll('.cell[data-bet]').forEach(cell => {
        if (!cell.classList.contains('num-cell')) {
            cell.onclick = (e) => handleBetClick(e, cell.dataset.bet);
        }
    });
}

function handleBetClick(e, betType) {
    if (isSpinning) return;
    if (currentChipValue <= 0) return;

    // Add bet to state
    const existingBet = bets.find(b => b.type === betType);
    if (existingBet) {
        existingBet.amount += currentChipValue;
    } else {
        bets.push({ type: betType, amount: currentChipValue });
    }

    // Visual feedback: Place a chip
    const rect = e.target.getBoundingClientRect();
    const boardRect = document.getElementById('betting-board').getBoundingClientRect();
    
    const chip = document.createElement('div');
    chip.className = 'chip-marker';
    chip.textContent = currentChipValue >= 1000 ? (currentChipValue / 1000) + 'k' : currentChipValue;
    
    // Random offset within the cell
    const offsetX = (Math.random() - 0.5) * 10;
    const offsetY = (Math.random() - 0.5) * 10;
    
    chip.style.left = (e.clientX - boardRect.left - 12 + offsetX) + 'px';
    chip.style.top = (e.clientY - boardRect.top - 12 + offsetY) + 'px';
    
    document.getElementById('betting-board').appendChild(chip);
    playSound('se-click');
}

function clearChipsFromBoard() {
    document.querySelectorAll('.chip-marker').forEach(c => c.remove());
}

function removeLastChipFromBoard() {
    const chips = document.querySelectorAll('.chip-marker');
    if (chips.length > 0) {
        chips[chips.length - 1].remove();
    }
}

// --- Wheel Graphics ---
function drawWheel() {
    const radius = wheelCanvas.width / 2;
    ctx.clearRect(0, 0, wheelCanvas.width, wheelCanvas.height);
    
    const arc = (Math.PI * 2) / 37;
    
    WHEEL_NUMBERS.forEach((num, i) => {
        const angle = i * arc;
        ctx.beginPath();
        ctx.fillStyle = num === 0 ? '#1a4d2e' : (RED_NUMBERS.includes(num) ? '#c41e3a' : '#1a1a1a');
        ctx.moveTo(radius, radius);
        ctx.arc(radius, radius, radius - 10, angle, angle + arc);
        ctx.lineTo(radius, radius);
        ctx.fill();
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.save();
        ctx.translate(radius, radius);
        ctx.rotate(angle + arc / 2);
        ctx.fillStyle = "#fff";
        ctx.font = "bold 14px Cinzel";
        ctx.fillText(num, radius - 40, 5);
        ctx.restore();
    });
}

// --- Game Flow ---
function spin() {
    if (isSpinning || (bets.length === 0 && balance >= 0)) return;

    const totalBet = bets.reduce((sum, b) => sum + b.amount, 0);
    balance -= totalBet;
    updateUI();
    isSpinning = true;
    spinBtn.disabled = true;
    playSound('se-spin');

    const resultIndex = Math.floor(Math.random() * 37);
    const resultNum = WHEEL_NUMBERS[resultIndex];
    
    // Wheel Animation
    const wheelInner = document.getElementById('wheel-inner');
    const fullSpins = 5 + Math.floor(Math.random() * 5);
    const wheelAngle = (fullSpins * 360) + (resultIndex * (360 / 37));
    
    wheelInner.style.transition = 'transform 4s cubic-bezier(0.1, 0, 0.1, 1)';
    wheelInner.style.transform = `rotate(${wheelAngle}deg)`;

    // Ball Animation
    const ballTrack = document.getElementById('ball-track');
    ballTrack.classList.remove('ball-spinning');
    void ballTrack.offsetWidth; // Trigger reflow
    ballTrack.classList.add('ball-spinning');

    setTimeout(() => {
        resolveSpin(resultNum);
    }, 4500);
}

function resolveSpin(num) {
    isSpinning = false;
    spinBtn.disabled = false;
    
    // Update stats & history
    history.unshift(num);
    if (history.length > 10) history.pop();
    
    stats.totalSpins++;
    stats.counts[num]++;
    if (num === 0) stats.zero++;
    else if (RED_NUMBERS.includes(num)) stats.red++;
    else stats.black++;

    // Calculate winnings
    let totalWin = 0;
    bets.forEach(bet => {
        totalWin += calculateBetWin(bet, num);
    });

    if (totalWin > 0) {
        balance += totalWin;
        showWinMessage(totalWin);
        playSound('se-win');
    }

    updateUI();
    updateHistoryUI();
    updateStatsUI();
}

function calculateBetWin(bet, landedNum) {
    const type = bet.type;
    const amount = bet.amount;

    // Inside Bets
    if (!isNaN(type)) {
        if (parseInt(type) === landedNum) return amount * 36;
    }
    
    // Outside Bets
    if (landedNum === 0) return 0; // Most outside bets lose on 0

    switch (type) {
        case 'red': return RED_NUMBERS.includes(landedNum) ? amount * 2 : 0;
        case 'black': return !RED_NUMBERS.includes(landedNum) ? amount * 2 : 0;
        case 'even': return landedNum % 2 === 0 ? amount * 2 : 0;
        case 'odd': return landedNum % 2 !== 0 ? amount * 2 : 0;
        case 'low': return (landedNum >= 1 && landedNum <= 18) ? amount * 2 : 0;
        case 'high': return (landedNum >= 19 && landedNum <= 36) ? amount * 2 : 0;
        case '1st12': return (landedNum >= 1 && landedNum <= 12) ? amount * 3 : 0;
        case '2nd12': return (landedNum >= 13 && landedNum <= 24) ? amount * 3 : 0;
        case '3rd12': return (landedNum >= 25 && landedNum <= 36) ? amount * 3 : 0;
        case 'col1': return (landedNum % 3 === 1) ? amount * 3 : 0;
        case 'col2': return (landedNum % 3 === 2) ? amount * 3 : 0;
        case 'col3': return (landedNum % 3 === 0) ? amount * 3 : 0;
    }
    return 0;
}

// --- UI Updates ---
function updateUI() {
    balanceEl.textContent = balance.toLocaleString();
    debtEl.textContent = debt.toLocaleString();
    
    // Balance color
    if (balance < 0) balanceEl.style.color = '#ff4d4d';
    else balanceEl.style.color = '#fff';
}

function updateHistoryUI() {
    historyList.innerHTML = '';
    history.forEach(num => {
        const item = document.createElement('div');
        const color = num === 0 ? 'green' : (RED_NUMBERS.includes(num) ? 'red' : 'black');
        item.className = 'hist-item';
        item.style.backgroundColor = color === 'green' ? '#1a4d2e' : (color === 'red' ? '#c41e3a' : '#1a1a1a');
        item.textContent = num;
        historyList.appendChild(item);
    });
}

function updateStatsUI() {
    const redPct = stats.totalSpins ? Math.round((stats.red / stats.totalSpins) * 100) : 0;
    const blackPct = stats.totalSpins ? Math.round((stats.black / stats.totalSpins) * 100) : 0;
    
    statsContainer.innerHTML = `
        <div style="display:flex; gap:10px; margin-bottom:10px">
            <div style="color:#c41e3a">RED: ${redPct}%</div>
            <div style="color:#1a1a1a; text-shadow:0 0 2px #fff">BLACK: ${blackPct}%</div>
        </div>
        <div style="font-size:12px">Total Spins: ${stats.totalSpins}</div>
    `;
}

function showWinMessage(amount) {
    winMessage.textContent = `WIN: ${amount.toLocaleString()} renga!`;
    winMessage.classList.add('show');
    setTimeout(() => {
        winMessage.classList.remove('show');
    }, 3000);
}

function playSound(id) {
    const sound = document.getElementById(id);
    if (sound) {
        sound.currentTime = 0;
        sound.play().catch(() => {}); // Handle browser block
    }
}

// Start
init();
document.querySelector('.chip.c100').classList.add('active');
