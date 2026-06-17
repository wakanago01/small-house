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
let betHistory = [];
let balance = 50000;
let selectedChip = 100;

// =======================
// Black Cat メッセージ管理
// =======================
const catMessages = {
    idle: [
        "幸運を祈るにゃ。",
        "黒猫は静かに見守っている……",
        "どの数字に運命を預けるにゃ？"
    ],
    win: [
        "やったにゃ！今日はツイてるにゃ。",
        "すごいにゃ、運が味方しているにゃ。",
        "黒猫も嬉しいにゃ。"
    ],
    lose: [
        "残念にゃ……でも次があるにゃ。",
        "まだ終わりじゃないにゃ。",
        "次こそ当たるかもしれないにゃ。"
    ],
    bigBet: [
        "大胆だにゃ……見届けるにゃ。",
        "覚悟はできているにゃ？",
        "勝負師の目をしているにゃ。"
    ],
    lowBalance: [
        "……大丈夫かにゃ？",
        "少し休憩するのも大事にゃ。",
        "無理はしないでにゃ。"
    ],
    noBet: [
        "先にBETしてから回すにゃ。",
        "チップを置いてからSPINにゃ。"
    ]
};

function setCatMessage(type) {
    const list = catMessages[type] || catMessages.idle;
    setCustomMessage(list[Math.floor(Math.random() * list.length)]);
}

function setCustomMessage(text) {
    const msgElem = document.getElementById("catMessage");
    if (msgElem) msgElem.textContent = text;

    const box = document.getElementById("catDialogue");
    if (box) {
        box.style.transform = "translateY(-4px)";
        setTimeout(() => box.style.transform = "translateY(0)", 220);
    }
}

// ----------------------
// UI
// ----------------------
function updateBalance() {
    const balanceElem = document.getElementById("balance");
    if (balanceElem) {
        balanceElem.textContent = `Balance : ${balance.toLocaleString()} Renga`;
    }
}

function setResultDisplay(text, flash = false) {
    const resultElem = document.getElementById("resultDisplay");
    if (!resultElem) return;
    resultElem.textContent = text;
    resultElem.classList.remove("winFlash");
    void resultElem.offsetWidth;
    if (flash) resultElem.classList.add("winFlash");
}

// ----------------------
// チップUI
// ----------------------
document.addEventListener("click", (e) => {
    if (e.target.classList.contains("chip")) {
        document.querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
        e.target.classList.add("active");
        selectedChip = parseInt(e.target.dataset.chip, 10);
    }
});

// ----------------------
// ベットUI生成
// ----------------------
function createBetTable() {
    const betTable = document.getElementById("betTable");
    betTable.innerHTML = "";

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
            cell.dataset.bet = String(number);

            const numLabel = document.createElement("span");
            numLabel.className = "numLabel";
            numLabel.textContent = number;
            cell.appendChild(numLabel);

            cell.style.background = redSet.has(number) ? "#c62828" : "#111111";
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
        setCatMessage("lowBalance");
        return;
    }

    balance -= amount;
    bets[bet] = (bets[bet] || 0) + amount;
    betHistory.push({ bet, amount });

    updateBalance();
    updateBetVisuals(btn, bets[bet]);
});

function updateBetVisuals(btn, totalAmount) {
    let chip = btn.querySelector(".betChip");
    if (!chip) {
        chip = document.createElement("div");
        chip.className = "betChip";
        btn.appendChild(chip);
    }
    chip.textContent = totalAmount >= 1000 ? `${totalAmount / 1000}k` : totalAmount;
}

function repaintBetVisuals() {
    clearBetsVisuals();
    for (const key in bets) {
        const btn = document.querySelector(`[data-bet="${key}"]`);
        if (btn) updateBetVisuals(btn, bets[key]);
    }
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
    const inner = canvas.width * 0.33;
    const angleSize = (Math.PI * 2) / rouletteNumbers.length;

    // outer base
    ctx.beginPath();
    ctx.arc(cx, cy, canvas.width * 0.49, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(20, 11, 42, 0.96)";
    ctx.fill();
    ctx.strokeStyle = "#f5d76e";
    ctx.lineWidth = canvas.width * 0.014;
    ctx.stroke();

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rotation);
    ctx.translate(-cx, -cy);

    rouletteNumbers.forEach((num, i) => {
        const start = i * angleSize - Math.PI / 2;
        const end = start + angleSize;
        const color = num === 0 ? "#1fa84a" : redSet.has(num) ? "#c62828" : "#111";

        ctx.beginPath();
        ctx.arc(cx, cy, outer, start, end);
        ctx.arc(cx, cy, inner, end, start, true);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = "#d4af37";
        ctx.lineWidth = Math.max(1, canvas.width * 0.004);
        ctx.stroke();

        const textAngle = start + angleSize / 2;
        const r = (outer + inner) / 2;
        const x = cx + Math.cos(textAngle) * r;
        const y = cy + Math.sin(textAngle) * r;

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(textAngle + Math.PI / 2);
        ctx.fillStyle = "white";
        ctx.font = `900 ${canvas.width * 0.032}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.shadowColor = "rgba(0,0,0,0.85)";
        ctx.shadowBlur = 3;
        ctx.fillText(num, 0, 0);
        ctx.restore();
    });

    ctx.restore();

    // center
    ctx.beginPath();
    ctx.arc(cx, cy, inner - canvas.width * 0.02, 0, Math.PI * 2);
    ctx.fillStyle = "#7c5ac2";
    ctx.fill();
    ctx.strokeStyle = "#d4af37";
    ctx.lineWidth = canvas.width * 0.008;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, canvas.width * 0.03, 0, Math.PI * 2);
    ctx.fillStyle = "#d4af37";
    ctx.fill();

    // ball
    if (ballVisible) {
        const r = (outer + inner) / 2;
        const bx = cx + Math.cos(ballAngle + rotation) * r;
        const by = cy + Math.sin(ballAngle + rotation) * r;

        ctx.save();
        ctx.shadowBlur = canvas.width * 0.035;
        ctx.shadowColor = "white";
        ctx.beginPath();
        ctx.arc(bx, by, canvas.width * 0.026, 0, Math.PI * 2);
        ctx.fillStyle = "white";
        ctx.fill();
        ctx.strokeStyle = "#f5d76e";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
    }
}

// ----------------------
// 勝利判定
// ----------------------
function getWinningIndex() {
    const angleSize = (Math.PI * 2) / rouletteNumbers.length;
    let r = rotation % (Math.PI * 2);
    if (r < 0) r += Math.PI * 2;
    const pointer = (Math.PI * 2 - r) % (Math.PI * 2);
    return Math.floor(pointer / angleSize) % rouletteNumbers.length;
}

function getWinningNumber() {
    return rouletteNumbers[getWinningIndex()];
}

function setBallToWinningIndex(index) {
    const angleSize = (Math.PI * 2) / rouletteNumbers.length;
    ballAngle = index * angleSize - Math.PI / 2 + angleSize / 2;
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

        if (!Number.isNaN(Number(key))) {
            if (parseInt(key, 10) === result) payout = 36;
        } else if (key === "RED" && redSet.has(result)) payout = 2;
        else if (key === "BLACK" && result !== 0 && !redSet.has(result)) payout = 2;
        else if (key === "ODD" && result !== 0 && result % 2 === 1) payout = 2;
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
    setResultDisplay(`Result : ${result}`, true);

    if (win > 0) {
        setCustomMessage(`当たりにゃ！ ${hitBets.join(", ")} で +${win.toLocaleString()} Renga にゃ！`);
    } else {
        if (balance <= 1000) setCatMessage("lowBalance");
        else setCatMessage("lose");
    }

    bets = {};
    betHistory = [];
    updateBalance();
    setTimeout(clearBetsVisuals, 1400);
}

// ----------------------
// スピン
// ----------------------
function spinRoulette() {
    if (spinning) return;

    let totalBet = 0;
    for (const key in bets) totalBet += bets[key];

    if (totalBet === 0) {
        setCatMessage("noBet");
        return;
    }

    if (totalBet >= 1000) setCatMessage("bigBet");

    spinning = true;
    ballVisible = false;
    setResultDisplay("Spinning...", false);

    let speed = Math.random() * 0.15 + 0.35;
    const friction = 0.988;

    function animate() {
        rotation += speed;
        speed *= friction;
        drawRoulette();

        if (speed > 0.001) {
            requestAnimationFrame(animate);
        } else {
            spinning = false;
            const resultIndex = getWinningIndex();
            const result = rouletteNumbers[resultIndex];
            setBallToWinningIndex(resultIndex);
            ballVisible = true;
            drawRoulette();
            resolveBets(result);
        }
    }

    animate();
}

// ----------------------
// ボタン処理
// ----------------------
document.getElementById("spinButton").addEventListener("click", spinRoulette);

document.getElementById("clearButton").addEventListener("click", () => {
    if (spinning) return;
    for (const key in bets) balance += bets[key];
    bets = {};
    betHistory = [];
    updateBalance();
    clearBetsVisuals();
    setResultDisplay("Result : -", false);
    setCatMessage("idle");
});

document.getElementById("backButton").addEventListener("click", () => {
    if (spinning || betHistory.length === 0) return;

    const last = betHistory.pop();
    bets[last.bet] -= last.amount;
    balance += last.amount;

    if (bets[last.bet] <= 0) delete bets[last.bet];

    updateBalance();
    repaintBetVisuals();
    setCustomMessage("直前のBETを戻したにゃ。");
});

// ----------------------
// 初期化
// ----------------------
function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    const size = Math.min(rect.width, rect.height);
    canvas.width = Math.max(320, Math.floor(size));
    canvas.height = Math.max(320, Math.floor(size));
    drawRoulette();
}

createBetTable();
updateBalance();
setCatMessage("idle");
setResultDisplay("Result : -", false);

window.addEventListener("resize", resizeCanvas);
requestAnimationFrame(resizeCanvas);
