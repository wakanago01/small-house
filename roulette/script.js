const canvas = document.getElementById("rouletteCanvas");

const rect = canvas.getBoundingClientRect();
const radius = canvas.width * 0.45;

canvas.width = rect.width;
canvas.height = rect.height;

const ctx = canvas.getContext("2d");

ctx.arc(
    centerX,
    centerY,
    canvas.width * 0.15,
    0,
    Math.PI * 2
);