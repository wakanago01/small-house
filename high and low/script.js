let money = 50000;
let stress = 0;
let streak = 0;
let bet = 1000;

const suits = ["♠", "♥", "♦", "♣"];

function createCard() {
    return {
        value: Math.floor(Math.random() * 13) + 1,
        suit: suits[Math.floor(Math.random() * 4)]
    };
}

function cardText(v) {
    if (v === 1) return "A";
    if (v === 11) return "J";
    if (v === 12) return "Q";
    if (v === 13) return "K";
    return v;
}

function draw(card, id) {
    const element = document.getElementById(id);

    if (!element) return;

    const color =
        (card.suit === "♥" || card.suit === "♦")
            ? "#d62828"
            : "#222";

    element.innerHTML = `
        <div class="card-inner">

            <div class="corner top" style="color:${color}">
                <div>${cardText(card.value)}</div>
                <div>${card.suit}</div>
            </div>

            <div class="center-suit" style="color:${color}">
                ${card.suit}
            </div>

            <div class="corner bottom" style="color:${color}">
                <div>${cardText(card.value)}</div>
                <div>${card.suit}</div>
            </div>

        </div>
    `;
}

function setBet(value) {
    bet = value;

    const display = document.getElementById("betDisplay");

    if (display) {
        display.textContent = value;
    }
}

let current = createCard();

window.onload = () => {
    draw(current, "currentCard");
};

function play(choice) {

    if (money < bet) {
        alert("お金が足りません");
        return;
    }

    let next = createCard();

    draw(next, "nextCard");

    let win = false;

    if (choice === "high" && next.value > current.value) {
        win = true;
    }

    if (choice === "low" && next.value < current.value) {
        win = true;
    }

    const result = document.getElementById("result");
    const rabbit = document.getElementById("rabbitText");

    if (next.value === current.value) {

        result.textContent = "🤝 引き分け";
        rabbit.textContent = "惜しかったね♪";

    } else if (win) {

        let reward = bet;

        streak++;

        if (streak % 5 === 0) {
            reward += 5000;
            rabbit.textContent =
                "すごい！連勝ボーナスだよ♪";
        } else {
            rabbit.textContent =
                "おめでとう♪";
        }

        money += reward;

        result.textContent =
            `🎉 勝利！ +${reward} renga`;

    } else {

        money -= bet;
        stress += 5;
        streak = 0;

        result.textContent =
            `💀 敗北... -${bet} renga`;

        rabbit.textContent =
            "残念だったね♪";
    }

    if (stress >= 50) {
        rabbit.textContent =
            "まだ続けるの？";
    }

    if (stress >= 80) {
        rabbit.textContent =
            "本当に帰れると思ってる？";
    }

    document.getElementById("money").textContent =
        money;

    document.getElementById("stress").textContent =
        stress;

    document.getElementById("streak").textContent =
        streak;

    current = createCard();

    setTimeout(() => {

        draw(current, "currentCard");

        document.getElementById("nextCard").innerHTML =
            "★";

    }, 1500);

    if (money <= 0) {
        alert("GAME OVER\n破産しました");
    }

    if (stress >= 100) {
        alert("GAME OVER\n発狂しました");
    }
}