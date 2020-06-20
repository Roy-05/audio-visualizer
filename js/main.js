//Created by Saket Roy on 12/25/19

//Global Variables:
const canvas = document.getElementById("audio-canvas"),
  canvasCtx = canvas.getContext("2d"),
  audioCtx = new (window.AudioContext || window.webkitAudioContext)(),
  analyser = audioCtx.createAnalyser(),
  page_container = document.getElementById("main-container"),
  canvas_container = document.getElementById("canvas-container"),
  DPI = window.devicePixelRatio;

let source;

let PAGE_WIDTH = page_container.clientWidth,
  PAGE_HEIGHT = page_container.clientHeight;

// global data varaibles for audio viz canvas
let points = [],
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  RADIUS,
  GDT = [];

let numBars,
  barHeight = 10,
  barWidth,
  MAX_BAR_HEIGHT = 100;

let isResizing = false,
  resizeEnd;

let DRAWER_WIDTH = 250;
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

  //Change resizing to false once resize is done firing
  clearTimeout(resizeEnd);
  resizeEnd = setTimeout(() => {
    isResizing = false;
    setDrawerWidth();
    if (isDrawerClosed === false) {
      toggleDrawer();
    }

    console.log(DRAWER_WIDTH);
    PAGE_WIDTH = canvas_container.clientWidth;
    PAGE_HEIGHT = canvas_container.clientHeight;

    console.log(`Width: ${PAGE_WIDTH}, Height: ${PAGE_HEIGHT}`);
    setParams();
    if (isPaused === false) {
      update();
    }
  }, 300);
});

function setDrawerWidth() {
  let width = window.innerWidth - CANVAS_WIDTH;
  // Clamp width at two extremes
  if (width > 400) {
    width = 400;
  } else if (width < 250) {
    width = 250;
    let cWidth = window.innerWidth - width;
    while (CANVAS_WIDTH >= cWidth) {
      MAX_BAR_HEIGHT -= 10;
      RADIUS -= 10;
      CANVAS_WIDTH = (MAX_BAR_HEIGHT + RADIUS + 10) * 2;
    }
    updateRadiusSlider();
    updateBarHeightSlider();
  } else {
    width = width - (width % 10);
  }

  DRAWER_WIDTH = width;
}

function setParams() {
  let minDimension = Math.min(PAGE_WIDTH - DRAWER_WIDTH, PAGE_HEIGHT);
  MAX_BAR_HEIGHT = Math.floor((minDimension - RADIUS * 2 - 20) / 2);
}

document.addEventListener("click", () => {
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
});

function init() {
  setParams();

  start_gdt.value = getSetting("start_gdt");
  end_gdt.value = getSetting("end_gdt");
  bg_color.value = getSetting("bg_color");

  setUpColorPicker();
  // Set Background color
  setBgColor();

  // Set radius
  setRadius(getSetting("radius"));
  // Set number of Bars
  setNumBars(getSetting("numBars"));
  // Set Max Bar Height
  setBarHeight(getSetting("barHeight"));

  // Set gradient
  setGradient();

  // Paint canvas
  setUpVisual();

  setDrawerWidth();

  if (DRAWER_WIDTH < 250) {
    updateBarHeightSlider();
    updateRadiusSlider();
  }
}

function update() {
  // Update Background color
  setBgColor();
  // Update radius
  setRadius(radius_slider.value);
  // Update number of Bars
  setNumBars(audio_slider.value);
  // Set Max Bar Height
  setBarHeight(bar_height_slider.value);
  // Update gradient
  setGradient();

  //Re-paint canvas
  setUpVisual();
}

function setUpVisual() {
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
  CANVAS_WIDTH = (RADIUS + MAX_BAR_HEIGHT + 10) * 2;
  CANVAS_HEIGHT = (RADIUS + MAX_BAR_HEIGHT + 10) * 2;

  canvas.style.width = CANVAS_WIDTH + "px";
  canvas.style.height = CANVAS_HEIGHT + "px";

  // Scale for dpi for retina display
  canvas.width = Math.floor(CANVAS_WIDTH * DPI);
  canvas.height = Math.floor(CANVAS_HEIGHT * DPI);

  canvasCtx.scale(DPI, DPI);
}

function drawDefaultCanvas() {
  // Get starting points for each audio bar and store it in a global array
  let degree = 180;
  points = new Array(numBars);
  for (let i = 0; i < numBars; i++) {
    points[i] = [
      CANVAS_WIDTH / 2 + Math.cos((degree * Math.PI) / 180) * RADIUS,
      CANVAS_HEIGHT / 2 + Math.sin((degree * Math.PI) / 180) * RADIUS,
    ];
    degree += 360 / numBars;
  }

  canvasCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

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

  canvasCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  const draw = () => {
    if (isPaused) {
      return;
    }

    if (updateParams === true) {
      updateParams = false;
      update();
      return;
    }

    if (isResizing === true) {
      return;
    }

    requestAnimationFrame(draw);

    //Returns frequency data on a scale of 0-255
    analyser.getByteFrequencyData(dataArray);
    canvasCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    let degree = 90;
    for (let i = 0; i < numBars; i++) {
      //scale bar heights to max bar height
      barHeight = Math.floor((dataArray[i] / 255) * MAX_BAR_HEIGHT);
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
  radius = width > 2 ? radius : width - 1;

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
