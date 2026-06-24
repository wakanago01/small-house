/**
 * Small House - Home Screen Logic
 */

// DOM Elements
const uiElements = {
    coins: document.getElementById('stat-coins'),
    debt: document.getElementById('stat-debt'),
    debtRem: document.getElementById('stat-debt-rem'),
    days: document.getElementById('stat-days'),
    sideBarHunger: document.getElementById('side-bar-hunger'),
    sideBarStress: document.getElementById('side-bar-stress'),
    
    // Repay Modal
    repayCurrentCoins: document.getElementById('repay-current-coins'),
    repayRemainingDebt: document.getElementById('repay-remaining-debt'),
    repayAmountInput: document.getElementById('repay-amount-input'),
    
    // Inventory
    inventoryList: document.getElementById('inventory-list'),
    itemDetail: document.getElementById('item-detail'),
    detailName: document.getElementById('detail-name'),
    detailDesc: document.getElementById('detail-desc'),
    useItemBtn: document.getElementById('use-item-btn'),
    
    // Clock
    clockProgress: document.getElementById('clock-progress')
};

// Initial Game State Constants for Reset
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
let secondsPassed = 0;

/**
 * State Persistence
 */
const STORAGE_KEY = 'small_house_game_state';

function saveGameState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
}

function loadGameState() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            gameState = { ...INITIAL_STATE, ...parsed };
        } catch (e) {
            console.error("Failed to parse saved state:", e);
            gameState = { ...INITIAL_STATE };
        }
    } else {
        gameState = { ...INITIAL_STATE };
    }
}

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

    // Status Modal Detail Bars (if visible)
    if (!document.getElementById('status-modal').classList.contains('hidden')) {
        updateAAAStatusBars();
    }
    
    saveGameState(); // Auto-save on UI update
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
        } else if (label === 'Repay') {
            openRepayModal();
        } else if (label === 'Sleep') {
            handleAction('sleep');
        } else if (label === 'Status') {
            updateAAAStatusBars();
            openModal('status-modal');
        }
        
        if (!['Sleep', 'Repay'].includes(label)) {
            const active = document.querySelector('.nav-item.active');
            if(active) active.classList.remove('active');
            item.classList.add('active');
        }
    });
});

/**
 * Debt Repayment
 */
function openRepayModal() {
    uiElements.repayCurrentCoins.textContent = gameState.coins.toLocaleString();
    uiElements.repayRemainingDebt.textContent = gameState.remainingDebt.toLocaleString();
    uiElements.repayAmountInput.value = '';
    openModal('repay-modal');
}

function setRepayAmount(amount) {
    const current = parseInt(uiElements.repayAmountInput.value) || 0;
    uiElements.repayAmountInput.value = current + amount;
}

function setRepayMax() {
    uiElements.repayAmountInput.value = Math.min(gameState.coins, gameState.remainingDebt);
}

function confirmRepayment() {
    const amount = parseInt(uiElements.repayAmountInput.value) || 0;
    if (amount <= 0) return;

    if (amount > gameState.coins) {
        showToast("コインが足りません！");
        return;
    }

    if (amount > gameState.remainingDebt) {
        showToast("借金額を超えています！");
        return;
    }

    gameState.coins -= amount;
    gameState.remainingDebt -= amount;
    showToast(`${amount.toLocaleString()} COINS を返済しました。`);
    updateUI();
    closeModal('repay-modal');
}

function pressCalcKey(key) {
    const input = document.getElementById('repay-amount-input');
    if (!input) return;
    let val = input.value;
    
    if (key === 'C') {
        input.value = '';
    } else if (key === 'BS') {
        input.value = val.slice(0, -1);
    } else {
        if (val === '') {
            if (key === '0') return; // Don't start with 0
            input.value = key;
        } else {
            input.value = val + key;
        }
    }
}

window.pressCalcKey = pressCalcKey;
window.setRepayAmount = setRepayAmount;
window.setRepayMax = setRepayMax;
window.confirmRepayment = confirmRepayment;

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
const DAY_DURATION_SEC = 20 * 60; // 20 minutes
const HUNGER_DRAIN_PER_SEC = 100 / 3600; 
const SLEEP_INC_PER_SEC = 100 / 1200; // Max in 20 mins
const STRESS_BASE_INC_PER_SEC = 5 / 1200; // Base ~5 per day

function updateSurvivalClock() {
    // 1. Hunger Drain
    gameState.hunger = Math.max(0, gameState.hunger - HUNGER_DRAIN_PER_SEC);
    
    // 2. Sleepiness
    gameState.sleep = Math.min(100, gameState.sleep + SLEEP_INC_PER_SEC);
    
    // 3. Stress Growth
    const stressMultiplier = 1 + (gameState.sleep / 50); 
    gameState.stress = Math.min(100, gameState.stress + (STRESS_BASE_INC_PER_SEC * stressMultiplier));

    if (gameState.hunger <= 0) {
        triggerGameOver();
        return;
    }

    secondsPassed++;
    const progress = secondsPassed / DAY_DURATION_SEC;
    const offset = 283 * (1 - progress);
    if (uiElements.clockProgress) uiElements.clockProgress.style.strokeDashoffset = offset;

    if (secondsPassed >= DAY_DURATION_SEC) {
        advanceDay(true); // Forced all-nighter
    }
    updateUI();
}

function advanceDay(isAllNighter = false) {
    secondsPassed = 0;
    gameState.days += 1;
    
    let message = "新しい朝を迎えました。";
    if (isAllNighter) {
        message = "徹夜してしまった...。";
        gameState.stress = Math.min(100, gameState.stress + 5);
        showToast("徹夜によりストレスが上昇しました。");
    }

    showDayStartOverlay(gameState.days, message);
}

function showDayStartOverlay(day, message) {
    const overlay = document.getElementById('day-start-overlay');
    const dayText = document.getElementById('day-number-text');
    const msgText = document.getElementById('day-message-text');
    
    dayText.textContent = `DAY ${day}`;
    msgText.textContent = message;
    
    overlay.classList.remove('hidden');
    overlay.classList.remove('fade-out-overlay');

    setTimeout(() => {
        overlay.classList.add('fade-out-overlay');
        setTimeout(() => {
            overlay.classList.add('hidden');
        }, 1000);
    }, 4000);
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
async function handleAction(type) {
    switch(type) {
        case 'sleep':
            // Sleep only allowed after half a day (10 minutes / 600 seconds)
            const SLEEP_THRESHOLD = 600; 
            if (secondsPassed < SLEEP_THRESHOLD) {
                showToast("まだ昼なので、眠くありません。");
                return;
            }

            if (confirm("眠りに落ちて、次の日を迎えますか？")) {
                const blackout = document.getElementById('sleep-blackout');
                blackout.classList.remove('hidden');
                
                // Wait for blackout animation
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                // Apply survival penalties/bonuses
                gameState.hunger = Math.max(0, gameState.hunger - 20); // 20% drain
                gameState.stress = Math.max(0, gameState.stress - 10); // 10% recovery
                gameState.sleep = 0;
                
                // Move to next day
                advanceDay(false); 
                
                await new Promise(resolve => setTimeout(resolve, 1000));
                blackout.classList.add('hidden');
            }
            break;
    }
    updateUI();
}

function playGame(gameId, filename = 'index.html') {
    saveGameState();
    document.body.style.opacity = '0';
    setTimeout(() => { window.location.href = `../${gameId}/${filename}`; }, 500);
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

window.onload = () => { 
    loadGameState();
    updateUI(); 
};

const style = document.createElement('style');
style.innerHTML = `@keyframes fadeInOut { 0% { opacity: 0; transform: translate(-50%, 20px); } 15% { opacity: 1; transform: translate(-50%, 0); } 85% { opacity: 1; transform: translate(-50%, 0); } 100% { opacity: 0; transform: translate(-50%, -20px); } }`;
document.head.appendChild(style);
