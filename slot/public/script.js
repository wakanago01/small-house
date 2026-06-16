function pressButton(button){

    button.classList.add("pressed");

    setTimeout(() => {

        button.classList.remove("pressed");

    },120);

}

/* ボタン取得 */

const bet1 = document.getElementById("bet1");
const bet2 = document.getElementById("bet2");
const bet3 = document.getElementById("bet3");
const maxBet = document.getElementById("maxBet");

const startBtn = document.getElementById("startBtn");

const autoBtn = document.getElementById("autoBtn");
const missionBtn = document.getElementById("missionBtn");
const settingBtn = document.getElementById("settingBtn");

/* クリック操作 */

bet1.onclick = () => {

    pressButton(bet1);
    console.log("1BET");

};

bet2.onclick = () => {

    pressButton(bet2);
    console.log("2BET");

};

bet3.onclick = () => {

    pressButton(bet3);
    console.log("3BET");

};

maxBet.onclick = () => {

    pressButton(maxBet);
    console.log("MAX BET");

};

startBtn.onclick = () => {

    pressButton(startBtn);
    console.log("START");

};

autoBtn.onclick = () => {

    pressButton(autoBtn);
    console.log("AUTO");

};

missionBtn.onclick = () => {

    pressButton(missionBtn);
    console.log("MISSION");

};

settingBtn.onclick = () => {

    pressButton(settingBtn);
    console.log("SETTING");

};

/* キーボード操作 */

document.addEventListener("keydown",(e)=>{

    if(e.key==="1") bet1.click();

    if(e.key==="2") bet2.click();

    if(e.key==="3") bet3.click();

    if(e.key==="m") maxBet.click();

    if(e.code==="Space") startBtn.click();

    if(e.key==="a") autoBtn.click();

});