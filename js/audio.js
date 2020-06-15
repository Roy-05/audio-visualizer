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
  };

//Initialize values to paint default canvas
let numBars = 120,
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

  //Scale for dpi for retina display
  canvas.width = Math.floor(WIDTH * DPI);
  canvas.height = Math.floor(HEIGHT * DPI);

  canvasCtx.scale(DPI, DPI);
}

function drawDefaultCanvas() {
  // Get starting points for each audio bar and store it in a global array
  let degree = 180;
  for (let i = 0; i < numBars; i++) {
    points[i] = [
      WIDTH / 2 + Math.cos((degree * Math.PI) / 180) * RADIUS,
      HEIGHT / 2 + Math.sin((degree * Math.PI) / 180) * RADIUS,
    ];
    degree += 360 / numBars;
  }

  canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);

  degree = 90;
  for (let i = 0; i < numBars; i++) {
    drawAudioBar(canvasCtx, points[i], degree, i);
    degree += 360 / numBars;
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
    for (let i = 0; i < numBars; i++) {
      //scale bar heights to max height of 175
      barHeight = Math.floor((dataArray[i] / 255) * 175);
      barHeight = barHeight > 5 ? barHeight : 5;

      let fillColor = getGdt(i); //The color of the audio bar

      drawAudioBar(canvasCtx, points[i], degree, fillColor);
      degree += 360 / numBars;
    }
  };
  draw();
}

function drawAudioBar(ctx, point, degree, color) {
  ctx.save();
  ctx.translate(point[0], point[1]);
  ctx.rotate((degree * Math.PI) / 180);
  roundRect(ctx, -barWidth / 2, 0, barWidth, barHeight, 2, color);
  ctx.restore();
}

function setBarWidth() {
  barWidth = Math.floor((2 * Math.PI * RADIUS) / (numBars * 1.5));
}

/**
 * Source: https://stackoverflow.com/questions/1255512/how-to-draw-a-rounded-rectangle-on-html-canvas
 * Edited by Me for the specific use-case.
 * Draws a rounded rectangle using the current state of the canvas.
 * @param {CanvasRenderingContext2D} ctx
 * @param {Number} x      The top left x coordinate
 * @param {Number} y      The top left y coordinate
 * @param {Number} width  The width of the rectangle
 * @param {Number} height The height of the rectangle
 * @param {Number} radius The corner radius
 * @param {String} color  The fill color of the rectangle
 */
function roundRect(ctx, x, y, width, height, radius, color) {
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
  ctx.fillStyle = color;
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
    console.error("Invalid Value");
    RGB["r2"] = 38;
    RGB["g2"] = 245;
    RGB["b2"] = 150;
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
    console.error("Invalid Value");
    RGB["r2"] = 4;
    RGB["g2"] = 153;
    RGB["b2"] = 242;
  }
}

/**
 * Return the color of the i-th audio bar based on the chosen color gradient
 * @param {Number} i The index of the current audio bar
 */
function getGdt(i) {
  let gdt = [
    RGB["r1"] - (RGB["r1"] - RGB["r2"]) * (i / (numBars - 1)),
    RGB["g1"] - (RGB["g1"] - RGB["g2"]) * (i / (numBars - 1)),
    RGB["b1"] - (RGB["b1"] - RGB["b2"]) * (i / (numBars - 1)),
  ];

  return `rgb(${gdt[0]},${gdt[1]},${gdt[2]})`;
}
