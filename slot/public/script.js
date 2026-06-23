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

const SAVE_KEY = "smallHouseSlotData";
const SAVE_VERSION = 2;
const AUTO_BET_AMOUNT = 3;
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
    reel1:["seven","grape","bell","cherry","bar","rabbit","grape","bell","grape","bell"],
    reel2:["grape","seven","cherry","bell","rabbit","bar","grape","bell","grape","rabbit"],
    reel3:["bell","grape","seven","bar","rabbit","cherry","grape","bell","grape","rabbit"]
};

const VISIBLE_SYMBOL_COUNT = 3;
const TRACK_BUFFER_SYMBOLS = 4;
const SYMBOL_HEIGHT_PERCENT = 100 / VISIBLE_SYMBOL_COUNT;
const REEL_SPEED = 0.014;
const REEL_SNAP_DURATION = 120;
const MAX_SLIP_SYMBOLS = 9;

const outcomeLottery = [
    {result:"big", weight:12},
    {result:"reg", weight:8},
    {result:"bell", weight:85},
    {result:"grape", weight:145},
    {result:"cherry", weight:35},
    {result:"rabbit", weight:25},
    {result:"lose", weight:690}
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
        reelPositions:{...reelPositions}
    };

    localStorage.setItem(SAVE_KEY,JSON.stringify(data));

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

        renga = getNumber(data.renga,DEFAULT_GAME_DATA.renga);
        gameCount = getNumber(data.gameCount,DEFAULT_GAME_DATA.gameCount);
        bigTotal = getNumber(data.bigTotal,DEFAULT_GAME_DATA.bigTotal);
        regTotal = getNumber(data.regTotal,DEFAULT_GAME_DATA.regTotal);
        grapeTotal = getNumber(data.grapeTotal,DEFAULT_GAME_DATA.grapeTotal);
        retryMode = getBoolean(data.retryMode,DEFAULT_GAME_DATA.retryMode);
        pendingBonus = getBonusType(data.pendingBonus);
        bonusMode = getBonusType(data.bonusMode);
        bonusRemainingPayout = getNumber(data.bonusRemainingPayout,DEFAULT_GAME_DATA.bonusRemainingPayout);
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

function updateRenga(){

    rengaText.textContent = renga + " renga";
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

function setupStarRain(){

    if(!starRain || starRain.children.length > 0){
        return;
    }

    for(let i=0;i<72;i++){

        const star = document.createElement("span");
        star.className = "fallingStar";
        star.style.left = (8 + Math.random() * 86) + "%";
        star.style.animationDelay = (-Math.random() * 8).toFixed(2) + "s";
        star.style.animationDuration = (3.2 + Math.random() * 4.8).toFixed(2) + "s";
        star.style.opacity = (0.38 + Math.random() * 0.6).toFixed(2);

        const size = (0.18 + Math.random() * 0.58).toFixed(2) + "vw";
        star.style.width = size;
        star.style.height = size;

        starRain.appendChild(star);

    }

}

function triggerPekari(){

    const game = document.getElementById("game");
    const pekariText = document.getElementById("pekariText");

    game.classList.add("pekariGlow");
    game.classList.remove("bonusGlow");
    pekariText.classList.add("on");
    pekariText.textContent = "CHANCE";

}

function clearGameEffects(){

    const game = document.getElementById("game");
    const pekariText = document.getElementById("pekariText");

    game.classList.remove("pekariGlow");
    game.classList.remove("bonusGlow");
    pekariText.classList.remove("on");

}

function clearPekari(){

    const game = document.getElementById("game");
    const pekariText = document.getElementById("pekariText");

    game.classList.remove("pekariGlow");
    pekariText.classList.remove("on");

}

function triggerBonusEffects(){

    const game = document.getElementById("game");
    const pekariText = document.getElementById("pekariText");

    setupStarRain();
    game.classList.add("bonusGlow");
    game.classList.remove("pekariGlow");
    pekariText.classList.remove("on");

}

function clearBonusEffects(){

    const game = document.getElementById("game");

    game.classList.remove("bonusGlow");

    if(pendingBonus){
        triggerPekari();
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

    const choices = [];
    const usedPositions = new Set();
    const firstAdvance = Math.ceil(startOffset);
    const lastAdvance = firstAdvance + MAX_SLIP_SYMBOLS;

    for(let advance=firstAdvance;advance<=lastAdvance;advance++){

        const finalPosition = normalizeReelPosition(startPosition + advance,reelId);

        if(usedPositions.has(finalPosition)){
            continue;
        }

        usedPositions.add(finalPosition);
        choices.push({
            finalPosition:finalPosition,
            targetOffset:advance
        });

    }

    return choices;

}

function chooseStopChoice(reelId,choices){

    const reelIds = getReelIds();
    const remainingReelIds = reelIds.filter((id) => id !== reelId && !reelStopped[id]);
    const outcome = currentOutcome || "lose";
    let bestFallback = choices[0];
    let bestFallbackScore = Infinity;

    if(pendingBonus && !bonusMode){
        return choices[0];
    }

    for(const choice of choices){

        const positions = {...reelPositions};
        positions[reelId] = choice.finalPosition;

        if(canCompleteOutcome(positions,remainingReelIds,outcome)){
            return choice;
        }

        if(remainingReelIds.length === 0){
            const score = getStopChoiceScore(positions,outcome);

            if(score < bestFallbackScore){
                bestFallback = choice;
                bestFallbackScore = score;
            }
        }

    }

    if(remainingReelIds.length === 0){
        return bestFallback;
    }

    for(const choice of choices){

        const positions = {...reelPositions};
        positions[reelId] = choice.finalPosition;

        if(canCompleteOutcome(positions,remainingReelIds,"lose")){
            return choice;
        }

    }

    return bestFallback;

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
    const symbolDistance = Math.max(targetOffset - startOffset,0);
    const stopDuration = Math.max(
        REEL_SNAP_DURATION,
        symbolDistance / REEL_SPEED
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

    if(left === center && center === right && left !== "cherry"){
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

    if(stopCount === 1){

        stopReel("reel1");

    }else if(stopCount === 2){

        stopReel("reel2");

    }else if(stopCount === 3){

        const stopDelay = stopReel("reel3");

        setTimeout(() => {

            isSpinning = false;
            stopCount = 0;

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
    reelPositions = {...DEFAULT_GAME_DATA.reelPositions};

    autoMode = false;
    clearTimeout(autoTimer);

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

restoreSavedEffects();
showReel("reel1");
showReel("reel2");
showReel("reel3");
updateRenga();
updateMission();
updateMachineMeters();
updateStartScreenStats();

function setButton(button,name,action){

    button.addEventListener("click",() => {

        pressButton(button);

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

document.addEventListener("keydown",(e)=>{

    if(isStartScreenOpen){

        if(e.code === "Enter" || e.code === "Space"){
            e.preventDefault();
            openGameBtn.click();
        }

        return;

    }

    if(e.key==="1") bet1.click();
    if(e.key==="2") bet2.click();
    if(e.key==="3") bet3.click();
    if(e.key==="m" || e.key==="M") maxBet.click();

    if(e.code==="Space"){
        e.preventDefault();
        startBtn.click();
    }

    if(e.key==="a" || e.key==="A") autoBtn.click();

});
