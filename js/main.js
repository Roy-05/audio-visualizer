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

let PAGE_WIDTH = canvas_container.clientWidth,
  PAGE_HEIGHT = canvas_container.clientHeight;

// global data varaibles for audio viz canvas
let points = [],
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  RADIUS,
  GDT = [];

let numBars,
  barHeight = 10,
  barWidth,
  MAX_BAR_HEIGHT = 100,
  MAX_BAR_WIDTH = 20,
  MIN_BAR_WIDTH = 2;

let isResizing = false,
  resizeEnd;

let settings_obj = {};

let DRAWER_WIDTH = 320;
//Initialize canvas
window.addEventListener("DOMContentLoaded", () => {
  let constraints = { audio: { noiseSuppression: true } };

  navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
    source = audioCtx.createMediaStreamSource(stream);

    //Source: https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode
    analyser.minDecibels = -90;
    analyser.maxDecibels = -10;
    analyser.smoothingTimeConstant = 0.88;

    source.connect(analyser);
  });

  if (localStorage.length === 0) {
    populateSettings();
  }
  settings_obj = getSettings();
  setCanvasSize();
  setDimensions();
  init();
});

window.addEventListener("resize", () => {
  isResizing = true;

  //Change resizing to false once resize is done firing
  clearTimeout(resizeEnd);
  resizeEnd = setTimeout(() => {
    isResizing = false;

    if (isDrawerClosed === false) {
      toggleDrawer();
    }

    if (isPaused === false && !isFullScreen) {
      PAGE_WIDTH = canvas_container.clientWidth;
      PAGE_HEIGHT = canvas_container.clientHeight;
    }

    setCanvasSize();
    setDimensions();
    update();
  }, 300);
});

document.addEventListener("click", () => {
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
});

function init() {
  let t0 = performance.now();

  input_color_fields["start_gdt"].value = settings_obj["start_gdt"][activeTab];
  input_color_fields["end_gdt"].value = settings_obj["end_gdt"][activeTab];
  input_color_fields["bg_color"].value = settings_obj["bg_color"][activeTab];

  setUpColorPicker();

  // Set number of Bars
  setNumBars(settings_obj["numBars"][activeTab]);

  // Set gradient
  setGradient();

  // Set Background color
  setBgColor();

  // Set radius
  setRadius(settings_obj["radius"][activeTab]);

  // Set Max Bar Height
  setBarHeight(settings_obj["barHeight"][activeTab]);
  // Set the bar width based on the size of the canvas;
  setBarWidth();

  // Get the x,y coordinates of each audio bar and store it in a global array
  getAudioBarCoordinates();

  let t1 = performance.now();
  console.log(`init took ${t1 - t0}`);

  if (!isPaused) {
    visualize();
  }
}

function update() {
  let t0 = performance.now();
  // Update Background color
  setBgColor();
  // Update radius
  setRadius(radius_slider["slider"].value);
  // Update number of Bars
  setNumBars(numBars_slider["slider"].value);
  // Set Max Bar Height
  setBarHeight(barHeight_slider["slider"].value);
  // Update gradient
  setGradient();

  updateSettings();

  // Set the bar width based on the size of the canvas;
  setBarWidth();
  // Get the x,y coordinates of each audio bar and store it in a global array
  getAudioBarCoordinates();

  let t1 = performance.now();

  console.log(`update took ${t1 - t0}`);

  if (!isPaused) {
    // Start visualization
    visualize();
  }
}

function setCanvasSize() {
  // Get the smaller dimension to use as limit to set canvas size
  let minD = Math.min(PAGE_HEIGHT, PAGE_WIDTH);

  // Check if there is the extra space to fit the drawer else reduce canvas size
  if (window.innerWidth - DRAWER_WIDTH < minD) {
    minD = window.innerWidth - DRAWER_WIDTH;
  }

  // Set canvas width and height to that value
  CANVAS_WIDTH = minD;
  CANVAS_HEIGHT = minD;

  // Set CSS width/height
  // This will create the box that will contain the canvas
  canvas.style.width = CANVAS_WIDTH + "px";
  canvas.style.height = CANVAS_HEIGHT + "px";

  // Scale for dpi for retina display
  // This will set the width and height for the canvas coordinate system
  canvas.width = Math.floor(CANVAS_WIDTH * DPI);
  canvas.height = Math.floor(CANVAS_HEIGHT * DPI);

  // Scale the canvas accordingly
  canvasCtx.scale(DPI, DPI);
}

function setDimensions() {
  let max_radius = parseInt(radius_slider["max_label"].innerText, 10),
    bar_height = parseInt(barHeight_slider["max_label"].innerText, 10),
    cWidth = (max_radius + bar_height + 5) * 2;

  // The 20 is to verify that cWidth can satify first iteration of while loop
  // need to better handle this
  if (cWidth + 20 <= CANVAS_WIDTH) {
    while (cWidth <= CANVAS_WIDTH) {
      bar_height += 5;
      max_radius += 5;
      cWidth = (max_radius + bar_height + 5) * 2;
    }
  } else if (cWidth - 20 >= CANVAS_WIDTH) {
    while (cWidth >= CANVAS_WIDTH) {
      bar_height -= 5;
      max_radius -= 5;

      cWidth = (max_radius + bar_height + 5) * 2;
    }
  }
  updateRadiusSlider(max_radius);
  updateBarHeightSlider(bar_height);
  updateNumBarSlider(max_radius);
}

function getAudioBarCoordinates() {
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
}

function drawDefaultCanvas() {
  canvasCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  degree = 90;
  for (let i = 0; i < numBars; i++) {
    drawAudioBar(canvasCtx, points[i], degree, i);
    degree += 360 / numBars;
  }
}

function visualize() {
  //Create Analyser Node to extract data from Audio Source
  analyser.fftSize = numBars > 512 ? 4096 : 2048;

  const bufferLength = analyser.frequencyBinCount;
  let dataArray = new Uint8Array(bufferLength);

  canvasCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  const draw = () => {
    if (isPaused || isResizing) {
      return;
    }

    if (reset) {
      reset = false;
      settings_obj = getSettings();
      init();
      return;
    }

    if (switchTabs) {
      switchTabs = false;
      init();
      return;
    }

    if (updateParams) {
      updateParams = false;
      update();
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
  barWidth = Math.floor((2 * Math.PI * RADIUS) / (numBars * 2));
  barWidth = barWidth <= MIN_BAR_WIDTH ? MIN_BAR_WIDTH : barWidth;
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
