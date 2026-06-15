console.log("script loaded");

const canvas = document.getElementById("rouletteCanvas");
const ctx = canvas.getContext("2d");

const rouletteNumbers = [
    0,
    32,15,19,4,21,2,25,17,34,6,
    27,13,36,11,30,8,23,10,5,
    24,16,33,1,20,14,31,9,22,
    18,29,7,28,12,35,3,26
];

const redSet = new Set([
    1,3,5,7,9,
    12,14,16,18,
    19,21,23,25,27,
    30,32,34,36
]);

let rotation = 0;
let spinning = false;

let ballAngle = -Math.PI / 2;
let winningNumber = null;
let ballVisible = false;

// ----------------------
// Resize
// ----------------------
function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    drawRoulette();
}

window.addEventListener("resize", resizeCanvas);

// ----------------------
// Bet Table
// ----------------------
function createBetTable() {
    const betTable = document.getElementById("betTable");
    betTable.innerHTML = "";

    const grid = document.createElement("div");
    grid.id = "numberGrid";

    for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 12; col++) {

            const number = col * 3 + (3 - row);

            const cell = document.createElement("button");
            cell.className = "betCell";
            cell.textContent = number;
            cell.dataset.bet = number;

            if (number === 0) {
                cell.style.background = "#1fa84a";
            } else if (redSet.has(number)) {
                cell.style.background = "#c62828";
            } else {
                cell.style.background = "#111111";
            }

            grid.appendChild(cell);
        }
    }

    betTable.appendChild(grid);

    const outsideBets = document.createElement("div");
    outsideBets.id = "outsideBets";

    const bets = [
        "RED",
        "BLACK",
        "ODD",
        "EVEN",
        "1-18",
        "19-36",
        "1st12",
        "2nd12",
        "3rd12"
    ];

    bets.forEach(bet => {
        const button = document.createElement("button");
        button.className = "outsideBet";
        button.textContent = bet;
        button.dataset.bet = bet;

        outsideBets.appendChild(button);
    });

    betTable.appendChild(outsideBets);
}

createBetTable();

// ----------------------
// Message
// ----------------------
function setMessage(text) {
    document.getElementById("messageBox").textContent =
        "Rabbit : " + text;
}

setMessage("幸運を祈るよ。");

// ----------------------
// Draw Roulette
// ----------------------
function drawRoulette() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    const outerRadius = canvas.width * 0.45;
    const innerRadius = canvas.width * 0.28;

    const angleSize = (Math.PI * 2) / rouletteNumbers.length;

    ctx.save();

    ctx.translate(centerX, centerY);
    ctx.rotate(rotation);
    ctx.translate(-centerX, -centerY);

    rouletteNumbers.forEach((number, index) => {

        const startAngle = index * angleSize - Math.PI / 2;
        const endAngle = startAngle + angleSize;

        let color;
        if (number === 0) {
            color = "#1fa84a";
        } else if (redSet.has(number)) {
            color = "#c62828";
        } else {
            color = "#111111";
        }

        ctx.beginPath();

        ctx.arc(centerX, centerY, outerRadius, startAngle, endAngle);
        ctx.arc(centerX, centerY, innerRadius, endAngle, startAngle, true);

        ctx.closePath();

        ctx.fillStyle = color;
        ctx.fill();

        ctx.strokeStyle = "#d4af37";
        ctx.lineWidth = 2;
        ctx.stroke();

        // text
        const textAngle = startAngle + angleSize / 2;
        const textRadius = (outerRadius + innerRadius) / 2;

        const textX = centerX + Math.cos(textAngle) * textRadius;
        const textY = centerY + Math.sin(textAngle) * textRadius;

        ctx.save();
        ctx.translate(textX, textY);
        ctx.rotate(textAngle + Math.PI / 2);

        ctx.fillStyle = "white";
        ctx.font = `bold ${canvas.width * 0.03}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        ctx.fillText(number, 0, 0);

        ctx.restore();
    });

    ctx.restore();

    // center circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, innerRadius - 10, 0, Math.PI * 2);
    ctx.fillStyle = "#7c5ac2";
    ctx.fill();

    ctx.strokeStyle = "#d4af37";
    ctx.lineWidth = 4;
    ctx.stroke();

    // hub
    ctx.beginPath();
    ctx.arc(centerX, centerY, canvas.width * 0.03, 0, Math.PI * 2);
    ctx.fillStyle = "#d4af37";
    ctx.fill();

    // ball
    if (ballVisible) {
        const ballRadius = (outerRadius + innerRadius) / 2;

        const ballX = centerX + Math.cos(ballAngle) * ballRadius;
        const ballY = centerY + Math.sin(ballAngle) * ballRadius;

        ctx.beginPath();
        ctx.arc(ballX, ballY, canvas.width * 0.015, 0, Math.PI * 2);

        ctx.fillStyle = "white";
        ctx.fill();

        ctx.strokeStyle = "#cccccc";
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}

// ----------------------
// Winning logic
// ----------------------
function getWinningNumber() {
    const angleSize = (Math.PI * 2) / rouletteNumbers.length;

    let normalizedRotation = rotation % (Math.PI * 2);
    if (normalizedRotation < 0) {
        normalizedRotation += Math.PI * 2;
    }

    const pointerAngle = (Math.PI * 2 - normalizedRotation);

    const index = Math.floor(pointerAngle / angleSize) % rouletteNumbers.length;

    return rouletteNumbers[index];
}

// ----------------------
// Spin
// ----------------------
const spinButton = document.getElementById("spinButton");

function spinRoulette() {
    if (spinning) return;

    spinning = true;
    ballVisible = false;

    let speed = Math.random() * 0.3 + 0.4;

    function animate() {
        rotation += speed;
        speed *= 0.985;

        drawRoulette();

        if (speed > 0.002) {
            requestAnimationFrame(animate);
        } else {
            spinning = false;

            const result = getWinningNumber();
            winningNumber = result;

            const index = rouletteNumbers.indexOf(result);
            const angleSize = (Math.PI * 2) / rouletteNumbers.length;

            ballAngle =
                index * angleSize
                - Math.PI / 2
                + angleSize / 2;

            ballVisible = true;

            drawRoulette();

            setMessage(`結果は ${result} だよ。`);

            console.log("winning number:", result);
        }
    }

    animate();
}

spinButton.addEventListener("click", spinRoulette);

// init
resizeCanvas();