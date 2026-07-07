function pressButton(button){

    button.classList.add("pressed");

    setTimeout(() => {
        button.classList.remove("pressed");
    },150);

}

const bet1 = document.getElementById("bet1");
const bet2 = document.getElementById("bet2");
const bet3 = document.getElementById("bet3");
const maxBet = document.getElementById("maxBet");
const startBtn = document.getElementById("startBtn");
const autoBtn = document.getElementById("autoBtn");
const missionBtn = document.getElementById("missionBtn");
const settingBtn = document.getElementById("settingBtn");
const gameMenuButton = document.getElementById("gameMenuButton");
const gameMenuOverlay = document.getElementById("gameMenuOverlay");
const gamePopupOverlay = document.getElementById("gamePopupOverlay");
const gameMenuMain = document.getElementById("gameMenuMain");
const gameRulesPanel = document.getElementById("gameRulesPanel");
const gamePayoutPanel = document.getElementById("gamePayoutPanel");
const menuRulesBtn = document.getElementById("menuRulesBtn");
const menuHomeBtn = document.getElementById("menuHomeBtn");
const menuPayoutBtn = document.getElementById("menuPayoutBtn");
const menuCloseBtn = document.getElementById("menuCloseBtn");
const rulesCloseBtn = document.getElementById("rulesCloseBtn");
const payoutCloseBtn = document.getElementById("payoutCloseBtn");
const payoutOpenButton = document.getElementById("payoutOpenButton");
const menuBgmVolume = document.getElementById("menuBgmVolume");
const menuBgmVolumeValue = document.getElementById("menuBgmVolumeValue");
const menuSeVolume = document.getElementById("menuSeVolume");
const menuSeVolumeValue = document.getElementById("menuSeVolumeValue");
const startScreen = document.getElementById("startScreen");
const openGameBtn = document.getElementById("openGameBtn");
const autoStartBtn = document.getElementById("autoStartBtn");
const startResetBtn = document.getElementById("startResetBtn");
const startRengaText = document.getElementById("startRengaText");
const startGameCountText = document.getElementById("startGameCountText");
const startBonusCountText = document.getElementById("startBonusCountText");

const rengaText = document.getElementById("rengaText");
const creditMeter = document.getElementById("creditMeter");
const countMeter = document.getElementById("countMeter");
const payoutMeter = document.getElementById("payoutMeter");
const missionArea = document.getElementById("missionArea");
const starRain = document.getElementById("starRain");
const slotGaugeHunger = document.getElementById("slotGaugeHunger");
const slotGaugeStrenn = document.getElementById("slotGaugeStrenn");
const slotStatCoins = document.getElementById("slotStatCoins");
const slotStatDebt = document.getElementById("slotStatDebt");
const slotStatRemaining = document.getElementById("slotStatRemaining");
const slotStatDays = document.getElementById("slotStatDays");
const slotClockProgress = document.getElementById("slotClockProgress");

const SAVE_KEY = "smallHouseSlotData";
const HOME_SAVE_KEY = "small_house_game_state";
const BGM_ENABLED_KEY = "smallHouseSlotBgmEnabled";
const BGM_VOLUME_KEY = "smallHouseSlotBgmVolume";
const SE_VOLUME_KEY = "smallHouseSlotSeVolume";
const SAVE_VERSION = 2;
const AUTO_BET_AMOUNT = 3;
const CLOCK_CIRCUMFERENCE = 283;
const HOME_DAY_DURATION_SEC = 20 * 60;
const HOME_INITIAL_STATE = {
    coins:1000,
    debt:100000000,
    remainingDebt:100000000,
    hunger:100,
    stress:20,
    alcohol:45,
    cigarette:10,
    days:1,
    inventory:[],
    thirst:90,
    sleep:0,
    health:100,
    fatigue:10,
    motivation:70,
    energy:100,
    condition:100,
    clockSeconds:0
};
const DEFAULT_GAME_DATA = {
    renga:1000,
    gameCount:0,
    bigTotal:0,
    regTotal:0,
    grapeTotal:0,
    retryMode:false,
    pendingBonus:null,
    bonusMode:null,
    bonusRemainingPayout:0,
    statusHud:{
        hunger:80,
        strenn:20,
        coins:1000,
        debt:50000,
        remaining:49000,
        survivalDays:1,
        dayProgress:0
    },
    reelPositions:{
        reel1:0,
        reel2:0,
        reel3:0
    }
};

const symbolImages = {
    seven:"../image/seven.png",
    bar:"../image/bar.png",
    bell:"../image/bell.png",
    grape:"../image/grape.png",
    cherry:"../image/cherry.png",
    rabbit:"../image/rabbit.png"
};

const reelStrips = {
    reel1:["seven","grape","bar","bell","seven","cherry","rabbit","grape","seven","bell","bar","rabbit","grape","seven"],
    reel2:["bar","seven","grape","cherry","seven","bell","rabbit","grape","bar","seven","cherry","grape","rabbit","bell"],
    reel3:["bell","grape","seven","bar","rabbit","cherry","grape","seven","bell","rabbit","bar","grape","cherry","seven"]
};

const VISIBLE_SYMBOL_COUNT = 3;
const TRACK_BUFFER_SYMBOLS = 4;
const SYMBOL_HEIGHT_PERCENT = 100 / VISIBLE_SYMBOL_COUNT;
const REEL_SPEED = 0.014;
const REEL_SNAP_DURATION = 120;

const outcomeLottery = [
    {result:"big", weight:7},
    {result:"reg", weight:5},
    {result:"bell", weight:25},
    {result:"grape", weight:50},
    {result:"cherry", weight:15},
    {result:"rabbit", weight:10},
    {result:"lose", weight:888}
];

const payouts = {
    big:340,
    reg:120,
    bell:15,
    grape:10,
    cherry:2,
    rabbit:0
};

let renga = 1000;
let currentBet = 0;
let retryMode = false;
let pendingBonus = null;
let currentOutcome = "lose";
let bonusMode = null;
let bonusRemainingPayout = 0;

let gameCount = 0;
let bigTotal = 0;
let regTotal = 0;
let grapeTotal = 0;
let lastPayout = 0;
let statusHud = {...DEFAULT_GAME_DATA.statusHud};

let autoMode = false;
let autoTimer = null;

let reelPositions = {
    reel1:0,
    reel2:0,
    reel3:0
};

let reelTimers = {
    reel1:null,
    reel2:null,
    reel3:null
};

let reelAnimations = {
    reel1:{offset:0,lastTime:0,snapTimer:null},
    reel2:{offset:0,lastTime:0,snapTimer:null},
    reel3:{offset:0,lastTime:0,snapTimer:null}
};

let reelStopped = {
    reel1:false,
    reel2:false,
    reel3:false
};

let isSpinning = false;
let stopCount = 0;
let isStartScreenOpen = true;
let isGameMenuOpen = false;

function loadHomeGameState(){

    const savedData = localStorage.getItem(HOME_SAVE_KEY);

    if(!savedData){
        return {...HOME_INITIAL_STATE};
    }

    try{

        const parsedData = JSON.parse(savedData);

        return {
            ...HOME_INITIAL_STATE,
            ...parsedData
        };

    }catch(error){

        return {...HOME_INITIAL_STATE};

    }

}

function syncSlotFromHomeGameState(){

    const homeGameState = loadHomeGameState();

    renga = getNumber(homeGameState.coins,HOME_INITIAL_STATE.coins);
    statusHud = {
        hunger:getNumber(homeGameState.hunger,HOME_INITIAL_STATE.hunger),
        strenn:getNumber(homeGameState.stress,HOME_INITIAL_STATE.stress),
        coins:renga,
        debt:getNumber(homeGameState.debt,HOME_INITIAL_STATE.debt),
        remaining:getNumber(homeGameState.remainingDebt,HOME_INITIAL_STATE.remainingDebt),
        survivalDays:getNumber(homeGameState.days,HOME_INITIAL_STATE.days),
        dayProgress:clampPercent((getNumber(homeGameState.clockSeconds,0) / HOME_DAY_DURATION_SEC) * 100)
    };

}

function saveHomeGameState(){

    const homeGameState = loadHomeGameState();

    homeGameState.coins = renga;
    localStorage.setItem(HOME_SAVE_KEY,JSON.stringify(homeGameState));

}

function saveGameData(){

    const data = {
        version:SAVE_VERSION,
        renga:renga,
        gameCount:gameCount,
        bigTotal:bigTotal,
        regTotal:regTotal,
        grapeTotal:grapeTotal,
        retryMode:retryMode,
        pendingBonus:pendingBonus,
        bonusMode:bonusMode,
        bonusRemainingPayout:bonusRemainingPayout,
        statusHud:{...statusHud},
        reelPositions:{...reelPositions}
    };

    localStorage.setItem(SAVE_KEY,JSON.stringify(data));
    saveHomeGameState();

}

function getNumber(value,defaultValue){

    return Number.isFinite(value) ? value : defaultValue;

}

function getBoolean(value,defaultValue){

    return typeof value === "boolean" ? value : defaultValue;

}

function getBonusType(value){

    return value === "big" || value === "reg" ? value : null;

}

function loadGameData(){

    const savedData = localStorage.getItem(SAVE_KEY);

    if(!savedData){
        return;
    }

    try{

        const data = JSON.parse(savedData);
        const savedReelPositions = data.reelPositions || DEFAULT_GAME_DATA.reelPositions;
        const savedStatusHud = data.statusHud || DEFAULT_GAME_DATA.statusHud;

        renga = getNumber(data.renga,DEFAULT_GAME_DATA.renga);
        gameCount = getNumber(data.gameCount,DEFAULT_GAME_DATA.gameCount);
        bigTotal = getNumber(data.bigTotal,DEFAULT_GAME_DATA.bigTotal);
        regTotal = getNumber(data.regTotal,DEFAULT_GAME_DATA.regTotal);
        grapeTotal = getNumber(data.grapeTotal,DEFAULT_GAME_DATA.grapeTotal);
        retryMode = getBoolean(data.retryMode,DEFAULT_GAME_DATA.retryMode);
        pendingBonus = getBonusType(data.pendingBonus);
        bonusMode = getBonusType(data.bonusMode);
        bonusRemainingPayout = getNumber(data.bonusRemainingPayout,DEFAULT_GAME_DATA.bonusRemainingPayout);
        statusHud = {
            hunger:getNumber(savedStatusHud.hunger,DEFAULT_GAME_DATA.statusHud.hunger),
            strenn:getNumber(savedStatusHud.strenn,DEFAULT_GAME_DATA.statusHud.strenn),
            coins:getNumber(savedStatusHud.coins,renga),
            debt:getNumber(savedStatusHud.debt,DEFAULT_GAME_DATA.statusHud.debt),
            remaining:getNumber(savedStatusHud.remaining,DEFAULT_GAME_DATA.statusHud.remaining),
            survivalDays:getNumber(savedStatusHud.survivalDays,DEFAULT_GAME_DATA.statusHud.survivalDays),
            dayProgress:getNumber(savedStatusHud.dayProgress,DEFAULT_GAME_DATA.statusHud.dayProgress)
        };
        reelPositions = {
            reel1:getNumber(savedReelPositions.reel1,DEFAULT_GAME_DATA.reelPositions.reel1),
            reel2:getNumber(savedReelPositions.reel2,DEFAULT_GAME_DATA.reelPositions.reel2),
            reel3:getNumber(savedReelPositions.reel3,DEFAULT_GAME_DATA.reelPositions.reel3)
        };

        if(bonusMode && bonusRemainingPayout <= 0){
            bonusRemainingPayout = payouts[bonusMode];
        }

        currentOutcome = bonusMode ? "grape" : pendingBonus || "lose";

    }catch(error){

        localStorage.removeItem(SAVE_KEY);

    }

}

function restoreSavedEffects(){

    if(bonusMode){
        triggerBonusEffects();
        return;
    }

    if(pendingBonus){
        triggerPekari();
        return;
    }

    clearGameEffects();

}

function clampPercent(value){

    return Math.max(0,Math.min(100,value));

}

function formatStatusNumber(value){

    return Math.max(0,Math.floor(value)).toLocaleString();

}

function updateSlotStatusHud(nextStatus = {}){

    const shouldSyncCoinsToSlot = Object.prototype.hasOwnProperty.call(nextStatus,"coins");

    statusHud = {
        ...statusHud,
        ...nextStatus
    };

    if(shouldSyncCoinsToSlot){
        renga = getNumber(statusHud.coins,renga);
    }

    statusHud.hunger = clampPercent(getNumber(statusHud.hunger,DEFAULT_GAME_DATA.statusHud.hunger));
    statusHud.strenn = clampPercent(getNumber(statusHud.strenn,DEFAULT_GAME_DATA.statusHud.strenn));
    statusHud.coins = getNumber(statusHud.coins,renga);
    statusHud.debt = getNumber(statusHud.debt,DEFAULT_GAME_DATA.statusHud.debt);
    statusHud.remaining = getNumber(statusHud.remaining,DEFAULT_GAME_DATA.statusHud.remaining);
    statusHud.survivalDays = Math.max(1,Math.floor(getNumber(statusHud.survivalDays,DEFAULT_GAME_DATA.statusHud.survivalDays)));
    statusHud.dayProgress = clampPercent(getNumber(statusHud.dayProgress,DEFAULT_GAME_DATA.statusHud.dayProgress));

    if(slotGaugeHunger){
        slotGaugeHunger.style.width = statusHud.hunger + "%";
    }

    if(slotGaugeStrenn){
        slotGaugeStrenn.style.width = statusHud.strenn + "%";
    }

    if(slotStatCoins){
        slotStatCoins.textContent = formatStatusNumber(statusHud.coins);
    }

    if(slotStatDebt){
        slotStatDebt.textContent = formatStatusNumber(statusHud.debt);
    }

    if(slotStatRemaining){
        slotStatRemaining.textContent = formatStatusNumber(statusHud.remaining);
    }

    if(slotStatDays){
        slotStatDays.textContent = "DAY " + statusHud.survivalDays;
    }

    if(slotClockProgress){
        slotClockProgress.style.strokeDasharray = CLOCK_CIRCUMFERENCE;
        slotClockProgress.style.strokeDashoffset = CLOCK_CIRCUMFERENCE * (1 - statusHud.dayProgress / 100);
    }

}

window.updateSlotStatusHud = updateSlotStatusHud;
document.addEventListener("slot-status-update",(event) => {
    updateSlotStatusHud(event.detail || {});
});

function updateRenga(){

    rengaText.textContent = renga + " renga";
    updateSlotStatusHud({coins:renga});
    updateMachineMeters();

}

function updateMachineMeters(){

    renderSevenSegmentNumber(creditMeter,renga);
    renderSevenSegmentNumber(countMeter,gameCount);
    renderSevenSegmentNumber(payoutMeter,lastPayout);

}

function renderSevenSegmentNumber(container,value){

    const digitSegments = {
        "0":["a","b","c","d","e","f"],
        "1":["b","c"],
        "2":["a","b","g","e","d"],
        "3":["a","b","c","d","g"],
        "4":["f","g","b","c"],
        "5":["a","f","g","c","d"],
        "6":["a","f","e","d","c","g"],
        "7":["a","b","c"],
        "8":["a","b","c","d","e","f","g"],
        "9":["a","b","c","d","f","g"]
    };
    const segmentNames = ["a","b","c","d","e","f","g"];
    const text = String(Math.max(0,Math.floor(value)));

    container.textContent = "";
    container.setAttribute("aria-label",text);

    for(const char of text){

        const digit = document.createElement("span");
        digit.className = "segDigit";

        const activeSegments = digitSegments[char] || [];

        for(const segmentName of segmentNames){

            const segment = document.createElement("span");
            segment.className = activeSegments.includes(segmentName)
                ? "seg seg-" + segmentName + " on"
                : "seg seg-" + segmentName;
            digit.appendChild(segment);

        }

        container.appendChild(digit);

    }

}

function updateStartScreenStats(){

    startRengaText.textContent = renga;
    startGameCountText.textContent = gameCount;
    startBonusCountText.textContent = bigTotal + regTotal;

}

function closeStartScreen(){

    isStartScreenOpen = false;
    startScreen.classList.add("hidden");
    unlockMainBgm();

}

function openStartScreen(){

    isStartScreenOpen = true;
    updateMainBgm();
    closeGameMenu();
    closeGamePopup();
    updateStartScreenStats();
    startScreen.classList.remove("hidden");

}

function returnToHome(){

    stopReelSpinLoop();
    stopPekariAmbience();
    stopBonusAmbience();
    if(mainBgm){
        mainBgm.pause();
    }
    saveGameData();
    window.location.href = "../../home/index.html";

}

function showGameMenuPanel(panel){

    gameRulesPanel.classList.add("hidden");
    gamePayoutPanel.classList.add("hidden");
    panel.classList.remove("hidden");

}

function closeGamePopup(){

    gamePopupOverlay.classList.add("hidden");
    gamePopupOverlay.setAttribute("aria-hidden","true");
    gameRulesPanel.classList.add("hidden");
    gamePayoutPanel.classList.add("hidden");

}

function openGamePopup(panel){

    closeGameMenu();
    gamePopupOverlay.classList.remove("hidden");
    gamePopupOverlay.setAttribute("aria-hidden","false");
    gameRulesPanel.classList.add("hidden");
    gamePayoutPanel.classList.add("hidden");
    panel.classList.remove("hidden");

}

function openGameMenu(){

    if(isStartScreenOpen){
        return;
    }

    isGameMenuOpen = true;
    gameMenuOverlay.classList.add("open");
    gameMenuButton.classList.add("open");
    gameMenuButton.textContent = "<";
    gameMenuButton.setAttribute("aria-label","メニューを閉じる");
    gameMenuOverlay.setAttribute("aria-hidden","false");
    showGameMenuPanel(gameMenuMain);

}

function closeGameMenu(){

    isGameMenuOpen = false;
    gameMenuOverlay.classList.remove("open");
    gameMenuButton.classList.remove("open");
    gameMenuButton.textContent = ">";
    gameMenuButton.setAttribute("aria-label","メニューを開く");
    gameMenuOverlay.setAttribute("aria-hidden","true");
    gameMenuMain.classList.remove("hidden");

}

function getBonusRate(){

    const bonusTotal = bigTotal + regTotal;

    if(bonusTotal === 0){
        return "---";
    }

    return "1/" + (gameCount / bonusTotal).toFixed(1);

}

function getBigRate(){

    if(bigTotal === 0){
        return "---";
    }

    return "1/" + (gameCount / bigTotal).toFixed(1);

}

function getRegRate(){

    if(regTotal === 0){
        return "---";
    }

    return "1/" + (gameCount / regTotal).toFixed(1);

}

function getGrapeRate(){

    if(grapeTotal === 0){
        return "---";
    }

    return "1/" + (gameCount / grapeTotal).toFixed(1);

}

function updateMission(){

    missionArea.innerHTML = "";

}

function showResultText(text){

    const resultText = document.getElementById("resultText");

    resultText.textContent = text;
    resultText.classList.add("show");

    setTimeout(() => {
        resultText.classList.remove("show");
    },2000);

}

let slotAudioContext = null;
let slotAudioMaster = null;
let reelSpinSound = null;
let mainBgm = null;
let canPlayMainBgm = false;
let pekariAmbienceTimer = null;
let bonusAmbienceTimer = null;
let mainBgmVolume = getStoredPercent(BGM_VOLUME_KEY,50);
let seVolume = getStoredPercent(SE_VOLUME_KEY,50);
let isBgmEnabled = localStorage.getItem(BGM_ENABLED_KEY) !== "false" && mainBgmVolume > 0;

if(!isBgmEnabled){
    mainBgmVolume = 0;
}

function getStoredPercent(key,defaultValue){

    const value = Number(localStorage.getItem(key));

    if(Number.isFinite(value)){
        return Math.max(0,Math.min(100,value));
    }

    return defaultValue;

}

function paintVolumeSlider(slider,value){

    if(!slider){
        return;
    }

    slider.style.background = `linear-gradient(90deg, #ff4db3 0 ${value}%, #7614b9 ${value}% 100%)`;

}

function getBgmVolumeScale(){

    return Math.max(0.08,mainBgmVolume / 50);

}

function getMainBgm(){

    if(!mainBgm){

        mainBgm = new Audio("../sounds/メインBGM.mp3");
        mainBgm.loop = true;
        mainBgm.volume = (mainBgmVolume / 100) * 0.72;
        mainBgm.preload = "auto";

    }

    return mainBgm;

}

function shouldPlayMainBgm(){

    return isBgmEnabled && !isStartScreenOpen && !pendingBonus && !bonusMode;

}

function stopPekariAmbience(){

    if(pekariAmbienceTimer){
        clearInterval(pekariAmbienceTimer);
        pekariAmbienceTimer = null;
    }

}

function stopBonusAmbience(){

    if(bonusAmbienceTimer){
        clearInterval(bonusAmbienceTimer);
        bonusAmbienceTimer = null;
    }

}

function playPekariAmbiencePhrase(){

    if(!isBgmEnabled){
        return;
    }

    playTone(659.25,0.28,{type:"triangle",gain:0.025 * getBgmVolumeScale(),release:0.18});
    playTone(987.77,0.34,{type:"sine",gain:0.018 * getBgmVolumeScale(),delay:0.22,release:0.24});

}

function playBonusAmbiencePhrase(){

    if(!isBgmEnabled){
        return;
    }

    [523.25,659.25,783.99,1046.5,783.99,659.25].forEach((frequency,index) => {
        playTone(frequency,0.22,{
            type:"triangle",
            gain:(index === 3 ? 0.038 : 0.03) * getBgmVolumeScale(),
            delay:index * 0.18,
            release:0.16
        });
    });

}

function startPekariAmbience(){

    stopBonusAmbience();

    if(pekariAmbienceTimer || !canPlayMainBgm || !isBgmEnabled){
        return;
    }

    playPekariAmbiencePhrase();
    pekariAmbienceTimer = setInterval(playPekariAmbiencePhrase,3200);

}

function startBonusAmbience(){

    stopPekariAmbience();

    if(bonusAmbienceTimer || !canPlayMainBgm || !isBgmEnabled){
        return;
    }

    playBonusAmbiencePhrase();
    bonusAmbienceTimer = setInterval(playBonusAmbiencePhrase,1500);

}

function updateSpecialAmbience(){

    if(!canPlayMainBgm || !isBgmEnabled || isStartScreenOpen){
        stopPekariAmbience();
        stopBonusAmbience();
        return;
    }

    if(bonusMode){
        startBonusAmbience();
        return;
    }

    if(pendingBonus){
        startPekariAmbience();
        return;
    }

    stopPekariAmbience();
    stopBonusAmbience();

}

function updateMainBgm(){

    updateMenuVolumeControls();

    if(!canPlayMainBgm){
        return;
    }

    const bgm = getMainBgm();
    bgm.volume = (mainBgmVolume / 100) * 0.72;

    if(shouldPlayMainBgm()){
        updateSpecialAmbience();
        bgm.play().catch(() => {});
        return;
    }

    bgm.pause();
    updateSpecialAmbience();

}

function unlockMainBgm(){

    canPlayMainBgm = true;
    updateMainBgm();
    updateSpecialAmbience();

}

function updateMenuVolumeControls(){

    if(menuBgmVolume){
        menuBgmVolume.value = mainBgmVolume;
        paintVolumeSlider(menuBgmVolume,mainBgmVolume);
    }

    if(menuBgmVolumeValue){
        menuBgmVolumeValue.textContent = mainBgmVolume + "%";
    }

    if(menuSeVolume){
        menuSeVolume.value = seVolume;
        paintVolumeSlider(menuSeVolume,seVolume);
    }

    if(menuSeVolumeValue){
        menuSeVolumeValue.textContent = seVolume + "%";
    }

    if(slotAudioMaster){
        slotAudioMaster.gain.value = Math.min(1,(seVolume / 50) * 0.62);
    }

}

function bindMenuVolumeControls(){

    if(menuBgmVolume){
        menuBgmVolume.addEventListener("input",() => {
            mainBgmVolume = Math.max(0,Math.min(100,Number(menuBgmVolume.value) || 0));
            isBgmEnabled = mainBgmVolume > 0;
            localStorage.setItem(BGM_VOLUME_KEY,String(mainBgmVolume));
            localStorage.setItem(BGM_ENABLED_KEY,String(isBgmEnabled));

            if(!isBgmEnabled){
                if(mainBgm){
                    mainBgm.pause();
                }
                stopPekariAmbience();
                stopBonusAmbience();
            }

            updateMainBgm();
            updateSpecialAmbience();
        });
    }

    if(menuSeVolume){
        menuSeVolume.addEventListener("input",() => {
            seVolume = Math.max(0,Math.min(100,Number(menuSeVolume.value) || 0));
            localStorage.setItem(SE_VOLUME_KEY,String(seVolume));
            updateMenuVolumeControls();
        });
    }

}

function getSlotAudioContext(){

    if(!slotAudioContext){

        const AudioContextClass = window.AudioContext || window.webkitAudioContext;

        if(!AudioContextClass){
            return null;
        }

        slotAudioContext = new AudioContextClass();
        slotAudioMaster = slotAudioContext.createGain();
        slotAudioMaster.gain.value = Math.min(1,(seVolume / 50) * 0.62);
        slotAudioMaster.connect(slotAudioContext.destination);

    }

    if(slotAudioContext.state === "suspended"){
        slotAudioContext.resume();
    }

    return slotAudioContext;

}

function playTone(frequency,duration,options = {}){

    const audioContext = getSlotAudioContext();

    if(!audioContext || !slotAudioMaster){
        return;
    }

    const startTime = audioContext.currentTime + (options.delay || 0);
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = options.type || "sine";
    oscillator.frequency.setValueAtTime(frequency,startTime);

    if(options.frequencyEnd){
        oscillator.frequency.exponentialRampToValueAtTime(Math.max(1,options.frequencyEnd),startTime + duration);
    }

    if(options.detune){
        oscillator.detune.setValueAtTime(options.detune,startTime);
    }

    const peak = options.gain || 0.12;
    const attack = options.attack || 0.01;
    const releaseStart = Math.max(attack,startTime + duration - (options.release || 0.08));

    gain.gain.setValueAtTime(0,startTime);
    gain.gain.linearRampToValueAtTime(peak,startTime + attack);
    gain.gain.setValueAtTime(peak,releaseStart);
    gain.gain.exponentialRampToValueAtTime(0.0001,startTime + duration);

    oscillator.connect(gain);
    gain.connect(slotAudioMaster);
    oscillator.start(startTime);
    oscillator.stop(startTime + duration + 0.03);

}

function playNoiseBurst(duration,options = {}){

    const audioContext = getSlotAudioContext();

    if(!audioContext || !slotAudioMaster){
        return;
    }

    const sampleRate = audioContext.sampleRate;
    const buffer = audioContext.createBuffer(1,Math.max(1,Math.floor(sampleRate * duration)),sampleRate);
    const data = buffer.getChannelData(0);

    for(let i=0;i<data.length;i++){
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length,options.decay || 1.2);
    }

    const startTime = audioContext.currentTime + (options.delay || 0);
    const source = audioContext.createBufferSource();
    const filter = audioContext.createBiquadFilter();
    const gain = audioContext.createGain();

    source.buffer = buffer;
    filter.type = options.filterType || "bandpass";
    filter.frequency.setValueAtTime(options.frequency || 1400,startTime);
    filter.Q.value = options.q || 2;

    gain.gain.setValueAtTime(options.gain || 0.08,startTime);
    gain.gain.exponentialRampToValueAtTime(0.0001,startTime + duration);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(slotAudioMaster);
    source.start(startTime);
    source.stop(startTime + duration + 0.03);

}

function playMagicSparkle(baseFrequency = 880,delay = 0){

    [0,4,7,12].forEach((step,index) => {
        playTone(baseFrequency * Math.pow(2,step / 12),0.18,{
            type:"triangle",
            gain:0.07,
            delay:delay + index * 0.045,
            attack:0.006,
            release:0.12
        });
    });

    playNoiseBurst(0.22,{
        delay:delay + 0.02,
        gain:0.035,
        frequency:4200,
        q:6,
        decay:2
    });

}

function playUiClickSound(){

    playTone(880,0.055,{type:"triangle",gain:0.035,frequencyEnd:1320,release:0.04});

}

function playBetSound(){

    playTone(520,0.08,{type:"square",gain:0.055,frequencyEnd:700,release:0.05});
    playTone(1040,0.12,{type:"triangle",gain:0.035,delay:0.035,release:0.08});

}

function playSpinStartSound(){

    playNoiseBurst(0.28,{gain:0.09,frequency:720,q:1.2,filterType:"lowpass",decay:0.75});
    playTone(92,0.32,{type:"sawtooth",gain:0.07,frequencyEnd:150,release:0.14});
    playMagicSparkle(660,0.08);

}

function startReelSpinLoop(){

    const audioContext = getSlotAudioContext();

    if(!audioContext || !slotAudioMaster || reelSpinSound){
        return;
    }

    const hum = audioContext.createOscillator();
    const shimmer = audioContext.createOscillator();
    const filter = audioContext.createBiquadFilter();
    const gain = audioContext.createGain();
    const startTime = audioContext.currentTime;

    hum.type = "sawtooth";
    hum.frequency.setValueAtTime(72,startTime);

    shimmer.type = "triangle";
    shimmer.frequency.setValueAtTime(185,startTime);
    shimmer.detune.setValueAtTime(6,startTime);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(620,startTime);
    filter.Q.value = 1.8;

    gain.gain.setValueAtTime(0,startTime);
    gain.gain.linearRampToValueAtTime(0.045,startTime + 0.15);

    hum.connect(filter);
    shimmer.connect(filter);
    filter.connect(gain);
    gain.connect(slotAudioMaster);

    hum.start(startTime);
    shimmer.start(startTime);

    reelSpinSound = {hum,shimmer,gain};

}

function stopReelSpinLoop(){

    if(!reelSpinSound || !slotAudioContext){
        return;
    }

    const stopTime = slotAudioContext.currentTime + 0.12;

    reelSpinSound.gain.gain.cancelScheduledValues(slotAudioContext.currentTime);
    reelSpinSound.gain.gain.setValueAtTime(reelSpinSound.gain.gain.value,slotAudioContext.currentTime);
    reelSpinSound.gain.gain.exponentialRampToValueAtTime(0.0001,stopTime);
    reelSpinSound.hum.stop(stopTime + 0.03);
    reelSpinSound.shimmer.stop(stopTime + 0.03);
    reelSpinSound = null;

}

function playReelStopSound(stopIndex){

    const base = [420,520,640][Math.min(stopIndex - 1,2)] || 420;

    playNoiseBurst(0.08,{gain:0.07,frequency:1800 + stopIndex * 400,q:4,decay:1.8});
    playTone(base,0.09,{type:"square",gain:0.06,frequencyEnd:base * 0.72,release:0.05});
    playTone(base * 2,0.08,{type:"triangle",gain:0.035,delay:0.035,release:0.05});

}

function playPekariSound(){

    playNoiseBurst(0.18,{gain:0.06,frequency:5200,q:7,decay:2.4});
    playMagicSparkle(880,0);
    playTone(1760,0.24,{type:"sine",gain:0.08,delay:0.12,release:0.18});

}

function playWinSound(result){

    if(result === "lose"){
        playTone(180,0.18,{type:"triangle",gain:0.04,frequencyEnd:120,release:0.12});
        return;
    }

    if(result === "rabbit"){
        playTone(720,0.12,{type:"triangle",gain:0.06,frequencyEnd:980,release:0.08});
        playTone(980,0.16,{type:"triangle",gain:0.06,delay:0.08,frequencyEnd:1280,release:0.1});
        return;
    }

    playMagicSparkle(result === "cherry" ? 740 : 820,0);
    playTone(1320,0.22,{type:"triangle",gain:0.07,delay:0.18,release:0.14});

}

function playBonusSound(){

    playNoiseBurst(0.42,{gain:0.13,frequency:900,q:1.2,filterType:"lowpass",decay:0.55});
    playTone(110,0.42,{type:"sawtooth",gain:0.11,frequencyEnd:220,release:0.2});

    [523.25,659.25,783.99,1046.5,1318.5,1568].forEach((frequency,index) => {
        playTone(frequency,0.28,{
            type:index % 2 === 0 ? "triangle" : "sine",
            gain:0.075,
            delay:0.12 + index * 0.085,
            release:0.18
        });
    });

    playNoiseBurst(0.7,{delay:0.32,gain:0.075,frequency:5200,q:4,decay:1.8});

}

function setupStarRain(){

    if(!starRain || starRain.children.length > 0){
        return;
    }

    for(let i=0;i<120;i++){

        const star = document.createElement("span");
        star.className = "fallingStar";
        star.style.left = (8 + Math.random() * 86) + "%";
        star.style.animationDelay = (-Math.random() * 8).toFixed(2) + "s";
        star.style.animationDuration = (2.2 + Math.random() * 4.2).toFixed(2) + "s";
        star.style.opacity = (0.38 + Math.random() * 0.6).toFixed(2);

        const size = (0.2 + Math.random() * 0.72).toFixed(2) + "vw";
        star.style.width = size;
        star.style.height = size;

        starRain.appendChild(star);

    }

}

function triggerPekari(){

    const game = document.getElementById("game");
    const pekariText = document.getElementById("pekariText");
    const wasPekari = game.classList.contains("pekariGlow");

    game.classList.add("pekariGlow");
    game.classList.remove("bonusGlow");
    pekariText.classList.add("on");
    pekariText.textContent = "CHANCE";
    updateMainBgm();

    if(!wasPekari){
        playPekariSound();
    }

}

function clearGameEffects(){

    const game = document.getElementById("game");
    const pekariText = document.getElementById("pekariText");

    game.classList.remove("pekariGlow");
    game.classList.remove("bonusGlow");
    pekariText.classList.remove("on");
    updateMainBgm();

}

function clearPekari(){

    const game = document.getElementById("game");
    const pekariText = document.getElementById("pekariText");

    game.classList.remove("pekariGlow");
    pekariText.classList.remove("on");
    updateMainBgm();

}

function triggerBonusEffects(){

    const game = document.getElementById("game");
    const pekariText = document.getElementById("pekariText");

    setupStarRain();
    game.classList.add("bonusGlow");
    game.classList.remove("pekariGlow");
    pekariText.classList.remove("on");
    updateMainBgm();
    showResultText("BONUS FEVER!");

}

function clearBonusEffects(){

    const game = document.getElementById("game");

    game.classList.remove("bonusGlow");

    if(pendingBonus){
        triggerPekari();
    }else{
        updateMainBgm();
    }

}

function setBet(amount){

    if(isSpinning){
        return;
    }

    if(bonusMode){
        showResultText("BONUS中");
        return;
    }

    if(retryMode){
        showResultText("リトライ中");
        return;
    }

    if(renga < amount){
        showResultText("レンガ不足");
        return;
    }

    currentBet = amount;
    playBetSound();
    showResultText(amount + " BET");

}

function normalizeReelPosition(position,reelId){

    const strip = reelStrips[reelId];

    return ((position % strip.length) + strip.length) % strip.length;

}

function createSymbol(symbolName){

    const div = document.createElement("div");
    div.className = "symbol";

    const img = document.createElement("img");
    img.src = symbolImages[symbolName];

    div.appendChild(img);

    return div;

}

function setReelOffset(reelId,offset){

    const reel = document.getElementById(reelId);
    const track = reel.querySelector(".reelTrack");

    if(!track){
        return;
    }

    track.style.transform = `translateY(${-offset * SYMBOL_HEIGHT_PERCENT}%)`;

}

function renderReelTrack(reelId,startPosition,symbolCount){

    const reel = document.getElementById(reelId);
    const strip = reelStrips[reelId];
    const pos = normalizeReelPosition(startPosition,reelId);

    reel.innerHTML = "";

    const track = document.createElement("div");
    track.className = "reelTrack";

    for(let i=0;i<symbolCount;i++){

        const symbolName = strip[(pos + i) % strip.length];
        track.appendChild(createSymbol(symbolName));

    }

    reel.appendChild(track);
    setReelOffset(reelId,0);

}

function getReelIds(){

    return ["reel1","reel2","reel3"];

}

function getVisibleSymbolsAt(reelId,position){

    const strip = reelStrips[reelId];
    const pos = normalizeReelPosition(position,reelId);

    return [
        strip[pos % strip.length],
        strip[(pos + 1) % strip.length],
        strip[(pos + 2) % strip.length]
    ];

}

function getLinesFromPositions(positions){

    const left = getVisibleSymbolsAt("reel1",positions.reel1);
    const center = getVisibleSymbolsAt("reel2",positions.reel2);
    const right = getVisibleSymbolsAt("reel3",positions.reel3);

    return [
        [left[0], center[0], right[0]],
        [left[1], center[1], right[1]],
        [left[2], center[2], right[2]],
        [left[0], center[1], right[2]],
        [left[2], center[1], right[0]]
    ];

}

function getLineResultsFromPositions(positions){

    return getLinesFromPositions(positions).map((line) => judgeLine(line));

}

function hasBonusLine(positions){

    const lineResults = getLineResultsFromPositions(positions);

    return lineResults.includes("big") || lineResults.includes("reg");

}

function hasOutcomeLine(positions,outcome){

    return getLineResultsFromPositions(positions).includes(outcome);

}

function hasThreeCherryLine(positions){

    return getLinesFromPositions(positions)
        .some((line) => line[0] === "cherry" && line[1] === "cherry" && line[2] === "cherry");

}

function getWinningResults(positions){

    return getLineResultsFromPositions(positions)
        .filter((result) => result !== "lose");

}

function isFinalStateValid(positions,outcome){

    if(hasThreeCherryLine(positions)){
        return false;
    }

    const winningResults = getWinningResults(positions);

    if(outcome === "lose"){
        return winningResults.length === 0;
    }

    return winningResults.length === 1 && winningResults[0] === outcome;

}

function getStopChoiceScore(positions,outcome){

    const winningResults = getWinningResults(positions);

    if(hasThreeCherryLine(positions)){
        return 40 + winningResults.length;
    }

    if(isFinalStateValid(positions,outcome)){
        return 0;
    }

    if(winningResults.length === 0){
        return 1;
    }

    if(winningResults.length === 1 && winningResults[0] === outcome){
        return 2;
    }

    if(!hasBonusLine(positions)){
        return 3 + winningResults.length;
    }

    return 20 + winningResults.length;

}

function canCompleteOutcome(partialPositions,remainingReelIds,outcome,index = 0){

    if(index >= remainingReelIds.length){
        return isFinalStateValid(partialPositions,outcome);
    }

    const reelId = remainingReelIds[index];
    const strip = reelStrips[reelId];

    for(let position=0;position<strip.length;position++){

        partialPositions[reelId] = position;

        if(canCompleteOutcome(partialPositions,remainingReelIds,outcome,index + 1)){
            return true;
        }

    }

    return false;

}

function getStopChoices(reelId,startPosition,startOffset){

    const nearestAdvance = startOffset >= 0.5 ? 1 : 0;
    const stripLength = reelStrips[reelId].length;
    const choices = [];
    const usedPositions = new Set();

    for(let extra=0;extra<stripLength;extra++){

        const targetOffset = nearestAdvance + extra;
        const finalPosition = normalizeReelPosition(startPosition + targetOffset,reelId);

        if(usedPositions.has(finalPosition)){
            continue;
        }

        usedPositions.add(finalPosition);
        choices.push({
            finalPosition:finalPosition,
            targetOffset:targetOffset
        });

    }

    return choices;

}

function chooseStopChoice(reelId,choices){

    const reelIds = getReelIds();
    const remainingReelIds = reelIds.filter((id) => id !== reelId && !reelStopped[id]);
    const canShowBonusLine = pendingBonus || bonusMode;

    if(bonusMode){

        for(const choice of choices){

            const positions = {...reelPositions};
            positions[reelId] = choice.finalPosition;

            if(canCompleteOutcome(positions,remainingReelIds,"grape")){
                return choice;
            }

        }

        return choices[0];

    }

    if(canShowBonusLine || remainingReelIds.length > 0){
        return choices[0];
    }

    for(const choice of choices){

        const positions = {...reelPositions};
        positions[reelId] = choice.finalPosition;

        if(!hasBonusLine(positions)){
            return choice;
        }

    }

    return choices[0];

}

function showReel(reelId){

    renderReelTrack(reelId,reelPositions[reelId],VISIBLE_SYMBOL_COUNT);

}

function spinReel(reelId){

    const animation = reelAnimations[reelId];

    if(reelTimers[reelId]){
        cancelAnimationFrame(reelTimers[reelId]);
    }

    if(animation.snapTimer){
        cancelAnimationFrame(animation.snapTimer);
        animation.snapTimer = null;
    }

    animation.offset = 0;
    animation.lastTime = 0;

    renderReelTrack(
        reelId,
        reelPositions[reelId],
        reelStrips[reelId].length + VISIBLE_SYMBOL_COUNT + TRACK_BUFFER_SYMBOLS
    );

    const animate = (time) => {

        if(reelStopped[reelId]){
            reelTimers[reelId] = null;
            return;
        }

        if(animation.lastTime === 0){
            animation.lastTime = time;
        }

        const elapsed = Math.min(time - animation.lastTime,64);
        animation.lastTime = time;
        animation.offset += elapsed * REEL_SPEED;

        while(animation.offset >= 1){

            animation.offset--;
            reelPositions[reelId] = normalizeReelPosition(reelPositions[reelId] + 1,reelId);

            renderReelTrack(
                reelId,
                reelPositions[reelId],
                reelStrips[reelId].length + VISIBLE_SYMBOL_COUNT + TRACK_BUFFER_SYMBOLS
            );

        }

        setReelOffset(reelId,animation.offset);

        reelTimers[reelId] = requestAnimationFrame(animate);

    };

    reelTimers[reelId] = requestAnimationFrame(animate);

}

function snapReelToSymbol(reelId,startPosition,startOffset,targetOffset,finalPosition,duration = REEL_SNAP_DURATION){

    const animation = reelAnimations[reelId];
    const startTime = performance.now();

    renderReelTrack(
        reelId,
        startPosition,
        reelStrips[reelId].length + VISIBLE_SYMBOL_COUNT + TRACK_BUFFER_SYMBOLS
    );

    const animateSnap = (time) => {

        const progress = Math.min((time - startTime) / duration,1);
        const easedProgress = 1 - Math.pow(1 - progress,3);
        const offset = startOffset + (targetOffset - startOffset) * easedProgress;

        setReelOffset(reelId,offset);

        if(progress < 1){

            animation.snapTimer = requestAnimationFrame(animateSnap);
            return;

        }

        animation.offset = 0;
        animation.snapTimer = null;
        reelPositions[reelId] = finalPosition;
        showReel(reelId);

    };

    animation.snapTimer = requestAnimationFrame(animateSnap);

}

function stopReel(reelId){

    if(reelStopped[reelId]){
        return 0;
    }

    const animation = reelAnimations[reelId];
    const startPosition = reelPositions[reelId];
    const startOffset = animation.offset;
    const stopChoice = chooseStopChoice(
        reelId,
        getStopChoices(reelId,startPosition,startOffset)
    );
    const targetOffset = stopChoice.targetOffset;
    const finalPosition = stopChoice.finalPosition;
    const symbolDistance = Math.abs(targetOffset - startOffset);
    const stopDuration = Math.min(
        480,
        Math.max(REEL_SNAP_DURATION,symbolDistance / REEL_SPEED)
    );

    if(reelTimers[reelId]){
        cancelAnimationFrame(reelTimers[reelId]);
        reelTimers[reelId] = null;
    }

    reelStopped[reelId] = true;
    reelPositions[reelId] = finalPosition;

    snapReelToSymbol(reelId,startPosition,startOffset,targetOffset,finalPosition,stopDuration);

    return stopDuration;

}

function getVisibleSymbols(reelId){

    const strip = reelStrips[reelId];
    const pos = reelPositions[reelId];

    return [
        strip[pos % strip.length],
        strip[(pos + 1) % strip.length],
        strip[(pos + 2) % strip.length]
    ];

}

function getAllLines(){

    const left = getVisibleSymbols("reel1");
    const center = getVisibleSymbols("reel2");
    const right = getVisibleSymbols("reel3");

    return [
        [left[0], center[0], right[0]],
        [left[1], center[1], right[1]],
        [left[2], center[2], right[2]],
        [left[0], center[1], right[2]],
        [left[2], center[1], right[0]]
    ];

}

function judgeLine(line){

    const left = line[0];
    const center = line[1];
    const right = line[2];

    if(left === "seven" && center === "seven" && right === "seven"){
        return "big";
    }

    if(left === "seven" && center === "seven" && right === "bar"){
        return "reg";
    }

    if(left === "cherry" && center === "cherry" && right !== "cherry"){
        return "cherry";
    }

    if(left === center && center === right && ["bell","grape","rabbit"].includes(left)){
        return left;
    }

    return "lose";

}

function drawInternalOutcome(){

    const totalWeight = outcomeLottery.reduce((total,outcome) => total + outcome.weight,0);
    let randomValue = Math.random() * totalWeight;

    for(const outcome of outcomeLottery){

        randomValue -= outcome.weight;

        if(randomValue < 0){
            return outcome.result;
        }

    }

    return "lose";

}

function findResult(lines,targetResults){

    for(const line of lines){

        const lineResult = judgeLine(line);

        if(targetResults.includes(lineResult)){
            return lineResult;
        }

    }

    return "lose";

}

function startBonusTime(type){

    bonusMode = type;
    bonusRemainingPayout = payouts[type];
    pendingBonus = null;
    currentOutcome = "grape";

    playBonusSound();
    triggerBonusEffects();

}

function finishBonusTime(){

    const finishedBonus = bonusMode;

    bonusMode = null;
    bonusRemainingPayout = 0;
    currentOutcome = "lose";
    pendingBonus = null;

    clearBonusEffects();
    clearPekari();

}

function checkResult(){

    const lines = getAllLines();
    const outcome = currentOutcome || "lose";
    const bonusResult = findResult(lines,["big","reg"]);
    const matchedResult = findResult(lines,[outcome]);
    let result = "lose";

    if(matchedResult === outcome){
        result = outcome;
    }

    let payout = 0;
    let message = "ハズレ";

    if(bonusMode){

        if(result === "grape"){

            payout = Math.min(payouts.grape,bonusRemainingPayout);
            bonusRemainingPayout -= payout;
            message = "BONUS +" + payout + " 残り" + bonusRemainingPayout;

        }else{

            message = "BONUS 継続";

        }

        renga += payout;
        lastPayout = payout;

        if(result === "grape"){
            playWinSound("grape");
        }else{
            playTone(520,0.12,{type:"triangle",gain:0.035,frequencyEnd:640,release:0.08});
        }

        updateRenga();
        updateMission();
        saveGameData();
        currentBet = 0;

        if(bonusRemainingPayout <= 0){
            finishBonusTime();
        }

        if(autoMode){
            autoTimer = setTimeout(() => {
                autoPlay();
            },1400);
        }

        return;

    }

    if(pendingBonus){

        if(bonusResult === "big" || bonusResult === "reg"){

            result = bonusResult;

        }else{

            result = findResult(lines,["bell","grape","cherry","rabbit"]);

        }

    }else{

        result = findResult(lines,["bell","grape","cherry","rabbit"]);

    }

    if(result === "big"){

        message = "BIG 入賞";
        bigTotal++;
        startBonusTime("big");

    }else if(result === "reg"){

        message = "REG 入賞";
        regTotal++;
        startBonusTime("reg");

    }else if(result === "bell"){

        payout = payouts.bell;
        message = "ベル成立 +" + payout;

    }else if(result === "grape"){

        payout = payouts.grape;
        message = "ぶどう成立 +" + payout;
        grapeTotal++;

    }else if(result === "cherry"){

        payout = payouts.cherry;
        message = "チェリー成立 +" + payout;

    }else if(result === "rabbit"){

        payout = payouts.rabbit;
        message = "うさぎリトライ";
        retryMode = true;

    }else{

        retryMode = false;

        if(outcome === "big" || outcome === "reg"){
            message = "ボーナス成立中";
        }

    }

    renga += payout;
    lastPayout = payout;

    if(result !== "big" && result !== "reg"){
        playWinSound(result);
    }

    updateRenga();
    updateMission();
    saveGameData();

    currentBet = 0;
    currentOutcome = bonusMode
        ? "grape"
        : pendingBonus || "lose";

    if(autoMode){
        autoTimer = setTimeout(() => {
            autoPlay();
        },1400);
    }

}

function startSpin(){

    if(isSpinning){
        return;
    }

    if(!bonusMode && !retryMode && currentBet === 0){
        showResultText("BETしてね");
        return;
    }

    if(!bonusMode && !retryMode && renga < currentBet){
        showResultText("レンガ不足");
        return;
    }

    if(bonusMode){

        currentOutcome = "grape";
        triggerBonusEffects();
        showResultText("BONUS");

    }else if(retryMode){

        showResultText("リトライ");

    }else{

        renga -= currentBet;
        updateRenga();

    }

    retryMode = false;
    playSpinStartSound();
    startReelSpinLoop();

    gameCount++;
    lastPayout = 0;

    if(bonusMode){
        currentOutcome = "grape";
    }else if(pendingBonus){
        currentOutcome = "lose";
        triggerPekari();
    }else{
        currentOutcome = drawInternalOutcome();

        if(currentOutcome === "big" || currentOutcome === "reg"){
            pendingBonus = currentOutcome;
            triggerPekari();
        }else{
            clearPekari();
            updateMainBgm();
        }
    }

    updateMission();
    updateMachineMeters();
    saveGameData();

    isSpinning = true;
    stopCount = 0;

    reelStopped.reel1 = false;
    reelStopped.reel2 = false;
    reelStopped.reel3 = false;

    spinReel("reel1");
    spinReel("reel2");
    spinReel("reel3");

}

function stopNextReel(){

    if(!isSpinning){
        return;
    }

    stopCount++;
    playReelStopSound(stopCount);

    if(stopCount === 1){

        stopReel("reel1");

    }else if(stopCount === 2){

        stopReel("reel2");

    }else if(stopCount === 3){

        const stopDelay = stopReel("reel3");

        setTimeout(() => {

            isSpinning = false;
            stopCount = 0;
            stopReelSpinLoop();

            checkResult();

        },stopDelay);

    }

}

function autoPlay(){

    if(!autoMode){
        return;
    }

    if(isSpinning){
        return;
    }

    if(!bonusMode && !retryMode && renga < AUTO_BET_AMOUNT){
        autoMode = false;
        showResultText("AUTO終了");
        return;
    }

    if(!bonusMode && !retryMode){
        currentBet = AUTO_BET_AMOUNT;
    }

    startSpin();

    setTimeout(() => {
        stopNextReel();
    },700);

    setTimeout(() => {
        stopNextReel();
    },1100);

    setTimeout(() => {
        stopNextReel();
    },1500);

}

function toggleAuto(){

    autoMode = !autoMode;

    if(autoMode){

        showResultText("AUTO ON");
        autoPlay();

    }else{

        clearTimeout(autoTimer);
        showResultText("AUTO OFF");

    }

}

function resetGameData(){

    const ok = confirm("レンガ・回転数・BIG・REG・ぶどう確率・ボーナス状態・リール位置をリセットしますか？");

    if(!ok){
        return;
    }

    localStorage.removeItem(SAVE_KEY);

    renga = 1000;
    currentBet = 0;
    retryMode = false;
    pendingBonus = null;
    currentOutcome = "lose";
    bonusMode = null;
    bonusRemainingPayout = 0;
    clearBonusEffects();
    clearPekari();

    gameCount = 0;
    bigTotal = 0;
    regTotal = 0;
    grapeTotal = 0;
    lastPayout = 0;
    statusHud = {...DEFAULT_GAME_DATA.statusHud};
    reelPositions = {...DEFAULT_GAME_DATA.reelPositions};

    autoMode = false;
    clearTimeout(autoTimer);
    stopReelSpinLoop();

    for(const reelId of Object.keys(reelTimers)){

        if(reelTimers[reelId]){
            cancelAnimationFrame(reelTimers[reelId]);
            reelTimers[reelId] = null;
        }

        if(reelAnimations[reelId].snapTimer){
            cancelAnimationFrame(reelAnimations[reelId].snapTimer);
            reelAnimations[reelId].snapTimer = null;
        }

        reelAnimations[reelId].offset = 0;
        reelAnimations[reelId].lastTime = 0;

    }

    isSpinning = false;
    stopCount = 0;

    showReel("reel1");
    showReel("reel2");
    showReel("reel3");
    updateRenga();
    updateMission();
    updateMachineMeters();
    updateStartScreenStats();
    saveGameData();

    showResultText("データリセット");

}

loadGameData();
syncSlotFromHomeGameState();

restoreSavedEffects();
showReel("reel1");
showReel("reel2");
showReel("reel3");
updateRenga();
updateMission();
updateMachineMeters();
updateStartScreenStats();
updateMenuVolumeControls();
bindMenuVolumeControls();

function setButton(button,name,action){

    button.addEventListener("click",() => {

        unlockMainBgm();
        pressButton(button);
        playUiClickSound();

        if(action){
            action();
        }

    });

}

setButton(bet1,"1BET",() => {
    setBet(1);
});

setButton(bet2,"2BET",() => {
    setBet(2);
});

setButton(bet3,"3BET",() => {
    setBet(3);
});

setButton(maxBet,"MAX BET",() => {
    setBet(10);
});

setButton(startBtn,"START / STOP",() => {

    if(!isSpinning){
        startSpin();
    }else{
        stopNextReel();
    }

});

setButton(autoBtn,"AUTO",() => {
    toggleAuto();
});

setButton(missionBtn,"MISSION");

setButton(settingBtn,"SETTING",() => {
    resetGameData();
});

setButton(gameMenuButton,"MENU",() => {
    if(isGameMenuOpen){
        closeGameMenu();
    }else{
        openGameMenu();
    }
});

setButton(menuRulesBtn,"RULES",() => {
    openGamePopup(gameRulesPanel);
});

setButton(menuHomeBtn,"HOME",() => {
    returnToHome();
});

setButton(menuPayoutBtn,"PAYOUT",() => {
    openGamePopup(gamePayoutPanel);
});

setButton(menuCloseBtn,"CLOSE",() => {
    closeGameMenu();
});

setButton(payoutOpenButton,"PAYOUT",() => {
    openGamePopup(gamePayoutPanel);
});

setButton(rulesCloseBtn,"RULES CLOSE",() => {
    closeGamePopup();
});

setButton(payoutCloseBtn,"PAYOUT CLOSE",() => {
    closeGamePopup();
});

setButton(openGameBtn,"START",() => {
    closeStartScreen();
});

setButton(autoStartBtn,"AUTO START",() => {
    closeStartScreen();

    if(!autoMode){
        toggleAuto();
    }

});

setButton(startResetBtn,"RESET DATA",() => {
    resetGameData();
});

function isStartKey(e){

    return e.code === "Space" || e.code === "Enter" || e.key === "Enter";

}

document.addEventListener("keydown",(e)=>{

    if(!gamePopupOverlay.classList.contains("hidden")){

        if(e.code === "Escape"){
            e.preventDefault();
            closeGamePopup();
        }

        return;

    }

    if(isGameMenuOpen){

        if(e.code === "Escape"){
            e.preventDefault();
            closeGameMenu();
        }

        return;

    }

    if(isStartScreenOpen){

        if(isStartKey(e)){
            e.preventDefault();
            openGameBtn.click();
        }

        return;

    }

    if(e.key==="1") bet1.click();
    if(e.key==="2") bet2.click();
    if(e.key==="3") bet3.click();
    if(e.key==="m" || e.key==="M") maxBet.click();

    if(isStartKey(e)){
        e.preventDefault();
        startBtn.click();
    }

    if(e.key==="a" || e.key==="A") autoBtn.click();

},true);
