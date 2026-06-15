const canvas = document.getElementById('wheel-canvas');
const ctx = canvas.getContext('2d');
const spinBtn = document.getElementById('spin-btn');
const balanceEl = document.getElementById('balance');
const betAmountEl = document.getElementById('bet-amount');
const resultEl = document.getElementById('last-result');
const resultValueEl = document.getElementById('result-value');
const bettingTable = document.getElementById('betting-table');

let balance = 1000;
let currentBet = 10;
let selectedBets = new Set();
let isSpinning = false;

// Roulette numbers and colors (European Roulette)
const numbers = [
    { num: 0, color: 'green' },
    { num: 32, color: 'red' }, { num: 15, color: 'black' }, { num: 19, color: 'red' }, { num: 4, color: 'black' },
    { num: 21, color: 'red' }, { num: 2, color: 'black' }, { num: 25, color: 'red' }, { num: 17, color: 'black' },
    { num: 34, color: 'red' }, { num: 6, color: 'black' }, { num: 27, color: 'red' }, { num: 13, color: 'black' },
    { num: 36, color: 'red' }, { num: 11, color: 'black' }, { num: 30, color: 'red' }, { num: 8, color: 'black' },
    { num: 23, color: 'red' }, { num: 10, color: 'black' }, { num: 5, color: 'red' }, { num: 24, color: 'black' },
    { num: 16, color: 'red' }, { num: 33, color: 'black' }, { num: 1, color: 'red' }, { num: 20, color: 'black' },
    { num: 14, color: 'red' }, { num: 31, color: 'black' }, { num: 9, color: 'red' }, { num: 22, color: 'black' },
    { num: 18, color: 'red' }, { num: 29, color: 'black' }, { num: 7, color: 'red' }, { num: 28, color: 'black' },
    { num: 12, color: 'red' }, { num: 35, color: 'black' }, { num: 3, color: 'red' }, { num: 26, color: 'black' }
];

// Initialize Betting Table
function initTable() {
    // Zero cell
    const zeroCell = document.createElement('div');
    zeroCell.className = 'number-cell zero';
    zeroCell.textContent = '0';
    zeroCell.dataset.num = '0';
    zeroCell.onclick = () => toggleBet(zeroCell);
    bettingTable.appendChild(zeroCell);

    // Numbers 1-36
    for (let i = 1; i <= 36; i++) {
        const cell = document.createElement('div');
        const numData = numbers.find(n => n.num === i);
        cell.className = `number-cell ${numData.color}`;
        cell.textContent = i;
        cell.dataset.num = i;
        cell.onclick = () => toggleBet(cell);
        bettingTable.appendChild(cell);
    }
}

function toggleBet(element) {
    const bet = element.dataset.num || element.dataset.type;
    if (selectedBets.has(bet)) {
        selectedBets.delete(bet);
        element.classList.remove('selected');
    } else {
        selectedBets.add(bet);
        element.classList.add('selected');
    }
}

// Draw Wheel
let startAngle = 0;
const arc = Math.PI / (numbers.length / 2);

function drawWheel() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const radius = 180;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    for (let i = 0; i < numbers.length; i++) {
        const angle = startAngle + i * arc;
        ctx.fillStyle = numbers[i].color === 'red' ? '#ff4d4d' : (numbers[i].color === 'black' ? '#222' : '#4dff4d');
        
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, angle, angle + arc, false);
        ctx.lineTo(centerX, centerY);
        ctx.fill();
        ctx.stroke();

        ctx.save();
        ctx.fillStyle = "white";
        ctx.translate(centerX + Math.cos(angle + arc / 2) * (radius - 30), centerY + Math.sin(angle + arc / 2) * (radius - 30));
        ctx.rotate(angle + arc / 2 + Math.PI / 2);
        ctx.font = 'bold 12px Cinzel';
        ctx.fillText(numbers[i].num, -ctx.measureText(numbers[i].num).width / 2, 0);
        ctx.restore();
    }
}

function spin() {
    if (isSpinning || selectedBets.size === 0) return;
    
    const totalBet = currentBet * selectedBets.size;
    if (totalBet > balance) {
        alert("Not enough coins!");
        return;
    }

    balance -= totalBet;
    updateUI();
    
    isSpinning = true;
    resultEl.classList.add('hidden');
    
    const spinAngleStart = Math.random() * 10 + 10;
    let spinTime = 0;
    const spinTimeTotal = Math.random() * 3000 + 4000;

    function rotateWheel() {
        spinTime += 30;
        if (spinTime >= spinTimeTotal) {
            stopRotateWheel();
            return;
        }
        const spinAngle = spinAngleStart - easeOut(spinTime, 0, spinAngleStart, spinTimeTotal);
        startAngle += (spinAngle * Math.PI / 180);
        drawWheel();
        requestAnimationFrame(rotateWheel);
    }
    rotateWheel();
}

function stopRotateWheel() {
    isSpinning = false;
    const degrees = startAngle * 180 / Math.PI + 90;
    const arcd = arc * 180 / Math.PI;
    const index = Math.floor((360 - degrees % 360) / arcd);
    const result = numbers[index < 0 ? index + numbers.length : index];
    
    showResult(result);
}

function showResult(result) {
    resultEl.classList.remove('hidden');
    resultValueEl.textContent = result.num;
    resultValueEl.style.color = result.color === 'red' ? '#ff4d4d' : (result.color === 'black' ? '#fff' : '#4dff4d');
    
    calculatePayout(result);
}

function calculatePayout(result) {
    let winnings = 0;
    const num = result.num;
    const color = result.color;

    selectedBets.forEach(bet => {
        if (!isNaN(bet) && parseInt(bet) === num) {
            winnings += currentBet * 36;
        } else if (bet === 'red' && color === 'red') {
            winnings += currentBet * 2;
        } else if (bet === 'black' && color === 'black') {
            winnings += currentBet * 2;
        } else if (bet === 'even' && num !== 0 && num % 2 === 0) {
            winnings += currentBet * 2;
        } else if (bet === 'odd' && num % 2 !== 0) {
            winnings += currentBet * 2;
        }
    });

    balance += winnings;
    updateUI();
}

function updateUI() {
    balanceEl.textContent = balance;
    betAmountEl.textContent = currentBet;
}

function easeOut(t, b, c, d) {
    const ts = (t /= d) * t;
    const tc = ts * t;
    return b + c * (tc + -3 * ts + 3 * t);
}

// Event Listeners
document.getElementById('bet-plus').onclick = () => {
    currentBet += 10;
    updateUI();
};
document.getElementById('bet-minus').onclick = () => {
    if (currentBet > 10) currentBet -= 10;
    updateUI();
};
spinBtn.onclick = spin;

document.querySelectorAll('.bet-btn').forEach(btn => {
    btn.onclick = () => toggleBet(btn);
});

initTable();
drawWheel();
updateUI();
