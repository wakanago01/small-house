/**
 * Small House - Home Screen Logic
 * Handles state updates, animations, and interaction placeholders.
 */

// Initial Game State
const gameState = {
    coins: 1000,
    debt: 50000,
    remainingDebt: 49000,
    hunger: 80,
    stress: 20,
    alcohol: 45,
    cigarette: 10,
    days: 1
};

// UI Elements mapping
const uiElements = {
    coins: document.getElementById('stat-coins'),
    debt: document.getElementById('stat-debt'),
    debtRem: document.getElementById('stat-debt-rem'),
    days: document.getElementById('stat-days'),
    barHunger: document.getElementById('bar-hunger'),
    barStress: document.getElementById('bar-stress'),
    sideBarHunger: document.getElementById('side-bar-hunger'),
    sideBarStress: document.getElementById('side-bar-stress'),
    sideBarAlcohol: document.getElementById('side-bar-alcohol'),
    sideBarCigarette: document.getElementById('side-bar-cigarette')
};

/**
 * Update UI with current game state
 */
function updateUI() {
    // Text updates
    uiElements.coins.textContent = gameState.coins.toLocaleString();
    uiElements.debt.textContent = gameState.debt.toLocaleString();
    uiElements.debtRem.textContent = gameState.remainingDebt.toLocaleString();
    uiElements.days.textContent = `DAY ${gameState.days}`;

    // Progress bar updates
    uiElements.barHunger.style.width = `${gameState.hunger}%`;
    uiElements.barStress.style.width = `${gameState.stress}%`;
    uiElements.sideBarHunger.style.width = `${gameState.hunger}%`;
    uiElements.sideBarStress.style.width = `${gameState.stress}%`;
    uiElements.sideBarAlcohol.style.width = `${gameState.alcohol}%`;
    uiElements.sideBarCigarette.style.width = `${gameState.cigarette}%`;

    // Visual feedback for low values (e.g., hunger)
    if (gameState.hunger < 20) {
        uiElements.barHunger.style.background = 'linear-gradient(90deg, #ff4d4d, #ff9999)';
    } else {
        uiElements.barHunger.style.background = '';
    }
}

/**
 * Handle sidebar action buttons
 * @param {string} type - Action type
 */
function handleAction(type) {
    console.log(`Action performed: ${type}`);
    
    // Play a click sound effect placeholder
    const clickSound = new Audio(); // Placeholder
    
    switch(type) {
        case 'play':
            alert("どのゲームで遊びますか？カードを選択してください。");
            break;
        case 'food':
            if (gameState.coins >= 100) {
                gameState.coins -= 100;
                gameState.hunger = Math.min(100, gameState.hunger + 30);
                gameState.stress = Math.max(0, gameState.stress - 5);
                showToast("食事を購入しました。満腹度が回復しました。");
            } else {
                showToast("コインが足りません...");
            }
            break;
        case 'alcohol':
            if (gameState.coins >= 200) {
                gameState.coins -= 200;
                gameState.stress = Math.max(0, gameState.stress - 20);
                gameState.alcohol = Math.min(100, gameState.alcohol + 15);
                showToast("お酒を飲みました。ストレスが大幅に軽減されました。");
            } else {
                showToast("コインが足りません...");
            }
            break;
        case 'smoke':
            if (gameState.coins >= 150) {
                gameState.coins -= 150;
                gameState.stress = Math.max(0, gameState.stress - 15);
                gameState.cigarette = Math.min(100, gameState.cigarette + 10);
                showToast("タバコを吸いました。少し落ち着きました。");
            } else {
                showToast("コインが足りません...");
            }
            break;
        case 'sleep':
            if (confirm("一日を終了して眠りますか？")) {
                gameState.days += 1;
                gameState.hunger = Math.max(0, gameState.hunger - 40);
                gameState.stress = Math.max(0, gameState.stress - 30);
                showToast(`${gameState.days}日目の朝を迎えました。`);
            }
            break;
    }
    
    updateUI();
}

/**
 * Placeholder for game selection
 * @param {string} gameId - ID of the selected game
 */
function playGame(gameId) {
    console.log(`Starting game: ${gameId}`);
    
    // Smooth transition effect
    document.body.style.opacity = '0';
    setTimeout(() => {
        window.location.href = `../${gameId}/index.html`;
    }, 500);
}

/**
 * Show a simple toast message
 * @param {string} message 
 */
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'glass-panel toast-message';
    toast.textContent = message;
    
    // Style the toast
    Object.assign(toast.style, {
        position: 'fixed',
        bottom: '100px',
        left: '50%',
        transform: 'translateX(-50%)',
        padding: '10px 30px',
        zIndex: '1000',
        fontSize: '14px',
        color: '#f7d8ef',
        border: '1px solid #d4b5e8',
        boxShadow: '0 0 20px rgba(212, 181, 232, 0.4)',
        animation: 'fadeInOut 3s forwards'
    });

    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// Add fadeInOut animation keyframes dynamically
const style = document.createElement('style');
style.innerHTML = `
@keyframes fadeInOut {
    0% { opacity: 0; transform: translate(-50%, 20px); }
    15% { opacity: 1; transform: translate(-50%, 0); }
    85% { opacity: 1; transform: translate(-50%, 0); }
    100% { opacity: 0; transform: translate(-50%, -20px); }
}
`;
document.head.appendChild(style);

// Navigation item interaction
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
        document.querySelector('.nav-item.active').classList.remove('active');
        item.classList.add('active');
        showToast(`${item.querySelector('.nav-label').textContent}メニューを開きました。`);
    });
});

// Initial UI sync
window.onload = updateUI;
