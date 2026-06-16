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

const symbolImages = {
    seven:"../image/seven.png",
    bar:"../image/bar.png",
    bell:"../image/bell.png",
    grape:"../image/grape.png",
    cherry:"../image/cherry.png",
    rabbit:"../image/rabbit.png"
};

const reelStrips = {
    reel1:["seven","grape","bell","cherry","bar","rabbit","grape","bell"],
    reel2:["grape","seven","cherry","bell","rabbit","bar","grape","bell"],
    reel3:["bell","grape","seven","rabbit","bar","cherry","grape","bell"]
};

let renga = 1000;
let currentBet = 0;

let bigCount = 0;
let grapeCount = 0;
let rabbitCount = 0;

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

function updateRenga(){
    rengaText.textContent = renga;
}

function updateMission(){

    missionArea.innerHTML = `
        <p>今月のミッション</p>
        <p>BIGを1回当てる　${bigCount}/1</p>
        <p>ぶどうを10回そろえる　${grapeCount}/10</p>
        <p>うさぎを3回そろえる　${rabbitCount}/3</p>
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
        img.dataset.symbol = symbolName;

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

function getCenterSymbol(reelId){

    const strip = reelStrips[reelId];
    const pos = reelPositions[reelId];

    return strip[(pos + 1) % strip.length];

}

function checkResult(){

    const left = getCenterSymbol("reel1");
    const center = getCenterSymbol("reel2");
    const right = getCenterSymbol("reel3");

    console.log("中央ライン:", left, center, right);

    let payout = 0;
    let message = "ハズレ";

    if(left === "seven" && center === "seven" && right === "seven"){

        payout = currentBet * 100;
        message = "BIG BONUS! +" + payout;
        bigCount = 1;
        triggerPekari();

    }else if(left === "seven" && center === "seven" && right === "bar"){

        payout = currentBet * 30;
        message = "REG BONUS! +" + payout;
        triggerPekari();

    }else if(left === "bell" && center === "bell" && right === "bell"){

        payout = currentBet * 10;
        message = "ベル成立 +" + payout;

    }else if(left === "grape" && center === "grape" && right === "grape"){

        payout = currentBet * 5;
        message = "ぶどう成立 +" + payout;
        grapeCount++;

    }else if(left === "cherry" && center === "cherry" && right === "cherry"){

        payout = currentBet * 3;
        message = "チェリー成立 +" + payout;

    }else if(left === "rabbit" && center === "rabbit" && right === "rabbit"){

        payout = currentBet;
        message = "うさぎリプレイ";
        rabbitCount++;

    }

    renga += payout;
    updateRenga();
    updateMission();
    showResultText(message);

    currentBet = 0;

}

function startSpin(){

    if(isSpinning){
        return;
    }

    if(currentBet === 0){
        showResultText("BETしてね");
        return;
    }

    if(renga < currentBet){
        showResultText("レンガ不足");
        return;
    }

    renga -= currentBet;
    updateRenga();

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

showReel("reel1");
showReel("reel2");
showReel("reel3");
updateRenga();
updateMission();

function setButton(button,name,action){

    button.addEventListener("click",() => {

        pressButton(button);
        console.log(name);

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

setButton(autoBtn,"AUTO");
setButton(missionBtn,"MISSION");
setButton(settingBtn,"SETTING");

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