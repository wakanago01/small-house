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

const rengaText = document.getElementById("rengaText");
const missionArea = document.getElementById("missionArea");

const SAVE_KEY = "smallHouseSlotData";
const AUTO_BET_AMOUNT = 3;

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
    reel3:["bell","grape","seven","rabbit","bar","cherry","grape","bell","grape","rabbit"]
};

const payouts = {
    big:340,
    reg:120,
    bell:15,
    grape:10,
    cherry:1,
    rabbit:0
};

let renga = 1000;
let currentBet = 0;
let retryMode = false;

let gameCount = 0;
let bigTotal = 0;
let regTotal = 0;
let grapeTotal = 0;

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

let reelStopped = {
    reel1:false,
    reel2:false,
    reel3:false
};

let isSpinning = false;
let stopCount = 0;

function saveGameData(){

    const data = {
        renga:renga,
        gameCount:gameCount,
        bigTotal:bigTotal,
        regTotal:regTotal,
        grapeTotal:grapeTotal
    };

    localStorage.setItem(SAVE_KEY,JSON.stringify(data));

}

function loadGameData(){

    const savedData = localStorage.getItem(SAVE_KEY);

    if(!savedData){
        return;
    }

    const data = JSON.parse(savedData);

    renga = data.renga ?? 1000;
    gameCount = data.gameCount ?? 0;
    bigTotal = data.bigTotal ?? 0;
    regTotal = data.regTotal ?? 0;
    grapeTotal = data.grapeTotal ?? 0;

}

function updateRenga(){

    rengaText.textContent = renga;

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

    missionArea.innerHTML = `
        <p>総回転　${gameCount}G</p>
        <p>BIG　${bigTotal}　${getBigRate()}</p>
        <p>REG　${regTotal}　${getRegRate()}</p>
        <p>合成　${getBonusRate()}</p>
        <p>ぶどう　${getGrapeRate()}</p>
    `;

}

function showResultText(text){

    const resultText = document.getElementById("resultText");

    resultText.textContent = text;
    resultText.classList.add("show");

    setTimeout(() => {
        resultText.classList.remove("show");
    },2000);

}

function triggerPekari(){

    const game = document.getElementById("game");
    const pekariText = document.getElementById("pekariText");

    game.classList.add("pekariGlow");
    pekariText.classList.add("on");

    setTimeout(() => {
        game.classList.remove("pekariGlow");
        pekariText.classList.remove("on");
    },3000);

}

function setBet(amount){

    if(isSpinning){
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

function showReel(reelId){

    const reel = document.getElementById(reelId);
    const strip = reelStrips[reelId];
    const pos = reelPositions[reelId];

    reel.innerHTML = "";

    for(let i=0;i<3;i++){

        const symbolName = strip[(pos + i) % strip.length];

        const div = document.createElement("div");
        div.className = "symbol";

        const img = document.createElement("img");
        img.src = symbolImages[symbolName];

        div.appendChild(img);
        reel.appendChild(div);

    }

}

function spinReel(reelId){

    reelTimers[reelId] = setInterval(() => {

        reelPositions[reelId]++;
        showReel(reelId);

    },90);

}

function stopReel(reelId){

    if(reelStopped[reelId]){
        return;
    }

    clearInterval(reelTimers[reelId]);
    reelStopped[reelId] = true;

    showReel(reelId);

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

    if(left === center && center === right){
        return left;
    }

    return "lose";

}

function checkResult(){

    const lines = getAllLines();

    let result = "lose";

    for(const line of lines){
        if(judgeLine(line) === "big"){
            result = "big";
            break;
        }
    }

    if(result === "lose"){
        for(const line of lines){
            if(judgeLine(line) === "reg"){
                result = "reg";
                break;
            }
        }
    }

    if(result === "lose"){
        for(const line of lines){
            const lineResult = judgeLine(line);

            if(lineResult !== "lose"){
                result = lineResult;
                break;
            }
        }
    }

    let payout = 0;
    let message = "ハズレ";

    if(result === "big"){

        payout = payouts.big;
        message = "BIG BONUS! +" + payout;
        bigTotal++;
        triggerPekari();

    }else if(result === "reg"){

        payout = payouts.reg;
        message = "REG BONUS! +" + payout;
        regTotal++;
        triggerPekari();

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

    }

    renga += payout;

    updateRenga();
    updateMission();
    saveGameData();

    showResultText(message);

    currentBet = 0;

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

    if(!retryMode && currentBet === 0){
        showResultText("BETしてね");
        return;
    }

    if(!retryMode && renga < currentBet){
        showResultText("レンガ不足");
        return;
    }

    if(retryMode){

        showResultText("リトライ");

    }else{

        renga -= currentBet;
        updateRenga();

    }

    retryMode = false;

    gameCount++;
    updateMission();
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

        stopReel("reel3");

        isSpinning = false;
        stopCount = 0;

        checkResult();

    }

}

function autoPlay(){

    if(!autoMode){
        return;
    }

    if(isSpinning){
        return;
    }

    if(!retryMode && renga < AUTO_BET_AMOUNT){
        autoMode = false;
        showResultText("AUTO終了");
        return;
    }

    if(!retryMode){
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

    const ok = confirm("レンガ・回転数・BIG・REG・ぶどう確率をリセットしますか？");

    if(!ok){
        return;
    }

    localStorage.removeItem(SAVE_KEY);

    renga = 1000;
    currentBet = 0;
    retryMode = false;

    gameCount = 0;
    bigTotal = 0;
    regTotal = 0;
    grapeTotal = 0;

    autoMode = false;
    clearTimeout(autoTimer);

    updateRenga();
    updateMission();
    saveGameData();

    showResultText("データリセット");

}

loadGameData();

showReel("reel1");
showReel("reel2");
showReel("reel3");
updateRenga();
updateMission();

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

document.addEventListener("keydown",(e)=>{

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