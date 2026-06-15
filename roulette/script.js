console.log("script loaded");

const canvas = document.getElementById("rouletteCanvas");
const ctx = canvas.getContext("2d");

// ----------------------
// ルーレットデータ
// ----------------------
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

// ----------------------
// 状態
// ----------------------
let rotation = 0;
let spinning = false;

let ballAngle = -Math.PI / 2;
let ballVisible = false;

let bets = {};
let balance = 50000;

let selectedChip = 100;

// ----------------------
// UI
// ----------------------
function updateBalance() {
    document.getElementById("balance").textContent =
        `Balance : ${balance.toLocaleString()} Renga`;
}

function setMessage(text, type = "normal") {
    const msg = document.getElementById("messageBox");

    msg.style.color =
        type === "win" ? "#ffd54f" :
        type === "lose" ? "#ff6b6b" : "white";

    msg.textContent = "Rabbit : " + text;
}

// ----------------------
// チップUI
// ----------------------
document.addEventListener("click", (e) => {
    if (e.target.classList.contains("chip")) {

        document.querySelectorAll(".chip")
            .forEach(c => c.classList.remove("active"));

        e.target.classList.add("active");

        selectedChip = parseInt(e.target.dataset.chip);
    }
});

// ----------------------
// ベットUI生成
// ----------------------
function createBetTable() {
    const betTable = document.getElementById("betTable");
    betTable.innerHTML = "";

    // 0 cell container
    const zeroWrapper = document.createElement("div");
    zeroWrapper.id = "zeroWrapper";
    
    const zeroCell = document.createElement("button");
    zeroCell.className = "betCell zeroCell";
    zeroCell.textContent = "0";
    zeroCell.dataset.bet = "0";
    zeroCell.style.background = "#1fa84a";
    zeroWrapper.appendChild(zeroCell);
    betTable.appendChild(zeroWrapper);

    const grid = document.createElement("div");
    grid.id = "numberGrid";

    for (let col = 0; col < 12; col++) {
        const column = document.createElement("div");
        column.className = "betColumn";
        for (let row = 0; row < 3; row++) {
            const number = col * 3 + (3 - row);
            const cell = document.createElement("button");
            cell.className = "betCell";
            cell.dataset.bet = number;
            
            const numLabel = document.createElement("span");
            numLabel.className = "numLabel";
            numLabel.textContent = number;
            cell.appendChild(numLabel);

            if (redSet.has(number)) {
                cell.style.background = "#c62828";
            } else {
                cell.style.background = "#111111";
            }

            column.appendChild(cell);
        }
        grid.appendChild(column);
    }

    betTable.appendChild(grid);

    const outside = document.createElement("div");
    outside.id = "outsideBets";

    const list = [
        { id: "1st12", label: "1st 12" },
        { id: "2nd12", label: "2nd 12" },
        { id: "3rd12", label: "3rd 12" },
        { id: "1-18", label: "1-18" },
        { id: "EVEN", label: "EVEN" },
        { id: "RED", label: "RED", color: "#c62828" },
        { id: "BLACK", label: "BLACK", color: "#111" },
        { id: "ODD", label: "ODD" },
        { id: "19-36", label: "19-36" }
    ];

    list.forEach(item => {
        const btn = document.createElement("button");
        btn.className = "outsideBet";
        btn.textContent = item.label;
        btn.dataset.bet = item.id;
        if (item.color) btn.style.background = item.color;
        outside.appendChild(btn);
    });

    betTable.appendChild(outside);
}

// ----------------------
// ベット処理
// ----------------------
document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-bet]");
    if (!btn || spinning) return;

    const bet = btn.dataset.bet;
    const amount = selectedChip;

    if (balance < amount) {
        setMessage("Rengaが足りないよ。");
        return;
    }

    balance -= amount;
    bets[bet] = (bets[bet] || 0) + amount;

    updateBalance();
    updateBetVisuals(btn, bets[bet]);
    setMessage(`${bet} に ${amount} Renga ベットしたね。`);
});

function updateBetVisuals(btn, totalAmount) {
    let chip = btn.querySelector(".betChip");
    if (!chip) {
        chip = document.createElement("div");
        chip.className = "betChip";
        btn.appendChild(chip);
    }
    chip.textContent = totalAmount >= 1000 ? (totalAmount / 1000) + "k" : totalAmount;
}

function clearBetsVisuals() {
    document.querySelectorAll(".betChip").forEach(c => c.remove());
}

// ----------------------
// ルーレット描画
// ----------------------
function drawRoulette() {

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    const outer = canvas.width * 0.45;
    const inner = canvas.width * 0.28;

    const angleSize = (Math.PI * 2) / rouletteNumbers.length;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rotation);
    ctx.translate(-cx, -cy);

    rouletteNumbers.forEach((num, i) => {

        const start = i * angleSize - Math.PI / 2;
        const end = start + angleSize;

        let color =
            num === 0 ? "#1fa84a" :
            redSet.has(num) ? "#c62828" : "#111";

        ctx.beginPath();
        ctx.arc(cx, cy, outer, start, end);
        ctx.arc(cx, cy, inner, end, start, true);
        ctx.closePath();

        ctx.fillStyle = color;
        ctx.fill();

        ctx.strokeStyle = "#d4af37";
        ctx.lineWidth = 2;
        ctx.stroke();

        const textAngle = start + angleSize / 2;
        const r = (outer + inner) / 2;

        const x = cx + Math.cos(textAngle) * r;
        const y = cy + Math.sin(textAngle) * r;

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(textAngle + Math.PI / 2);

        ctx.fillStyle = "white";
        ctx.font = `bold ${canvas.width * 0.03}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        ctx.fillText(num, 0, 0);
        ctx.restore();
    });

    ctx.restore();

    // center
    ctx.beginPath();
    ctx.arc(cx, cy, inner - 10, 0, Math.PI * 2);
    ctx.fillStyle = "#7c5ac2";
    ctx.fill();

    ctx.strokeStyle = "#d4af37";
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, canvas.width * 0.03, 0, Math.PI * 2);
    ctx.fillStyle = "#d4af37";
    ctx.fill();

    // ball
    if (ballVisible) {

        const r = (outer + inner) / 2;

        const bx = cx + Math.cos(ballAngle) * r;
        const by = cy + Math.sin(ballAngle) * r;

        ctx.beginPath();
        ctx.arc(bx, by, canvas.width * 0.015, 0, Math.PI * 2);

        ctx.fillStyle = "white";
        ctx.fill();
    }
}

// ----------------------
// 勝利判定
// ----------------------
function getWinningNumber() {

    const angleSize = (Math.PI * 2) / rouletteNumbers.length;

    let r = rotation % (Math.PI * 2);
    if (r < 0) r += Math.PI * 2;

    const pointer = (Math.PI * 2 - r);

    const index = Math.floor(pointer / angleSize);

    return rouletteNumbers[index];
}

// ----------------------
// 配当計算
// ----------------------
function resolveBets(result) {
    let win = 0;
    let hitBets = [];

    for (const key in bets) {
        const amount = bets[key];
        let payout = 0;

        if (!isNaN(key)) {
            if (parseInt(key) === result) payout = 36; // 35:1 + original bet
        }
        else if (key === "RED" && redSet.has(result)) payout = 2;
        else if (key === "BLACK" && result !== 0 && !redSet.has(result)) payout = 2;
        else if (key === "ODD" && result % 2 === 1) payout = 2;
        else if (key === "EVEN" && result !== 0 && result % 2 === 0) payout = 2;
        else if (key === "1-18" && result >= 1 && result <= 18) payout = 2;
        else if (key === "19-36" && result >= 19 && result <= 36) payout = 2;
        else if (key === "1st12" && result >= 1 && result <= 12) payout = 3;
        else if (key === "2nd12" && result >= 13 && result <= 24) payout = 3;
        else if (key === "3rd12" && result >= 25 && result <= 36) payout = 3;

        if (payout > 0) {
            win += amount * payout;
            hitBets.push(key);
        }
    }

    balance += win;

    if (win > 0) {
        setMessage(`当たり！ [${hitBets.join(", ")}] +${win.toLocaleString()} Renga`, "win");
    } else {
        setMessage("外れだよ。Rabbitは静かに見ている...", "lose");
    }

    bets = {};
    updateBalance();
    setTimeout(clearBetsVisuals, 2000);
}

// ----------------------
// スピン
// ----------------------
function spinRoulette() {
    if (spinning) return;
    if (Object.keys(bets).length === 0) {
        setMessage("どこかにベットして。");
        return;
    }

    spinning = true;
    ballVisible = false;
    clearBetsVisuals(); // Optional: clear before spin or keep until end

    let speed = Math.random() * 0.15 + 0.35;
    let friction = 0.988;

    function animate() {
        rotation += speed;
        speed *= friction;

        drawRoulette();

        if (speed > 0.001) {
            requestAnimationFrame(animate);
        } else {
            spinning = false;
            const result = getWinningNumber();
            
            // Winning angle calculation refinement
            const index = rouletteNumbers.indexOf(result);
            const angleSize = (Math.PI * 2) / rouletteNumbers.length;
            
            // The result is what's at the TOP (fixed pointer).
            // Rotation rotates the board. Pointer is -PI/2.
            ballAngle = -Math.PI / 2; 
            ballVisible = true;

            drawRoulette();
            setMessage(`結果は... ${result}！`);
            resolveBets(result);
        }
    }

    animate();
}

// ----------------------
// 初期化
// ----------------------
document.getElementById("spinButton")
    .addEventListener("click", spinRoulette);

// Add a clear button if you have one, or just handle it here
const clearBtn = document.createElement("button");
clearBtn.id = "clearButton";
clearBtn.textContent = "CLEAR";
clearBtn.onclick = () => {
    if (spinning) return;
    for (const key in bets) {
        balance += bets[key];
    }
    bets = {};
    updateBalance();
    clearBetsVisuals();
    setMessage("ベットをリセットしたよ。");
};
document.getElementById("controls").appendChild(clearBtn);

createBetTable();
updateBalance();

window.addEventListener("resize", () => {
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    drawRoulette();
});

const rect = canvas.getBoundingClientRect();
canvas.width = rect.width;
canvas.height = rect.height;

drawRoulette();