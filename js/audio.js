//Created by Saket Roy on 12/25/19

//Global Variables:
const canvas = document.getElementById("canvas"),
  audioElem = document.querySelector("audio"),
  playButton = document.getElementById("button"),
  audioCtx = new (window.AudioContext || window.webkitAudioContext)(),
  analyser = audioCtx.createAnalyser(),
  canvasCtx = canvas.getContext("2d"),
  DPI = window.devicePixelRatio;

let source;

let drawVisual,
  points = [],
  WIDTH,
  HEIGHT,
  RADIUS = 130,
  RGB = {
    r1: 0,
    g1: 0,
    b1: 0,
    r2: 0,
    g2: 0,
    b2: 0,
    r3: 0,
    g3: 0,
    b3: 0,
  };

//Initialize values to paint default canvas
let numOfBars = 180,
  barHeight = 10,
  barWidth;

//Initialize canvas
window.addEventListener("DOMContentLoaded", () => {
  let constraints = { audio: true };

  navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
    source = audioCtx.createMediaStreamSource(stream);
    //Source: https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode
    analyser.minDecibels = -90;
    analyser.maxDecibels = -10;
    analyser.smoothingTimeConstant = 0.95;

    source.connect(analyser);
  });
  init();
});

window.addEventListener("resize", init);

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" || e.key === "f" || e.key === "F") {
    toggleFullScreen();
  }
});

document.addEventListener("click", () => {
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
});

function init() {
  setGradient("#26f596", "#0499f2");
  console.log(RGB);
  //Set the height and width of the canvas
  setCanvasSize();
  //Set the bar width based on the size of the canvas;
  setBarWidth();
  //Draw the default canvas image
  drawDefaultCanvas();
  visualize();
}

function setCanvasSize() {
  WIDTH = window.innerWidth < 600 ? window.innerWidth : 600;
  HEIGHT = window.innerHeight < 600 ? window.innerHeight : 600;

  canvas.style.width = WIDTH + "px";
  canvas.style.height = HEIGHT + "px";

  //Scale for dpi
  canvas.width = Math.floor(WIDTH * DPI);
  canvas.height = Math.floor(HEIGHT * DPI);

  canvasCtx.scale(DPI, DPI);
}

function setBarWidth() {
  let circumference = 2 * Math.PI * RADIUS;
  barWidth = Math.floor(circumference / (numOfBars * 1.5));

  //barWidth = barWidth > 3 ? barWidth : 3;
}

function drawDefaultCanvas() {
  let degree = 180;
  for (let i = 0; i < numOfBars; i++) {
    let point = [
      WIDTH / 2 + Math.cos((degree * Math.PI) / 180) * RADIUS,
      HEIGHT / 2 + Math.sin((degree * Math.PI) / 180) * RADIUS,
    ];
    points[i] = point;
    degree += 360 / numOfBars;
  }

  canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);

  degree = 90;
  for (let i = 0; i < numOfBars; i++) {
    canvasCtx.save();
    canvasCtx.translate(points[i][0], points[i][1]);
    canvasCtx.rotate((degree * Math.PI) / 180);

    let gdt = i / (numOfBars - 1);
    canvasCtx.fillStyle =
      "rgb(" +
      (RGB["r1"] - RGB["r3"] * gdt) +
      "," +
      (RGB["g1"] - RGB["g3"] * gdt) +
      ", " +
      (RGB["b1"] - RGB["b3"] * gdt) +
      ")";
    roundRect(canvasCtx, 0, 0, barWidth, 5, 2, true);

    degree += 360 / numOfBars;
    canvasCtx.restore();
  }
}

function visualize() {
  //Create Analyser Node to extract data from Audio Source
  analyser.fftSize = 1024;

  const bufferLength = analyser.frequencyBinCount;
  let dataArray = new Uint8Array(bufferLength);

  canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);

  const draw = () => {
    drawVisual = requestAnimationFrame(draw);

    //Returns frequency data on a scale of 0-255
    analyser.getByteFrequencyData(dataArray);
    canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);

    let degree = 90;
    for (let i = 0; i < numOfBars; i++) {
      //scale bar heights
      barHeight = Math.floor((dataArray[i] / 255) * 175);
      barHeight = barHeight > 5 ? barHeight : 5;

      canvasCtx.save();
      canvasCtx.translate(points[i][0], points[i][1]);
      canvasCtx.rotate((degree * Math.PI) / 180);

      let gdt = i / (numOfBars - 1);
      canvasCtx.fillStyle =
        "rgb(" +
        (RGB["r1"] - RGB["r3"] * gdt) +
        "," +
        (RGB["g1"] - RGB["g3"] * gdt) +
        ", " +
        (RGB["b1"] - RGB["b3"] * gdt) +
        ")";
      roundRect(canvasCtx, 0, 0, barWidth, barHeight, 2, true);

      degree += 360 / numOfBars;
      canvasCtx.restore();
    }
  };

  draw();
}

function drawAudioBar() {}

/**
 * Source: https://stackoverflow.com/questions/1255512/how-to-draw-a-rounded-rectangle-on-html-canvas
 * by Juan Mendes. Edited by Me for the specific use-case.
 *
 * Draws a rounded rectangle using the current state of the canvas.
 * @param {CanvasRenderingContext2D} ctx
 * @param {Number} x The top left x coordinate
 * @param {Number} y The top left y coordinate
 * @param {Number} width The width of the rectangle
 * @param {Number} height The height of the rectangle
 * @param {Number} radius The corner radius
 * @param {Number} [radius.tl = 0] Top left
 * @param {Number} [radius.tr = 0] Top right
 * @param {Number} [radius.br = 0] Bottom right
 * @param {Number} [radius.bl = 0] Bottom left
 */
function roundRect(ctx, x, y, width, height, radius) {
  radius = height <= 5 ? 2 : radius;
  radius = { tl: radius, tr: radius, br: radius, bl: radius };
  ctx.beginPath();
  ctx.moveTo(x + radius.tl, y);
  ctx.lineTo(x + width - radius.tr, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
  ctx.lineTo(x + width, y + height - radius.br);
  ctx.quadraticCurveTo(
    x + width,
    y + height,
    x + width - radius.br,
    y + height
  );
  ctx.lineTo(x + radius.bl, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
  ctx.lineTo(x, y + radius.tl);
  ctx.quadraticCurveTo(x, y, x + radius.tl, y);
  ctx.closePath();
  ctx.fill();
}

function toggleFullScreen() {
  if (!document.fullscreenElement) {
    canvas.requestFullscreen();
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }
}

function setGradient(start, end) {
  if (start[0] === "#" && start.length === 7) {
    RGB["r1"] = parseInt(start.slice(1, 3), 16);
    RGB["g1"] = parseInt(start.slice(3, 5), 16);
    RGB["b1"] = parseInt(start.slice(5, 7), 16);
  } else if (start[0] === "#" && start.length === 4) {
    RGB["r1"] = parseInt(start.slice(1, 2), 16);
    RGB["g1"] = parseInt(start.slice(2, 3), 16);
    RGB["b1"] = parseInt(start.slice(3, 4), 16);
  } else if (Array.isArray(start) && start.length === 3) {
    RGB["r1"] = start[0];
    RGB["g1"] = start[1];
    RGB["b1"] = start[2];
  } else {
    console.log("Invalid Value");
    // RGB["start"] = { r: 38, g: 245, b: 150 };
  }

  if (end[0] === "#" && end.length === 7) {
    RGB["r2"] = parseInt(end.slice(1, 3), 16);
    RGB["g2"] = parseInt(end.slice(3, 5), 16);
    RGB["b2"] = parseInt(end.slice(5, 7), 16);
  } else if (end[0] === "#" && end.length === 4) {
    RGB["r2"] = parseInt(end.slice(1, 2), 16);
    RGB["g2"] = parseInt(end.slice(2, 3), 16);
    RGB["b2"] = parseInt(end.slice(3, 4), 16);
  } else if (Array.isArray(end) && end.length === 3) {
    RGB["r2"] = end[0];
    RGB["g2"] = end[1];
    RGB["b2"] = end[2];
  } else {
    console.log("Invalid Value");
    // RGB["end"] = { r: 4, g: 153, b: 242 };
  }
  RGB["r3"] = RGB["r1"] - RGB["r2"];
  RGB["g3"] = RGB["g1"] - RGB["g2"];
  RGB["b3"] = RGB["b1"] - RGB["b2"];
}
