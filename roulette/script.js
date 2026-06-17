console.log("Dream Roulette loaded");

const canvas = document.getElementById("rouletteCanvas");
const ctx = canvas.getContext("2d");

const rouletteNumbers = [
    0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6,
    27, 13, 36, 11, 30, 8, 23, 10, 5,
    24, 16, 33, 1, 20, 14, 31, 9, 22,
    18, 29, 7, 28, 12, 35, 3, 26
];

const redSet = new Set([
    1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36
]);

let rotation = 0;
let spinning = false;
let ballAngle = -Math.PI / 2;
let ballVisible = false;

let bets = {};
let betHistory = [];
let balance = 50000;
let selectedChip = 100;

const catMessages = {
    idle: [
        "幸運を祈るにゃ。良い結果が待っているかもしれないにゃ。",
        "どこに賭けるか、ゆっくり考えるにゃ。",
        "黒猫は静かに見守っているにゃ。"
    ],
    win: [
        "すごいにゃ！勝ちだにゃ！",
        "今日はツイてるにゃ。",
        "金色の星が味方しているにゃ。"
    ],
    lose: [
        "残念だにゃ……でも次があるにゃ。",
        "まだ終わりじゃないにゃ。",
        "黒猫はもう一度の挑戦を見守るにゃ。"
    ],
    bigBet: [
        "大胆だにゃ……覚悟はできているにゃ？",
        "大きな勝負に出たにゃ。",
        "これは運命の一投かもしれないにゃ。"
    ],
    lowBalance: [
        "Rengaが少なくなってきたにゃ。無理はしないでにゃ。",
        "少し休むのも作戦だにゃ。",
        "黒猫は心配しているにゃ。"
    ]
};

function setCatMessage(type) {
    const list = catMessages[type] || catMessages.idle;
    setCustomMessage(list[Math.floor(Math.random() * list.length)]);
}

function setCustomMessage(text) {
    const elem = document.getElementById("catMessage");
    if (elem) elem.textContent = text;
}

function updateBalance() {
    document.getElementById("balance").textContent =
        `Balance : ${balance.toLocaleString()} Renga`;
}

function updateResult(text) {
    document.getElementById("resultDisplay").textContent = text;
}

document.addEventListener("click", (e) => {
    if (!e.target.classList.contains("chip")) return;
    document.querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
    e.target.classList.add("active");
    selectedChip = Number(e.target.dataset.chip);
});

function createBetTable() {
    const betTable = document.getElementById("betTable");
    betTable.innerHTML = "";

    const zeroAndRows = document.createElement("div");
    zeroAndRows.id = "zeroAndRows";

    const zeroCell = document.createElement("button");
    zeroCell.className = "betCell zeroCell";
    zeroCell.dataset.bet = "0";
    zeroCell.textContent = "0";
    zeroCell.style.background = "linear-gradient(180deg, #079243, #005d2a)";
    zeroAndRows.appendChild(zeroCell);

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

            const label = document.createElement("span");
            label.className = "numLabel";
            label.textContent = number;
            cell.appendChild(label);

            cell.style.background = redSet.has(number)
                ? "linear-gradient(180deg, #b52022, #65110f)"
                : "linear-gradient(180deg, #202020, #050505)";

            column.appendChild(cell);
        }

        grid.appendChild(column);
    }

    zeroAndRows.appendChild(grid);
    betTable.appendChild(zeroAndRows);

    const dozens = document.createElement("div");
    dozens.id = "dozens";
    [
        { id: "1st12", label: "1st 12" },
        { id: "2nd12", label: "2nd 12" },
        { id: "3rd12", label: "3rd 12" }
    ].forEach(item => {
        const btn = document.createElement("button");
        btn.className = "outsideBet";
        btn.dataset.bet = item.id;
        btn.textContent = item.label;
        dozens.appendChild(btn);
    });
    betTable.appendChild(dozens);

    const outside = document.createElement("div");
    outside.id = "outsideBets";
    [
        { id: "1-18", label: "1-18" },
        { id: "EVEN", label: "EVEN" },
        { id: "RED", label: "◆", bg: "linear-gradient(180deg, #b52022, #65110f)" },
        { id: "BLACK", label: "◆", bg: "linear-gradient(180deg, #202020, #050505)" },
        { id: "ODD", label: "ODD" },
        { id: "19-36", label: "19-36" }
    ].forEach(item => {
        const btn = document.createElement("button");
        btn.className = "outsideBet";
        btn.dataset.bet = item.id;
        btn.textContent = item.label;
        if (item.bg) btn.style.background = item.bg;
        outside.appendChild(btn);
    });
    betTable.appendChild(outside);
}

function updateBetVisuals(btn, totalAmount) {
    let chip = btn.querySelector(".betChip");
    if (!chip) {
        chip = document.createElement("div");
        chip.className = "betChip";
        btn.appendChild(chip);
    }
    chip.textContent = totalAmount >= 1000 ? `${totalAmount / 1000}k` : totalAmount;
}

function redrawAllBetVisuals() {
    document.querySelectorAll(".betChip").forEach(c => c.remove());
    for (const key in bets) {
        const btn = document.querySelector(`[data-bet="${CSS.escape(key)}"]`);
        if (btn) updateBetVisuals(btn, bets[key]);
    }
}

function clearBetsVisuals() {
    document.querySelectorAll(".betChip").forEach(c => c.remove());
}

document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-bet]");
    if (!btn || btn.classList.contains("chip") || spinning) return;

    const bet = btn.dataset.bet;
    const amount = selectedChip;

    if (balance < amount) {
        setCatMessage("lowBalance");
        return;
    }

    balance -= amount;
    bets[bet] = (bets[bet] || 0) + amount;
    betHistory.push({ bet, amount });

    updateBalance();
    updateBetVisuals(btn, bets[bet]);
});

function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    const size = Math.floor(Math.min(rect.width, rect.height));
    canvas.width = size;
    canvas.height = size;
    drawRoulette();
}

function drawCurledCat(cx, cy, radius) {
    ctx.save();
    ctx.translate(cx, cy);

    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.78, 0, Math.PI * 2);
    ctx.fillStyle = "#17131c";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(-radius * 0.22, -radius * 0.18, radius * 0.34, 0, Math.PI * 2);
    ctx.fillStyle = "#201827";
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(-radius * 0.48, -radius * 0.36);
    ctx.lineTo(-radius * 0.36, -radius * 0.72);
    ctx.lineTo(-radius * 0.18, -radius * 0.42);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(radius * 0.02, -radius * 0.38);
    ctx.lineTo(radius * 0.12, -radius * 0.70);
    ctx.lineTo(radius * 0.26, -radius * 0.36);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.arc(radius * 0.15, radius * 0.08, radius * 0.42, -0.2, Math.PI * 1.25);
    ctx.strokeStyle = "#0e0b12";
    ctx.lineWidth = radius * 0.22;
    ctx.lineCap = "round";
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(-radius * 0.34, -radius * 0.22, radius * 0.04, 0, Math.PI * 2);
    ctx.arc(-radius * 0.12, -radius * 0.22, radius * 0.04, 0, Math.PI * 2);
    ctx.fillStyle = "#f3c34b";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.9, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(236, 184, 83, 0.45)";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();
}

function drawRoulette() {
    if (!canvas.width || !canvas.height) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const outer = canvas.width * 0.485;
    const inner = canvas.width * 0.37;
    const angleSize = (Math.PI * 2) / rouletteNumbers.length;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rotation);
    ctx.translate(-cx, -cy);

    rouletteNumbers.forEach((num, i) => {
        const start = i * angleSize - Math.PI / 2;
        const end = start + angleSize;
        const color = num === 0 ? "#079243" : redSet.has(num) ? "#b52022" : "#0a0a0a";

        ctx.beginPath();
        ctx.arc(cx, cy, outer, start, end);
        ctx.arc(cx, cy, inner, end, start, true);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();

        ctx.strokeStyle = "#d9b147";
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
        ctx.font = `bold ${canvas.width * 0.034}px Georgia`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.shadowColor = "black";
        ctx.shadowBlur = 4;
        ctx.fillText(num, 0, 0);
        ctx.restore();
    });

    ctx.restore();

    ctx.beginPath();
    ctx.arc(cx, cy, inner - 4, 0, Math.PI * 2);
    ctx.fillStyle = "#2b1736";
    ctx.fill();
    ctx.strokeStyle = "#d9b147";
    ctx.lineWidth = 4;
    ctx.stroke();

    drawCurledCat(cx, cy, canvas.width * 0.19);

    ctx.beginPath();
    ctx.arc(cx, cy, canvas.width * 0.028, 0, Math.PI * 2);
    ctx.fillStyle = "#e3b72f";
    ctx.shadowColor = "#ffd86d";
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.shadowBlur = 0;

    if (ballVisible) {
        const r = (outer + inner) / 2;
        const bx = cx + Math.cos(ballAngle + rotation) * r;
        const by = cy + Math.sin(ballAngle + rotation) * r;

        ctx.save();
        ctx.beginPath();
        ctx.arc(bx, by, canvas.width * 0.025, 0, Math.PI * 2);
        ctx.fillStyle = "white";
        ctx.shadowColor = "white";
        ctx.shadowBlur = 15;
        ctx.fill();
        ctx.restore();
    }
}

function getWinningNumber() {
    const angleSize = (Math.PI * 2) / rouletteNumbers.length;
    let r = rotation % (Math.PI * 2);
    if (r < 0) r += Math.PI * 2;
    const pointer = (Math.PI * 2 - r) % (Math.PI * 2);
    const index = Math.floor(pointer / angleSize);
    return rouletteNumbers[index];
}

function resolveBets(result) {
    let win = 0;

    for (const key in bets) {
        const amount = bets[key];
        let payout = 0;

        if (!isNaN(key)) {
            if (Number(key) === result) payout = 36;
        } else if (key === "RED" && redSet.has(result)) payout = 2;
        else if (key === "BLACK" && result !== 0 && !redSet.has(result)) payout = 2;
        else if (key === "ODD" && result !== 0 && result % 2 === 1) payout = 2;
        else if (key === "EVEN" && result !== 0 && result % 2 === 0) payout = 2;
        else if (key === "1-18" && result >= 1 && result <= 18) payout = 2;
        else if (key === "19-36" && result >= 19 && result <= 36) payout = 2;
        else if (key === "1st12" && result >= 1 && result <= 12) payout = 3;
        else if (key === "2nd12" && result >= 13 && result <= 24) payout = 3;
        else if (key === "3rd12" && result >= 25 && result <= 36) payout = 3;

        if (payout > 0) win += amount * payout;
    }

    balance += win;
    updateBalance();
    updateResult(`Result : ${result}`);

    if (win > 0) {
        setCustomMessage(`${result} が当選にゃ！ +${win.toLocaleString()} Renga だにゃ！`);
    } else if (balance <= 1000) {
        setCatMessage("lowBalance");
    } else {
        setCustomMessage(`${result} が当選にゃ。今回は残念だったにゃ……。`);
    }

    bets = {};
    betHistory = [];
    setTimeout(clearBetsVisuals, 1800);
}

function spinRoulette() {
    if (spinning) return;

    let totalBet = 0;
    for (const key in bets) totalBet += bets[key];

    if (totalBet === 0) {
        setCustomMessage("まずはBET表にチップを置くにゃ。");
        return;
    }

    if (totalBet >= 1000) setCatMessage("bigBet");

    spinning = true;
    ballVisible = false;
    updateResult("Spinning...");
    clearBetsVisuals();

    let speed = Math.random() * 0.16 + 0.38;
    const friction = 0.988;

    function animate() {
        rotation += speed;
        speed *= friction;
        drawRoulette();

        if (speed > 0.001) {
            requestAnimationFrame(animate);
        } else {
            spinning = false;
            const result = getWinningNumber();
            const resultIndex = rouletteNumbers.indexOf(result);
            const angleSize = (Math.PI * 2) / rouletteNumbers.length;

            ballAngle = resultIndex * angleSize - Math.PI / 2 + angleSize / 2 - rotation;
            ballVisible = true;
            drawRoulette();
            resolveBets(result);
        }
    }

    animate();
}

function clearBets() {
    if (spinning) return;

    for (const key in bets) balance += bets[key];
    bets = {};
    betHistory = [];
    updateBalance();
    clearBetsVisuals();
    updateResult("Result : -");
    setCatMessage("idle");
}

function backBet() {
    if (spinning || betHistory.length === 0) return;

    const last = betHistory.pop();
    bets[last.bet] -= last.amount;
    balance += last.amount;

    if (bets[last.bet] <= 0) delete bets[last.bet];

    updateBalance();
    redrawAllBetVisuals();
    setCustomMessage("ひとつ前のBETを戻したにゃ。");
}

document.getElementById("spinButton").addEventListener("click", spinRoulette);
document.getElementById("clearButton").addEventListener("click", clearBets);
document.getElementById("backButton").addEventListener("click", backBet);

createBetTable();
updateBalance();
setCatMessage("idle");

window.addEventListener("resize", resizeCanvas);
requestAnimationFrame(resizeCanvas);
