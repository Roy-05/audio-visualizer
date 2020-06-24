/**
 * https://roy-05.github.io/audio-visualizer/
 *
 * A highly customizable Audio Visualizer for Spotify, Youtube etc..
 * This simple Web App uses the device microphone to input sound and create
 * beautiful visualizations in real time on a HTML5 canvas element
 *
 * Made By: Saket Roy
 *
 */

//Global constants to manipulate DOM
const page_container = document.getElementById("main-container"),
  canvas = document.getElementById("audio-canvas"),
  canvasCtx = canvas.getContext("2d"),
  canvas_container = document.getElementById("canvas-container"),
  audioCtx = new (window.AudioContext || window.webkitAudioContext)(),
  analyser = audioCtx.createAnalyser(),
  DPI = window.devicePixelRatio,
  sidenav_options = [...document.getElementsByClassName("sidenav-options")],
  settings_tabs = [...document.getElementsByClassName("tab")],
  drawer_close_btn = document.getElementById("drawer_closebtn"),
  drawer = document.getElementById("drawer"),
  settings_fields = [...document.getElementsByClassName("settings")],
  input_color_fields = {
    start_gdt: document.getElementById("start_gdt"),
    end_gdt: document.getElementById("end_gdt"),
    bg_color: document.getElementById("bg_color"),
  },
  numBars_slider = {
    slider: document.getElementById("numBars_slider"),
    min_label: document.getElementById("min_num_bars"),
    max_label: document.getElementById("max_num_bars"),
  },
  radius_slider = {
    slider: document.getElementById("radius_slider"),
    min_label: document.getElementById("min_radius"),
    max_label: document.getElementById("max_radius"),
  },
  barHeight_slider = {
    slider: document.getElementById("bar_height_slider"),
    min_label: document.getElementById("min_bar_height"),
    max_label: document.getElementById("max_bar_height"),
  },
  shortcut_modal_elems = {
    container: document.getElementById("shortcuts_container"),
    menu: document.getElementById("shortcuts_menu"),
    close_btn: document.getElementById("shortcuts_close_btn"),
  },
  reset_modal_elems = {
    container: document.getElementById("reset_container"),
    menu: document.getElementById("reset_menu"),
    close_btn: [...document.getElementsByClassName("cancel_reset")],
    confirm: document.getElementById("confirm"),
  };

// Global variables needed to set up canvas and visualizations
let CANVAS_CONTAINER_WIDTH = canvas_container.clientWidth,
  CANVAS_CONTAINER_HEIGHT = canvas_container.clientHeight,
  MAX_BAR_HEIGHT = 100,
  MAX_BAR_WIDTH = 20,
  MIN_BAR_WIDTH = 2,
  DRAWER_WIDTH = 320,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  RADIUS,
  GDT = [],
  points = [],
  numBars,
  barHeight = 10,
  barWidth;

// Global Variables to maintain state and handle changes
let isResizing = false,
  isDrawerClosed = true,
  updateParams = false,
  isFullScreen = false,
  isShortcutsEnabled = true,
  isShortcutMenuVisible = false,
  isResetMenuVisible = false,
  isPaused = false,
  reset = false,
  isMouseMoving = false,
  switchTabs = false;

// Timeout objects to make resize, mousemove, and hamburger transitions happen properly
let resizeEnd, mouseMoveEnd, toggleSidenavOptions;

// global data container objects
let settings_obj = {},
  picker_map = {},
  color_picker_btns = [],
  keyMap = {};

// Other misc global variables
let source,
  activeTab = 0;

/**
 * --------------------------------------------------------------------------------
 * EVENT LISTENERS
 * handle user interactions with the DOM
 * --------------------------------------------------------------------------------
 */

// Initial set up tasks
window.addEventListener("DOMContentLoaded", () => {
  // Get access to device microphone and create an audio stream
  navigator.mediaDevices
    .getUserMedia({ audio: { noiseSuppression: true } })
    .then((stream) => {
      source = audioCtx.createMediaStreamSource(stream);

      // Source: https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode
      // Paraemters for the analyser
      analyser.minDecibels = -90;
      analyser.maxDecibels = -10;
      analyser.smoothingTimeConstant = 0.88;

      source.connect(analyser);
    });

  // If local storage is empty, populate it with initial settings
  if (localStorage.length === 0) {
    populateSettings();
  }

  // Set our global settings container to the local storage settings
  settings_obj = getSettings();

  /**
   * Set the size of the canvas and scale it to the device dpi.
   * This is necessary for crisp rendering on high dpi displays like Retina.
   */
  setCanvasSize();

  /**
   * Set the maximum/minimum values for UI settings (radius, bar height, num bars)
   * based on the size of the canvas
   */
  setDimensions();

  /**
   * Initialize the Web App using the loaded settings and begin visualization.
   */
  init();
});

/**
 * This needs to be fired once, Chrome requires an initials user gesture
 * to allow for the AudioContext to be resumed
 */
page_container.addEventListener("click", resumeAudioContext);

// Handle window resize
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
      CANVAS_CONTAINER_WIDTH = canvas_container.clientWidth;
      CANVAS_CONTAINER_HEIGHT = canvas_container.clientHeight;
    }

    setCanvasSize();
    setDimensions();
    update();
  }, 300);
});

// The following are all event listeners to handle user interactions with the UI

// Different tasks to do on button click for each sidenave option
sidenav_options.forEach((btn) => {
  btn.addEventListener("click", () => {
    if (btn.id === "hamburger") {
      toggleDrawer();
    } else if (btn.id === "source") {
      window.location.href = "https://github.com/Roy-05/audio-visualizer";
    } else if (btn.id === "shortcuts") {
      showShortcutsMenu();
    } else if (btn.id === "reset") {
      showResetMenu();
    }
  });
});

// Hide the sidenav drawer
drawer_close_btn.addEventListener("click", () => {
  toggleDrawer();
});

// Switch tabs on user click to display different custom themes
settings_tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    if (tab.classList.contains("active") === false) {
      let elem = document.getElementsByClassName("active")[0];
      elem.classList.remove("active");
      tab.classList.add("active");
      if (tab.id === "tab_1") {
        activeTab = 0;
      } else if (tab.id === "tab_2") {
        activeTab = 1;
      } else {
        activeTab = 2;
      }
      switchTabs = true;
    }
  });
});

// Handle various interactions on each settings fields options
settings_fields.forEach((elem) => {
  // Prevent keyboard shortcuts from firing accidentally while the user is updating settings options
  elem.addEventListener("focus", () => {
    isShortcutsEnabled = false;
  });

  elem.addEventListener("blur", () => {
    isShortcutsEnabled = true;
  });

  // Settings updateParams to true will fire the update function
  elem.addEventListener("change", () => {
    updateParams = true;
  });
});

/**
 * A simple way to check that only once key has been pressed. On keydown we add the key to keyMap.
 * If other keys are pressed simultaneously the function will not do anything -
 * it will only fire when keyMap has exactly one key in it during keyUp.
 */
document.addEventListener("keydown", (e) => {
  keyMap[e.key] = true;
});

document.addEventListener("keyup", (e) => {
  keyboardControls(e);
});

// Hide the shortcut modal if open
shortcut_modal_elems["container"].addEventListener("click", hideShortcutsMenu);
shortcut_modal_elems["close_btn"].addEventListener("click", hideShortcutsMenu);

// Hide the reset modal if open
reset_modal_elems["close_btn"].forEach((btn) => {
  btn.addEventListener("click", hideResetMenu);
});

// If the user confirms reset, clear local storage and re-populate it with the initial settings
reset_modal_elems["confirm"].addEventListener("click", () => {
  clearSettings();
  populateSettings();
  reset = true;
});

// Listen for fullscreen to disable drawer shortcuts if user is fullscreen
canvas.addEventListener("fullscreenchange", () => {
  isFullScreen = !isFullScreen;
});

/**
 * --------------------------------------------------------------------------------
 * END OF EVENT LISTENERS
 * --------------------------------------------------------------------------------
 */

/**
 * Resume the audio context on first click, then remove the event listening for it.
 */
function resumeAudioContext() {
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }

  page_container.removeEventListener("click", resumeAudioContext);
}

/**
 * Call to initialize all canvas visualizations dependencies (eg. DOMContentLoad, switch tabs) etc.
 */
function init() {
  /**
   * The value of the input color fields need to initialized first so that
   * jscolor has an initial value to refer to
   */
  input_color_fields["start_gdt"].value = settings_obj["start_gdt"][activeTab];
  input_color_fields["end_gdt"].value = settings_obj["end_gdt"][activeTab];
  input_color_fields["bg_color"].value = settings_obj["bg_color"][activeTab];

  // Set up jscolor-picker with the initialized values
  setUpColorPicker();

  // Set the number of Bars
  setNumBars(settings_obj["numBars"][activeTab]);

  // Store the gradient in a global gradient object
  setGradient();

  // Set the Background color
  setBgColor();

  // Set the radius
  setRadius(settings_obj["radius"][activeTab]);

  // Set theMax Bar Height
  setBarHeight(settings_obj["barHeight"][activeTab]);

  // Set the bar width based on the size of the canvas;
  setBarWidth();

  // Get the x,y coordinates of each audio bar and store it in a global array
  setAudioBarCoordinates();

  // Begin visualization
  visualize();
}

/**
 * Call to update the visualization dependencies.
 */
function update() {
  // Update the Background color
  setBgColor();

  // Update the radius
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
  setAudioBarCoordinates();

  visualize();
}

/**
 * Render the canvas visualization.
 */
function visualize() {
  // Set the Analyser Node FFT size.
  analyser.fftSize = numBars > 512 ? 4096 : 2048; // If the numBars is large, increase FFT size

  // Buffer Length is half the fft size
  const bufferLength = analyser.frequencyBinCount;
  let dataArray = new Uint8Array(bufferLength);

  // Clear the canvas before render
  canvasCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // The loop function for visualization
  const draw = () => {
    // Before each render check if there is any state changes and act accordingly.
    if (isResizing) {
      return;
    }

    if (updateParams) {
      updateParams = false;
      update();
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

    if (isPaused) {
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

/**
 * --------------------------------------------------------------------------------
 * SETTER FUNCTIONS
 * Set THE values of various canvas and UI dependencies on the basis of the current state.
 * --------------------------------------------------------------------------------
 */

/**
 * Set the size of the canvas based on the current size of the page.
 */
function setCanvasSize() {
  // Get the smaller dimension to use as limit to set canvas size
  let minD = Math.min(CANVAS_CONTAINER_HEIGHT, CANVAS_CONTAINER_WIDTH);

  // Check if there is the extra space needed to fit the drawer else reduce canvas size
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

/**
 * Set the minimum/maximum values for the UI range inputs based on the size of the canvas.
 */
function setDimensions() {
  let max_radius = parseInt(radius_slider["slider"].max, 10),
    max_height = parseInt(barHeight_slider["slider"].max, 10),
    cWidth = (max_radius + max_height + 5) * 2;

  // The 20 is to verify that cWidth can satify first iteration of while loop
  // need to better handle this
  if (cWidth + 20 <= CANVAS_WIDTH) {
    while (cWidth <= CANVAS_WIDTH) {
      max_height += 5;
      max_radius += 5;
      cWidth = (max_radius + max_height + 5) * 2;
    }
  } else if (cWidth - 20 >= CANVAS_WIDTH) {
    while (cWidth >= CANVAS_WIDTH) {
      max_height -= 5;
      max_radius -= 5;

      cWidth = (max_radius + max_height + 5) * 2;
    }
  }

  // Update each Input Range
  updateRadiusSlider(max_radius);
  updateBarHeightSlider(max_height);
  updateNumBarSlider(max_radius);
}

/**
 * Get the (x,y) coordinate of each audio bar.
 * Store it in a global array to use to render each audio bar.
 */
function setAudioBarCoordinates() {
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

/**
 * Set the Width of the audio bar based on the circumference of the circle
 * and the number of bars.
 */
function setBarWidth() {
  // We do numBars*2 to create a bar width of space between each bar
  barWidth = Math.floor((2 * Math.PI * RADIUS) / (numBars * 2));
  barWidth = barWidth <= MIN_BAR_WIDTH ? MIN_BAR_WIDTH : barWidth;
}

/**
 * Create an array to store gradient values for each audio bar.
 * Doing this leads to better render as the code does not need
 * to dynamically calculate every bar's gradient every frame.
 */
function setGradient() {
  GDT = new Array(numBars);

  // Convert the value from the input box to a valid HexString
  let start = picker_map["start_gdt_btn"].toHEXString(),
    end = picker_map["end_gdt_btn"].toHEXString();

  // Change the value in the input box with the updated value
  // This is useful to handle invalid inputs
  input_color_fields["start_gdt"].value = start;
  input_color_fields["end_gdt"].value = end;

  // Push updated data to local storage
  settings_obj["start_gdt"][activeTab] = start;
  settings_obj["end_gdt"][activeTab] = end;

  //Convert the hex data to rgb to create a gradient
  let start_rgb = picker_map["start_gdt_btn"].rgb,
    end_rgb = picker_map["end_gdt_btn"].rgb;

  let halfNumBars = Math.floor(numBars / 2);
  for (let i = 0; i < numBars; i++) {
    //Temporarily store the color code for the i-th audio bar
    let gdt = [0, 0, 0];
    if (i < halfNumBars) {
      gdt = [
        start_rgb[0] + (end_rgb[0] - start_rgb[0]) * (i / (halfNumBars - 1)),
        start_rgb[1] + (end_rgb[1] - start_rgb[1]) * (i / (halfNumBars - 1)),
        start_rgb[2] + (end_rgb[2] - start_rgb[2]) * (i / (halfNumBars - 1)),
      ];
    } else {
      gdt = [
        end_rgb[0] +
          (start_rgb[0] - end_rgb[0]) * ((i % halfNumBars) / (halfNumBars - 1)),
        end_rgb[1] +
          (start_rgb[1] - end_rgb[1]) * ((i % halfNumBars) / (halfNumBars - 1)),
        end_rgb[2] +
          (start_rgb[2] - end_rgb[2]) * ((i % halfNumBars) / (halfNumBars - 1)),
      ];
    }
    //Convert rgb values to integers
    gdt = gdt.map((i) => Math.round(i));

    //Assign it to the global gradient array
    GDT[i] = `rgb(${gdt[0]},${gdt[1]},${gdt[2]})`;
  }
}

/**
 *
 * @param {String} num The value to set as the number of audio bars
 */
function setNumBars(num) {
  num = parseInt(num, 10);
  numBars = num;
  numBars_slider["slider"].value = num;
  settings_obj["numBars"][activeTab] = num;
}

/**
 *
 * @param {String} r The value to set as the radius of the visualization
 */
function setRadius(r) {
  r = parseInt(r, 10);
  RADIUS = r;
  radius_slider["slider"].value = r;
  settings_obj["radius"][activeTab] = r;
}

/**
 *
 * @param {String} num The value to set as the max height of each audio bar
 */
function setBarHeight(num) {
  num = parseInt(num, 10);
  MAX_BAR_HEIGHT = num;
  barHeight_slider["slider"].value = num;
  settings_obj["barHeight"][activeTab] = num;
}

/**
 * Set the background color based on the current value of the jscolor input field
 */
function setBgColor() {
  let color = picker_map["bg_color_btn"].toHEXString();
  page_container.style.background = color;
  canvas.style.background = color;

  input_color_fields["bg_color"].value = color;
  settings_obj["bg_color"][activeTab] = color;

  setContrastColor();
}

/**
 * Set the color of the text on the basis of the background for good contrast
 */
function setContrastColor() {
  // isLight() returns true if the grayscale of the selected color is closer to white than black
  let color = picker_map["bg_color_btn"].isLight() ? "#000000" : "#ffffff";
  document.getElementById("sidenav").style.color = color;

  // toggle color-picker-buttons white/black
  let fillIconURL =
    color === "#ffffff" ? "img/fill-icon-white.png" : "img/fill-icon-black.png";
  color_picker_btns.forEach((btn) => {
    btn.style.backgroundImage = `url(${window.location}${fillIconURL})`;
  });
}

/**
 * Create HTML button elements and map each button to a jscolor instance.
 */
function setUpColorPicker() {
  // if color picker instantiated buttons are present already
  // then iteratively remove each button node from the DOM
  [...document.getElementsByClassName("color-picker-btn")].forEach((btn) => {
    btn.remove();
    color_picker_btns = []; // Reinitialize container to empty array
  });

  // Get each DOM Element where the color picker button element will be appended to
  let cp_initializer = {
    container: [...document.getElementsByClassName("cp-container")],
    cp_btn_id: ["start_gdt_btn", "end_gdt_btn", "bg_color_btn"],
    cp_target_id: ["start_gdt", "end_gdt", "bg_color"],
  };

  for (let i = 0; i < Object.keys(cp_initializer).length; i++) {
    let btn = document.createElement("button");

    btn.className = `color-picker-btn`;
    btn.id = cp_initializer["cp_btn_id"][i];

    cp_initializer["container"][i].appendChild(btn);
    color_picker_btns.push(btn);

    let params = {
        value: "",
        valueElement: cp_initializer["cp_target_id"][i],
        styleElement: cp_initializer["cp_target_id"][i],
        buttonHeight: 12,
        hash: true,
        width: 250,
        height: 150,
        position: "right",
        borderColor: "#FFF",
        insetColor: "#FFF",
        backgroundColor: "#333",
        padding: 32,
      },
      picker = new jscolor(btn, params);

    btn.addEventListener("click", addColorPickerCloseBtn);

    // Create a color picker map, mapping the button id to the picker instance
    picker_map[btn.id] = picker;
  }
}

/**
 * --------------------------------------------------------------------------------
 * END OF SETTER FUNCTIONS
 * --------------------------------------------------------------------------------
 */

/**
 * --------------------------------------------------------------------------------
 * HANDLE USER INTERACTIONS
 * Functions to handle state changes on user interaction
 * --------------------------------------------------------------------------------
 */

/**
 * Toggle full screen based on user interaction
 */
function toggleFullScreen() {
  if (!document.fullscreenElement) {
    canvas.requestFullscreen();
    // Hide the cursor on full screen
    canvas.style.cursor = "none";
    canvas.addEventListener("mousemove", handleMouseMove);
  } else if (document.exitFullscreen) {
    document.exitFullscreen();
    canvas.removeEventListener("mousemove", handleMouseMove);
    // Reset the cursor to default
    canvas.style.cursor = "default";
  }
}

/**
 * Toggle sidenav drawer on user interaction
 */
function toggleDrawer() {
  drawer.style.width = `${DRAWER_WIDTH}px`;
  // Open drawer if closed else close it

  if (isDrawerClosed) {
    clearTimeout(toggleSidenavOptions);
    // Remove a -400px translate from the div and shift the rest of the page 400px
    drawer.style.transform = `translateX(0)`;
    canvas_container.style.marginLeft = `${DRAWER_WIDTH}px`;

    sidenav_options.forEach((btn) => {
      btn.style.display = "none";
    });
  } else {
    // Hide any open pickers on drawer close
    for (let picker in picker_map) {
      picker_map[picker].hide();
    }

    drawer.style.transform = `translateX(-${DRAWER_WIDTH}px)`;
    canvas_container.style.marginLeft = "0";

    // Show the hamburger icon again after 0.5s + 0.05s delay
    // i.e once the drawer is hidden (check ui.css ln 21)
    toggleSidenavOptions = setTimeout(() => {
      sidenav_options.forEach((btn) => {
        btn.style.display = "block";
      });
    }, 550);
  }

  isDrawerClosed = !isDrawerClosed;
}

/**
 * Toggle pause on user interaction
 */
function pauseVisual() {
  isPaused = !isPaused;

  if (!isPaused) {
    update();
  }
}

/**
 * Show the shortcut menu on user interaction
 */
function showShortcutsMenu() {
  if (!isShortcutMenuVisible) {
    shortcut_modal_elems["container"].style.display = "block";
    isShortcutMenuVisible = true;
    isShortcutsEnabled = false;
  }
}

/**
 * Hide the shortcut menu on user interaction
 */
function hideShortcutsMenu() {
  if (isShortcutMenuVisible) {
    shortcut_modal_elems["container"].style.display = "none";
    isShortcutMenuVisible = false;
    isShortcutsEnabled = true;
  }
}

/**
 * Show the reset menu on user interaction
 */
function showResetMenu() {
  if (!isResetMenuVisible) {
    reset_modal_elems["container"].style.display = "block";
    isResetMenuVisible = true;
    isShortcutsEnabled = false;
  }
}

/**
 * Hide the reset menu on user interaction
 */
function hideResetMenu() {
  if (isResetMenuVisible) {
    reset_modal_elems["container"].style.display = "none";
    isResetMenuVisible = false;
    isShortcutsEnabled = true;
  }
}

/**
 * --------------------------------------------------------------------------------
 * END OF USER INTERACTION FUNCTIONS
 * --------------------------------------------------------------------------------
 */

/**
 *
 * @param {Event} e The result of the Keyup event
 */
function keyboardControls(e) {
  if (isShortcutsEnabled && Object.keys(keyMap).length === 1) {
    if (e.key === "p" || e.key === "P") {
      pauseVisual();
    }
    if ((e.key === "f" || e.key === "F") && isDrawerClosed) {
      toggleFullScreen();
    }

    if ((e.key === "D" || e.key === "d") && !isFullScreen) {
      toggleDrawer();
    }
  }

  keyMap = {};
}

/**
 * --------------------------------------------------------------------------------
 * HANDLE LOCAL STORAGE
 * These functions take setting inputs from the user and updates the local storage.
 * --------------------------------------------------------------------------------
 */

/**
 * Initialize local storage with a settings object of default values.
 */
function populateSettings() {
  // The default settings to fall back to
  let initial_settings_obj = {
    bg_color: ["#00000f", "#00000f", "#00000f"],
    start_gdt: ["#26f596", "#26f596", "#26f596"],
    end_gdt: ["#0499f2", "#0499f2", "#0499f2"],
    radius: [140, 140, 140],
    numBars: [150, 150, 150],
    barHeight: [160, 160, 160],
  };
  for (let key in initial_settings_obj) {
    localStorage.setItem(key, JSON.stringify(initial_settings_obj[key]));
  }
}

/**
 * Push the updated values of the settings object to local storage.
 */
function updateSettings() {
  for (let key in settings_obj) {
    localStorage.setItem(key, JSON.stringify(settings_obj[key]));
  }
}

/**
 * Clear local storage.
 */
function clearSettings() {
  localStorage.clear();
}

/**
 * Get the data stored in local storage and return the string as an object.
 */
function getSettings() {
  let settings = {};
  for (let i = 0; i < localStorage.length; i++) {
    let key = localStorage.key(i);
    settings[key] = JSON.parse(localStorage.getItem(key));
  }

  return settings;
}

/**
 * --------------------------------------------------------------------------------
 * END OF LOCAL STORAGE FUNCTIONS
 * --------------------------------------------------------------------------------
 */

/**
 * --------------------------------------------------------------------------------
 * INPUT RANGE SLIDER FUNCTIONS
 * Functions to change input slider values on state change.
 * --------------------------------------------------------------------------------
 */

/**
 * Update the bar height range input.
 * It takes the maximum value for the slider and sets the minimum and current value accordingly.
 * @param {Number} max_height The maximum height value for the bar height slider
 */
function updateBarHeightSlider(max_height) {
  let min = Math.floor(max_height / 3);

  // Round values to multiple of 20 and clamp it against a minimum value of 20
  max_height = max_height > 20 ? max_height - (max_height % 20) : 20;
  min_height = min > 20 ? min - (min % 20) : 20;

  // Update the slider max/min values
  barHeight_slider["slider"].max = max_height;
  barHeight_slider["slider"].min = min_height;

  // Clamp previously user selected bar height against both extremes
  if (MAX_BAR_HEIGHT > max_height) {
    MAX_BAR_HEIGHT = max_height;
  } else if (MAX_BAR_HEIGHT < min_height) {
    MAX_BAR_HEIGHT = min_height;
  }

  barHeight_slider["slider"].value = MAX_BAR_HEIGHT;

  // Update the Slider label with the determined values
  updateSliderLabels(
    barHeight_slider["min_label"],
    barHeight_slider["max_label"],
    min_height,
    max_height
  );
}

/**
 * Update the radius range input.
 * It takes the maximum value for the slider and sets the minimum and current value accordingly.
 * @param {Number} max_radius The maximum radius value for the radius slider
 */
function updateRadiusSlider(max_radius) {
  let min_radius = Math.floor(max_radius * 0.667);

  // Round values to multiple of 20 and clamp it against a minimum value of 20
  max_radius = max_radius > 20 ? max_radius - (max_radius % 20) : 20;
  min_radius = min_radius > 20 ? min_radius - (min_radius % 20) : 20;

  // Update the slider max/min values
  radius_slider["slider"].max = max_radius;
  radius_slider["slider"].min = min_radius;

  // Clamp previously user selected radius against both extremes
  if (RADIUS > max_radius) {
    RADIUS = max_radius;
  } else if (RADIUS < min_radius) {
    RADIUS = min_radius;
  }

  radius_slider["slider"].value = RADIUS;

  // Update the Slider label with the determined values
  updateSliderLabels(
    radius_slider["min_label"],
    radius_slider["max_label"],
    min_radius,
    max_radius
  );
}

/**
 * Update the numBars range input.
 * It takes the maximum value for the slider and sets the minimum and current value accordingly.
 * @param {Number} max_radius The maximum radius value for the radius slider
 */
function updateNumBarSlider(max_radius) {
  let max_circumference = 2 * Math.PI * max_radius,
    min_circumference = 2 * Math.PI * radius_slider["slider"].min,
    max_bars = Math.floor(max_circumference / (MIN_BAR_WIDTH * 2)),
    min_bars = Math.floor(min_circumference / (MAX_BAR_WIDTH * 2));

  // Round value to multiple of 50 and clamp it against a minimum value of 50
  max_bars = max_bars > 50 ? max_bars - (max_bars % 50) : 50;
  min_bars = min_bars > 50 ? min_bars - (min_bars % 50) : 50;

  // Update the slider max/min values
  numBars_slider["slider"].max = max_bars;
  numBars_slider["slider"].min = min_bars;

  // Clamp previously user selected numBars against both extremes
  if (numBars > max_bars) {
    numBars = max_bars;
  } else if (numBars < min_bars) {
    numBars = min_bars;
  }

  numBars_slider["slider"].value = numBars;

  // Update the Slider label with the determined values
  updateSliderLabels(
    numBars_slider["min_label"],
    numBars_slider["max_label"],
    min_bars,
    max_bars
  );
}

/**
 * Update the range input by update the HTML element with a given value
 * @param {HTMLElement} min_label DOM Node containing slider's mininum value label
 * @param {HTMLElement} max_label DOM Node containing slider's maximum value label
 * @param {Number} min_label_data New data value that will replace old minimum label value
 * @param {Number} max_label_data New data value that will replace old maximum label value
 */
function updateSliderLabels(
  min_label,
  max_label,
  min_label_data,
  max_label_data
) {
  max_label.removeChild(max_label.firstChild);
  min_label.removeChild(min_label.firstChild);

  let maxTextNode = document.createTextNode(max_label_data);
  let minTextNode = document.createTextNode(min_label_data);

  max_label.appendChild(maxTextNode);
  min_label.appendChild(minTextNode);
}

/**
 * --------------------------------------------------------------------------------
 * END OF INPUT RANGE SLIDER FUNCTIONS
 * --------------------------------------------------------------------------------
 */

/**
 * --------------------------------------------------------------------------------
 * HELPER FUNCTIONS
 * --------------------------------------------------------------------------------
 */

/**
 * Draw each individual audio bar in the provide canvas context
 * @param {CanvasRenderingContext2D} ctx The current canvas context
 * @param {Array} point A 2-D array containing the starting position of the audio bar.
 * @param {Number} degree The degree to which the audio bar should be rotated. Value in degrees.
 * @param {String} color A string in RGB(...) format to set as fill color for the audio bar.
 */
function drawAudioBar(ctx, point, degree, color) {
  ctx.save();
  ctx.translate(point[0], point[1]);
  ctx.rotate((degree * Math.PI) / 180);
  roundRect(ctx, -barWidth / 2, 0, barWidth, barHeight, 2, color);
  ctx.restore();
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

/**
 * Append a close button to the currently open jscolor instance.
 */
function addColorPickerCloseBtn() {
  // Append a custom close button to the color_picker on the fly
  let jscolor_picker = document.getElementsByClassName("jscolor-picker")[0],
    close_btn = document.createElement("button");

  jscolor_picker.appendChild(close_btn);

  // Set styles for close button
  let styles = {
    width: "14px",
    height: "14px",
    cursor: "pointer",
    border: "none",
    outline: "none",
    background: "no-repeat",
    "background-size": "contain",
    "background-image": `url(${window.location}img/cross.png)`,
    right: "8px",
    top: "8px",
    "z-index": 1000,
    position: "absolute",
  };

  Object.assign(close_btn.style, styles);
}

/**
 * In fullscreen mode, show the cursor on mousemove, else hide it after 500ms
 */
function handleMouseMove() {
  clearTimeout(mouseMoveEnd);
  canvas.style.cursor = "default";

  mouseMoveEnd = setTimeout(() => {
    canvas.style.cursor = "none";
  }, 500);
}

/**
 * --------------------------------------------------------------------------------
 * END OF HELPER FUNCTIONS
 * --------------------------------------------------------------------------------
 */
