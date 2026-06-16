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

const symbols = [

    "../image/seven.png",
    "../image/bar.png",
    "../image/bell.png",
    "../image/grape.png",
    "../image/cherry.png",
    "../image/rabbit.png"

];

function createReel(reelId){

    const reel = document.getElementById(reelId);

    reel.innerHTML = "";

    for(let i=0;i<3;i++){

        const div = document.createElement("div");

        div.className = "symbol";

        const img = document.createElement("img");

        img.src = symbols[Math.floor(Math.random()*symbols.length)];

        div.appendChild(img);

        reel.appendChild(div);

    }

}

createReel("reel1");
createReel("reel2");
createReel("reel3");

function setButton(button,name,action){

    button.addEventListener("click",() => {

        pressButton(button);
        console.log(name);

        if(action){
            action();
        }

    });

}

setButton(bet1,"1BET");
setButton(bet2,"2BET");
setButton(bet3,"3BET");
setButton(maxBet,"MAX BET");

setButton(startBtn,"START",() => {

    createReel("reel1");
    createReel("reel2");
    createReel("reel3");

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