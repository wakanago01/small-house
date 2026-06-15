console.log("script loaded");

const canvas = document.getElementById("rouletteCanvas");
const ctx = canvas.getContext("2d");

const rouletteNumbers = [
    0,
    32,15,19,4,21,2,25,17,34,6,
    27,13,36,11,30,8,23,10,5,
    24,16,33,1,20,14,31,9,22,
    18,29,7,28,12,35,3,26
];

let rotation = 0;
let spinning = false;

let ballAngle = -Math.PI / 2;
let winningNumber = null;

const redNumbers = [
    1,3,5,7,9,
    12,14,16,18,
    19,21,23,25,27,
    30,32,34,36
];

function resizeCanvas() {

    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width;
    canvas.height = rect.height;

    drawRoulette();
}

setMessage("幸運を祈るよ。");

function drawRoulette() {

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    const outerRadius = canvas.width * 0.45;
    const innerRadius = canvas.width * 0.28;

    const angleSize = (Math.PI * 2) / 37;

    ctx.save();

    ctx.translate(centerX, centerY);
    ctx.rotate(rotation);
    ctx.translate(-centerX, -centerY);

    rouletteNumbers.forEach((number, index) => {

        const startAngle =
            index * angleSize - Math.PI / 2;

        const endAngle =
            startAngle + angleSize;

        let color;

        if(number === 0){
            color = "#1fa84a";
        }
        else if(redNumbers.includes(number)){
            color = "#c62828";
        }
        else{
            color = "#111111";
        }

        ctx.beginPath();

        ctx.arc(
            centerX,
            centerY,
            outerRadius,
            startAngle,
            endAngle
        );

        ctx.arc(
            centerX,
            centerY,
            innerRadius,
            endAngle,
            startAngle,
            true
        );

        ctx.closePath();

        ctx.fillStyle = color;
        ctx.fill();

        ctx.strokeStyle = "#d4af37";
        ctx.lineWidth = 2;
        ctx.stroke();

        const textAngle =
            startAngle + angleSize / 2;

        const textRadius =
            (outerRadius + innerRadius) / 2;

        const textX =
            centerX +
            Math.cos(textAngle) * textRadius;

        const textY =
            centerY +
            Math.sin(textAngle) * textRadius;

        ctx.save();

        ctx.translate(textX, textY);
        ctx.rotate(textAngle + Math.PI / 2);

        ctx.fillStyle = "white";
        ctx.font = `bold ${canvas.width * 0.03}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        ctx.fillText(number, 0, 0);

        ctx.restore();
    });

    ctx.restore();

    ctx.beginPath();

    ctx.arc(
        centerX,
        centerY,
        innerRadius - 10,
        0,
        Math.PI * 2
    );

    ctx.fillStyle = "#7c5ac2";
    ctx.fill();

    ctx.strokeStyle = "#d4af37";
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.beginPath();

    ctx.arc(
        centerX,
        centerY,
        canvas.width * 0.03,
        0,
        Math.PI * 2
    );

    ctx.fillStyle = "#d4af37";
    ctx.fill();

    if (winningNumber !== null) {

        const ballRadius =
            (outerRadius + innerRadius) / 2;

        const ballX =
            centerX +
            Math.cos(ballAngle) * ballRadius;

        const ballY =
            centerY +
            Math.sin(ballAngle) * ballRadius;

        ctx.beginPath();

        ctx.arc(
            ballX,
            ballY,
            canvas.width * 0.015,
            0,
            Math.PI * 2
        );

        ctx.fillStyle = "white";
        ctx.fill();

        ctx.strokeStyle = "#cccccc";
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}

window.addEventListener("resize", resizeCanvas);

resizeCanvas();

function getWinningNumber() {

    const angleSize = (Math.PI * 2) / 37;

    let normalizedRotation =
        rotation % (Math.PI * 2);

    if(normalizedRotation < 0){
        normalizedRotation += Math.PI * 2;
    }

    const pointerAngle =
        (Math.PI * 2 - normalizedRotation);

    const index =
        Math.floor(pointerAngle / angleSize) % 37;

    return rouletteNumbers[index];
}

const spinButton =
    document.getElementById("spinButton");

    function spinRoulette() {

    if(spinning){
        return;
    }

    spinning = true;

    let speed =
        Math.random() * 0.3 + 0.4;

    function animate() {

        rotation += speed;

        speed *= 0.985;

        drawRoulette();

        if(speed > 0.002){
            requestAnimationFrame(animate);
        }
        else{

            spinning = false;

            const result =
                getWinningNumber();
            
            winningNumber = result;

            const index =
                rouletteNumbers.indexOf(result);

            const angleSize =
                (Math.PI * 2) / 37;

            ballAngle =
                index * angleSize
                - Math.PI / 2
                + angleSize / 2;

            drawRoulette();

            setMessage(
                `結果は ${result} だよ。`
            );

            console.log(
                "winning number:",
                result
            );
        }
    }

    animate();
}

spinButton.addEventListener(
    "click",
    spinRoulette
);

function setMessage(text){

    document.getElementById(
        "messageBox"
    ).textContent =
        "Rabbit : " + text;
}