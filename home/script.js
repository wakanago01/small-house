/**
 * Small House - Home Screen Logic
 */

// Initial Game State Constants for Reset
const INITIAL_STATE = {
    coins: 1000,
    debt: 50000,
    remainingDebt: 49000,
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
let secondsPassed = 0;

// Item database
const ITEMS = {
    food: { name: "高級弁当", icon: "🍱", price: 100, desc: "栄養満点のお弁当。満腹度が30回復し、ストレスが少し軽減されます。", effect: { hunger: 30, stress: -5, thirst: -10 } },
    alcohol: { name: "ヴィンテージワイン", icon: "🍷", price: 200, desc: "芳醇な香りの赤ワイン。ストレスを大幅に（20）軽減しますが、酔いが回ります。", effect: { stress: -20, alcohol: 15 } },
    smoke: { name: "高級タバコ", icon: "🚬", price: 150, desc: "最高級の葉を使用したタバコ。ストレスを15軽減します。", effect: { stress: -15, cigarette: 10 } }
};

// UI Elements mapping
const uiElements = {
    coins: document.getElementById('stat-coins'),
    debt: document.getElementById('stat-debt'),
    debtRem: document.getElementById('stat-debt-rem'),
    days: document.getElementById('stat-days'),
    clockProgress: document.getElementById('clock-progress'),
    // HUD permanent gauges
    sideBarHunger: document.getElementById('side-bar-hunger'),
    sideBarStress: document.getElementById('side-bar-stress'),
    sideBarAlcohol: document.getElementById('side-bar-alcohol'),
    sideBarCigarette: document.getElementById('side-bar-cigarette'),
    sideBarSleep: document.getElementById('side-bar-sleep-hud'),
    // Modal elements
    inventoryList: document.getElementById('inventory-list'),
    itemDetail: document.getElementById('item-detail-area'),
    detailName: document.getElementById('detail-name'),
    detailDesc: document.getElementById('detail-desc'),
    useItemBtn: document.getElementById('use-item-btn')
};

/**
 * Update UI with current game state
 */
function updateUI() {
    // Financials
    uiElements.coins.textContent = gameState.coins.toLocaleString();
    uiElements.debt.textContent = gameState.debt.toLocaleString();
    uiElements.debtRem.textContent = gameState.remainingDebt.toLocaleString();
    uiElements.days.textContent = `DAY ${gameState.days}`;

    // Header HUD gauges
    updateProgressBar(uiElements.sideBarHunger, gameState.hunger, true);
    updateProgressBar(uiElements.sideBarStress, gameState.stress, false);
    updateProgressBar(uiElements.sideBarAlcohol, gameState.alcohol, false);
    updateProgressBar(uiElements.sideBarCigarette, gameState.cigarette, false);
    updateProgressBar(uiElements.sideBarSleep, gameState.sleep, false); // Lower sleepiness is better

    // Status Modal Detail Bars (if visible)
    if (!document.getElementById('status-modal').classList.contains('hidden')) {
        updateAAAStatusBars();
    }
}

function updateProgressBar(el, value, isInverse = false) {
    if (!el) return;
    el.style.width = `${Math.min(100, Math.max(0, value))}%`;
    
    // Dynamic color logic for AAA look
    el.className = 'fill';
    if (isInverse) { // Higher is better (Hunger)
        if (value < 20) el.style.background = 'linear-gradient(90deg, #ff7675, #d63031)';
        else if (value < 50) el.style.background = 'linear-gradient(90deg, #ffeaa7, #fdcb6e)';
        else el.style.background = 'linear-gradient(90deg, #b8e994, #78e08f)';
    } else { // Lower is better (Stress, Alcohol, Sleepiness)
        if (value > 80) el.style.background = 'linear-gradient(90deg, #ff7675, #d63031)';
        else if (value > 50) el.style.background = 'linear-gradient(90deg, #ffeaa7, #fdcb6e)';
        else el.style.background = 'linear-gradient(90deg, #b8e994, #78e08f)';
    }
}

function updateAAAStatusBars() {
    // Left Side
    updateProgressBar(document.getElementById('status-bar-stress'), gameState.stress, false);
    updateProgressBar(document.getElementById('status-bar-hunger'), gameState.hunger, true);
    updateProgressBar(document.getElementById('status-bar-alcohol'), gameState.alcohol, false);
    
    // Right Side
    updateProgressBar(document.getElementById('status-bar-sleep'), gameState.sleep, false);
    updateProgressBar(document.getElementById('status-bar-smoking'), gameState.cigarette, false);

    // Bottom Info Logic
    const moodVal = gameState.stress > 60 ? "Anxious" : (gameState.hunger < 30 ? "Hungry" : "Peaceful");
    document.getElementById('val-mood').textContent = moodVal;
}

/**
 * Navigation Logic
 */
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
        const label = item.querySelector('.nav-label').textContent;
        
        if (label === 'Settings') {
            openModal('settings-modal');
        } else if (label === 'Info') {
            openModal('info-modal');
        } else if (label === 'Shop') {
            openModal('shop-modal');
        } else if (label === 'Inventory') {
            updateInventoryUI();
            openModal('inventory-modal');
        } else if (label === 'Sleep') {
            handleAction('sleep');
        } else if (label === 'Status') {
            updateAAAStatusBars();
            openModal('status-modal');
        }
        
        if (!['Sleep'].includes(label)) {
            const active = document.querySelector('.nav-item.active');
            if(active) active.classList.remove('active');
            item.classList.add('active');
        }
    });
});

function openModal(id) { document.getElementById(id).classList.remove('hidden'); }
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }

/**
 * Shop & Inventory
 */
function adjustShopQty(type, delta) {
    const input = document.getElementById(`qty-${type}`);
    let val = parseInt(input.value) + delta;
    if (val < 1) val = 1;
    if (val > 99) val = 99;
    input.value = val;
}

function confirmPurchase(type) {
    const qtyInput = document.getElementById(`qty-${type}`);
    const qty = parseInt(qtyInput.value);
    const item = ITEMS[type];
    const totalPrice = item.price * qty;

    if (gameState.coins >= totalPrice) {
        if (confirm(`${item.name} を ${qty} 個、合計 ${totalPrice} COINS で購入しますか？`)) {
            buyItem(type, qty);
            qtyInput.value = 1;
        }
    } else {
        showToast("コインが足りません...");
    }
}

function buyItem(type, qty = 1) {
    const item = ITEMS[type];
    const totalPrice = item.price * qty;
    if (gameState.coins >= totalPrice) {
        gameState.coins -= totalPrice;
        for (let i = 0; i < qty; i++) {
            gameState.inventory.push({ ...item });
        }
        showToast(`${item.name} を ${qty} 個購入しました！`);
        updateUI();
    }
}

function updateInventoryUI() {
    uiElements.inventoryList.innerHTML = '';
    if (gameState.inventory.length === 0) {
        uiElements.inventoryList.innerHTML = '<div class="empty-inventory-msg">持ち物はありません...</div>';
        uiElements.itemDetail.classList.add('hidden');
        return;
    }
    gameState.inventory.forEach((item, index) => {
        const itemEl = document.createElement('div');
        itemEl.className = 'inventory-item glass-panel';
        itemEl.textContent = item.icon;
        itemEl.onclick = () => showItemDetail(index);
        uiElements.inventoryList.appendChild(itemEl);
    });
}

function showItemDetail(index) {
    const item = gameState.inventory[index];
    uiElements.detailName.textContent = item.name;
    uiElements.detailDesc.textContent = item.desc;
    uiElements.itemDetail.classList.remove('hidden');
    uiElements.useItemBtn.onclick = () => useItem(index);
}

function useItem(index) {
    const item = gameState.inventory[index];
    if (item.effect.hunger) gameState.hunger = Math.min(100, gameState.hunger + item.effect.hunger);
    if (item.effect.stress) gameState.stress = Math.max(0, gameState.stress + item.effect.stress);
    if (item.effect.alcohol) gameState.alcohol = Math.min(100, gameState.alcohol + item.effect.alcohol);
    if (item.effect.cigarette) gameState.cigarette = Math.min(100, gameState.cigarette + item.effect.cigarette);
    if (item.effect.thirst) gameState.thirst = Math.min(100, gameState.thirst + 10);

    showToast(`${item.name}を使用しました。`);
    gameState.inventory.splice(index, 1);
    uiElements.itemDetail.classList.add('hidden');
    updateInventoryUI();
    updateUI();
}

/**
 * Survival Loop
 */
const DAY_DURATION_SEC = 20 * 60; // 1200 seconds
const HUNGER_DRAIN_PER_SEC = 100 / 3600; 
const SLEEP_INC_PER_SEC = 100 / 1200; // Max in 20 mins
const STRESS_BASE_INC_PER_SEC = 5 / 1200; // Base ~5 per day

function updateSurvivalClock() {
    // 1. Hunger Drain
    gameState.hunger = Math.max(0, gameState.hunger - HUNGER_DRAIN_PER_SEC);
    
    // 2. Sleepiness (fills up over 20 mins)
    gameState.sleep = Math.min(100, gameState.sleep + SLEEP_INC_PER_SEC);
    
    // 3. Stress Growth (accelerates with sleepiness)
    // Formula: Increases faster as character gets sleepier (up to 3x base rate)
    const stressMultiplier = 1 + (gameState.sleep / 50); 
    gameState.stress = Math.min(100, gameState.stress + (STRESS_BASE_INC_PER_SEC * stressMultiplier));

    if (gameState.hunger <= 0) {
        triggerGameOver();
        return;
    }

    secondsPassed++;
    const progress = secondsPassed / DAY_DURATION_SEC;
    const offset = 283 - (283 * progress);
    if (uiElements.clockProgress) uiElements.clockProgress.style.strokeDashoffset = offset;

    if (secondsPassed >= DAY_DURATION_SEC) {
        advanceDay();
    }
    updateUI();
}

function advanceDay() {
    secondsPassed = 0;
    gameState.days += 1;
    // Motivation/Other daily shifts can be added here
    showToast(`${gameState.days}日目を迎えました。`);
}

function triggerGameOver() {
    alert("【GAME OVER】\n生存の糸が切れてしまいました...\n全ての記録がリセットされます。");
    gameState = { ...INITIAL_STATE };
    secondsPassed = 0;
    updateUI();
}

setInterval(updateSurvivalClock, 1000);

/**
 * Actions
 */
function handleAction(type) {
    switch(type) {
        case 'sleep':
            if (confirm("眠りに落ちて、次の日を迎えますか？")) {
                gameState.days += 1;
                gameState.hunger = Math.max(0, gameState.hunger - 30);
                gameState.sleep = 0; // Reset sleepiness
                gameState.stress = Math.max(0, gameState.stress - 25);
                secondsPassed = 0;
                showToast("心地よい眠りから覚めました。");
            }
            break;
    }
    updateUI();
}

function playGame(gameId) {
    document.body.style.opacity = '0';
    setTimeout(() => { window.location.href = `../${gameId}/index.html`; }, 500);
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'glass-panel toast-message';
    toast.textContent = message;
    Object.assign(toast.style, {
        position: 'fixed', bottom: '100px', left: '50%', transform: 'translateX(-50%)',
        padding: '10px 30px', zIndex: '3000', fontSize: '14px', color: '#f7d8ef',
        border: '1px solid #d4b5e8', animation: 'fadeInOut 3s forwards'
    });
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

window.onload = () => { updateUI(); };

const style = document.createElement('style');
style.innerHTML = `@keyframes fadeInOut { 0% { opacity: 0; transform: translate(-50%, 20px); } 15% { opacity: 1; transform: translate(-50%, 0); } 85% { opacity: 1; transform: translate(-50%, 0); } 100% { opacity: 0; transform: translate(-50%, -20px); } }`;
document.head.appendChild(style);
