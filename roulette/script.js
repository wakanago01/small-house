console.log("Dream Roulette adjusted loaded");

const canvas = document.getElementById("rouletteCanvas");
const ctx = canvas.getContext("2d");
const catBodyImg = new Image();
const catTailImg = new Image();
catBodyImg.src = "img/cat_hontai.png";
catTailImg.src = "img/cat_sippo.png";

let catBodyReady = false;
let catTailReady = false;
let catBodyAsset = null;
let catTailAsset = null;
function redrawWhenCatReady() {
  if (catBodyReady && catTailReady) drawRoulette();
}
function makeGreenTransparentAsset(img) {
  const asset = document.createElement("canvas");
  const assetCtx = asset.getContext("2d");
  asset.width = img.naturalWidth || img.width;
  asset.height = img.naturalHeight || img.height;
  assetCtx.drawImage(img, 0, 0);

  const imageData = assetCtx.getImageData(0, 0, asset.width, asset.height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const strongestNonGreen = Math.max(r, b);
    const greenDominance = g - strongestNonGreen;

    if (g > 80 && g > r * 1.22 && g > b * 1.22 && greenDominance > 28) {
      const alpha = Math.max(0, Math.min(255, 255 - (greenDominance - 28) * 5));
      data[i + 3] = Math.min(data[i + 3], alpha);
      data[i + 1] = Math.min(g, strongestNonGreen);
    }
  }

  assetCtx.putImageData(imageData, 0, 0);
  return asset;
}
catBodyImg.onload = () => {
  catBodyAsset = makeGreenTransparentAsset(catBodyImg);
  catBodyReady = true;
  redrawWhenCatReady();
};
catTailImg.onload = () => {
  catTailAsset = makeGreenTransparentAsset(catTailImg);
  catTailReady = true;
  redrawWhenCatReady();
};
catBodyImg.onerror = () => {
  catBodyAsset = null;
  catBodyReady = false;
  drawRoulette();
};
catTailImg.onerror = () => {
  catTailAsset = null;
  catTailReady = false;
  drawRoulette();
};

const rouletteNumbers = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10,
  5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
];
const redSet = new Set([
  1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
]);

let rotation = 0;
let spinning = false;
let tailAngle = -Math.PI / 2 + Math.PI / rouletteNumbers.length;
let bets = {};
let betHistory = [];
let balance = 50000;
let selectedChip = 100;

const catMessages = {
  idle: [
    "幸運を祈るにゃ。素敵な時間になるといいにゃ。",
    "どこに賭けるか、ゆっくり考えるにゃ。",
    "黒猫は静かに見守っているにゃ。",
  ],
  win: [
    "すごいにゃ！勝ちだにゃ！",
    "今日はツイてるにゃ。",
    "金色の星が味方しているにゃ。",
  ],
  lose: [
    "残念だにゃ……でも次があるにゃ。",
    "まだ終わりじゃないにゃ。",
    "黒猫はもう一度の挑戦を見守るにゃ。",
  ],
  bigBet: [
    "大胆だにゃ……覚悟はできているにゃ？",
    "大きな勝負に出たにゃ。",
    "これは運命の一投かもしれないにゃ。",
  ],
  lowBalance: [
    "Rengaが少なくなってきたにゃ。無理はしないでにゃ。",
    "少し休むのも作戦だにゃ。",
    "黒猫は心配しているにゃ。",
  ],
};

function setCatMessage(type) {
  const list = catMessages[type] || catMessages.idle;
  setCustomMessage(list[Math.floor(Math.random() * list.length)]);
}

function setCustomMessage(text) {
  document.getElementById("catMessage").textContent = text;
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
  document.querySelectorAll(".chip").forEach((c) => c.classList.remove("active"));
  e.target.classList.add("active");
  selectedChip = Number(e.target.dataset.chip);
});

function createBetTable() {
  const table = document.getElementById("betTable");
  table.innerHTML = "";

  const zeroWrap = document.createElement("div");
  zeroWrap.id = "zeroAndRows";

  const zero = document.createElement("button");
  zero.className = "betCell zeroCell";
  zero.dataset.bet = "0";
  zero.textContent = "0";
  zero.style.background = "linear-gradient(180deg,#079243,#005d2a)";
  zeroWrap.appendChild(zero);

  const grid = document.createElement("div");
  grid.id = "numberGrid";

  for (let colIndex = 0; colIndex < 12; colIndex++) {
    const col = document.createElement("div");
    col.className = "betColumn";

    for (let row = 0; row < 3; row++) {
      const num = colIndex * 3 + (3 - row);
      const cell = document.createElement("button");
      cell.className = "betCell";
      cell.dataset.bet = num;
      cell.innerHTML = `<span class="numLabel">${num}</span>`;
      cell.style.background = redSet.has(num)
        ? "linear-gradient(180deg,#b52022,#65110f)"
        : "linear-gradient(180deg,#202020,#050505)";
      col.appendChild(cell);
    }

    grid.appendChild(col);
  }

  zeroWrap.appendChild(grid);
  table.appendChild(zeroWrap);

  const dozens = document.createElement("div");
  dozens.id = "dozens";

  [
    { id: "1st12", label: "1st 12" },
    { id: "2nd12", label: "2nd 12" },
    { id: "3rd12", label: "3rd 12" },
  ].forEach((item) => {
    const button = document.createElement("button");
    button.className = "outsideBet";
    button.dataset.bet = item.id;
    button.textContent = item.label;
    dozens.appendChild(button);
  });

  table.appendChild(dozens);

  const outside = document.createElement("div");
  outside.id = "outsideBets";

  [
    { id: "1-18", label: "1-18" },
    { id: "EVEN", label: "EVEN" },
    { id: "RED", label: "◆", bg: "linear-gradient(180deg,#b52022,#65110f)" },
    { id: "BLACK", label: "◆", bg: "linear-gradient(180deg,#202020,#050505)" },
    { id: "ODD", label: "ODD" },
    { id: "19-36", label: "19-36" },
  ].forEach((item) => {
    const button = document.createElement("button");
    button.className = "outsideBet";
    button.dataset.bet = item.id;
    button.textContent = item.label;
    if (item.bg) button.style.background = item.bg;
    outside.appendChild(button);
  });

  table.appendChild(outside);
}

function updateBetVisuals(btn, total) {
  let chip = btn.querySelector(".betChip");

  if (!chip) {
    chip = document.createElement("div");
    chip.className = "betChip";
    btn.appendChild(chip);
  }

  chip.textContent = total >= 1000 ? `${total / 1000}k` : total;
}

function redrawAllBetVisuals() {
  document.querySelectorAll(".betChip").forEach((chip) => chip.remove());

  for (const key in bets) {
    const button = document.querySelector(`[data-bet="${CSS.escape(key)}"]`);
    if (button) updateBetVisuals(button, bets[key]);
  }
}

function clearBetsVisuals() {
  document.querySelectorAll(".betChip").forEach((chip) => chip.remove());
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
  if (size <= 0) return;
  canvas.width = size;
  canvas.height = size;
  drawRoulette();
}

function getSlotDisplayAngle(index) {
  const angleSize = (Math.PI * 2) / rouletteNumbers.length;
  return index * angleSize - Math.PI / 2 + angleSize / 2 + rotation;
}

function getSlotDisplayAngleForNumber(num) {
  const index = rouletteNumbers.indexOf(num);
  return getSlotDisplayAngle(index < 0 ? 0 : index);
}

function drawRotatingTail(cx, cy, ringR) {
  if (!catTailReady || !catTailAsset) return;

  const pivotX = catTailAsset.width * 0.2;
  const pivotY = catTailAsset.height * 0.9;
  const tipX = catTailAsset.width * 0.38;
  const tipY = catTailAsset.height * 0.08;
  const sourceAngle = Math.atan2(tipY - pivotY, tipX - pivotX);
  const sourceLength = Math.hypot(tipX - pivotX, tipY - pivotY);
  const scale = ringR / sourceLength;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(tailAngle - sourceAngle);
  ctx.scale(scale, scale);
  ctx.drawImage(catTailAsset, -pivotX, -pivotY);
  ctx.restore();
}

function drawCenterCat(cx, cy, r, ringR) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, ringR * 1.08, 0, Math.PI * 2);
  ctx.clip();

  drawRotatingTail(cx, cy, ringR);

  if (catBodyReady && catBodyAsset) {
    const bodyH = r * 2;
    const bodyW = bodyH * (catBodyAsset.width / catBodyAsset.height);
    ctx.drawImage(catBodyAsset, cx - bodyW * 0.52, cy - bodyH * 0.5, bodyW, bodyH);
  } else {
    ctx.fillStyle = "#120d16";
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.72, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawRoulette() {
  if (!canvas.width || !canvas.height) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const outer = canvas.width * 0.485;
  const inner = canvas.width * 0.36;
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
    const textR = (outer + inner) / 2;
    const x = cx + Math.cos(textAngle) * textR;
    const y = cy + Math.sin(textAngle) * textR;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(textAngle + Math.PI / 2);
    ctx.fillStyle = "white";
    ctx.font = `bold ${canvas.width * 0.036}px Georgia`;
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
  ctx.fillStyle = "#2a1737";
  ctx.fill();
  ctx.strokeStyle = "#d9b147";
  ctx.lineWidth = 4;
  ctx.stroke();

  drawCenterCat(cx, cy, canvas.width * 0.31, (outer + inner) / 2);
}

function getWinningNumber() {
  const angleSize = (Math.PI * 2) / rouletteNumbers.length;
  let normalizedRotation = rotation % (Math.PI * 2);
  if (normalizedRotation < 0) normalizedRotation += Math.PI * 2;
  return rouletteNumbers[
    Math.floor(((Math.PI * 2 - normalizedRotation) % (Math.PI * 2)) / angleSize)
  ];
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
  setTimeout(clearBetsVisuals, 1600);
}

function spinRoulette() {
  if (spinning) return;

  let total = 0;
  for (const key in bets) total += bets[key];

  if (total === 0) {
    setCustomMessage("まずはBET表にチップを置くにゃ。");
    return;
  }

  if (total >= 1000) setCatMessage("bigBet");

  spinning = true;
  updateResult("Spinning...");
  clearBetsVisuals();

  let speed = Math.random() * 0.16 + 0.38;
  const friction = 0.988;

  function animate() {
    rotation += speed;
    speed *= friction;
    tailAngle = getSlotDisplayAngle(0);
    drawRoulette();

    if (speed > 0.001) {
      requestAnimationFrame(animate);
    } else {
      spinning = false;
      const result = getWinningNumber();
      tailAngle = getSlotDisplayAngleForNumber(result);
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
