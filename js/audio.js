//Created by Saket Roy on 12/25/19

//Global Variables:
const canvas = document.getElementById("audio-canvas"),
  audioElem = document.querySelector("audio"),
  playButton = document.getElementById("button"),
  audioCtx = new (window.AudioContext || window.webkitAudioContext)(),
  analyser = audioCtx.createAnalyser(),
  canvasCtx = canvas.getContext("2d"),
  DPI = window.devicePixelRatio;

let source;

let points = [],
  WIDTH,
  HEIGHT,
  RADIUS = 80,
  GDT = [];

//Initialize values to paint default canvas
let numBars,
  barHeight = 10,
  barWidth;

let isResizing = false;

//Initialize canvas
window.addEventListener("DOMContentLoaded", () => {
  let constraints = { audio: { noiseSuppression: true } };

  navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
    source = audioCtx.createMediaStreamSource(stream);

    //Source: https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode
    analyser.minDecibels = -90;
    analyser.maxDecibels = -10;
    analyser.smoothingTimeConstant = 0.9;

    source.connect(analyser);
  });
  if (localStorage.length === 0) {
    populateSettings();
  }
  init();
});

window.addEventListener("resize", () => {
  isResizing = true;
});

document.addEventListener("click", () => {
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
});

function init() {
  // Set radius
  setRadius(getSetting("radius"));
  // Set number of Bars
  setNumBars(getSetting("numBars"));

  // Set Background color
  setBgColor(getSetting("bg_color"));
  // Set gradient
  setGradient(getSetting("start_gdt"), getSetting("end_gdt"));

  // Set the height and width of the canvas
  setCanvasSize();
  // Set the bar width based on the size of the canvas;
  setBarWidth();
  // Draw the default canvas image
  drawDefaultCanvas();
  // Start visualization
  visualize();
}

function update() {
  // Set Background color
  setBgColor(bg_color.value);
  // Set radius
  setRadius(parseInt(radius_slider.value, 10));
  // Set number of Bars
  setNumBars(parseInt(audio_slider.value, 10));
  // Set gradient
  setGradient(start_gdt.value, end_gdt.value);
  // Set the height and width of the canvas
  setCanvasSize();
  // Set the bar width based on the size of the canvas;
  setBarWidth();
  // Draw the default canvas image
  drawDefaultCanvas();
  // Start visualization
  visualize();
}

function setCanvasSize() {
  WIDTH = window.innerWidth < 600 ? window.innerWidth : 600;
  HEIGHT = window.innerHeight < 600 ? window.innerHeight : 600;

  canvas.style.width = WIDTH + "px";
  canvas.style.height = HEIGHT + "px";

  // Scale for dpi for retina display
  canvas.width = Math.floor(WIDTH * DPI);
  canvas.height = Math.floor(HEIGHT * DPI);

  canvasCtx.scale(DPI, DPI);
}

function drawDefaultCanvas() {
  // Get starting points for each audio bar and store it in a global array
  let degree = 180;
  points = new Array(numBars);
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
  analyser.fftSize = 2048;

  const bufferLength = analyser.frequencyBinCount;
  let dataArray = new Uint8Array(bufferLength);

  canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);

  const draw = () => {
    if (updateParams === true) {
      updateParams = false;
      update();
      return;
    }

    if (isResizing === true) {
      isResizing = false;
      update();
      return;
    }

    requestAnimationFrame(draw);

    //Returns frequency data on a scale of 0-255
    analyser.getByteFrequencyData(dataArray);
    canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);

    let degree = 90;
    for (let i = 0; i < numBars; i++) {
      //scale bar heights to max height of 175
      barHeight = Math.floor((dataArray[i] / 255) * 150);
      barHeight = barHeight > 5 ? barHeight : 5;

      let fillColor = GDT[i]; //The color of the audio bar

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
