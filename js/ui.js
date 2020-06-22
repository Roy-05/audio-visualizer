const sidenav_options = [...document.getElementsByClassName("sidenav-options")],
  settings_tabs = [...document.getElementsByClassName("tabs")],
  closebtn = document.getElementById("closebtn"),
  submit = document.getElementById("submit"),
  drawer = document.getElementById("drawer"),
  canvasCtr = document.getElementById("canvas-container"),
  settings = [...document.getElementsByClassName("settings")],
  input_fields = [...document.getElementsByTagName("input")],
  start_gdt = document.getElementById("start_gdt"),
  end_gdt = document.getElementById("end_gdt"),
  bg_color = document.getElementById("bg_color"),
  input_color_fields = [start_gdt, end_gdt, bg_color],
  audio_slider = document.getElementById("audio_slider"),
  radius_slider = document.getElementById("radius_slider"),
  bar_height_slider = document.getElementById("bar_height_slider"),
  min_barH_label = document.getElementById("min_bar_height"),
  max_barH_label = document.getElementById("max_bar_height"),
  min_radius_label = document.getElementById("min_radius"),
  max_radius_label = document.getElementById("max_radius"),
  min_numB_label = document.getElementById("min_num_bars"),
  max_numB_label = document.getElementById("max_num_bars");

let isDrawerClosed = true,
  updateParams = false,
  isFullScreen = false,
  isShortcutsEnabled = true,
  showColorPicker = true,
  isPaused = false,
  picker_map = {},
  color_picker_btns = [];

let initial_settings_obj = {
  bg_color: Array(3).fill(bg_color.value),
  start_gdt: Array(3).fill(start_gdt.value),
  end_gdt: Array(3).fill(end_gdt.value),
  radius: Array(3).fill(parseInt(radius_slider.value, 10)),
  numBars: Array(3).fill(parseInt(audio_slider.value, 10)),
  barHeight: Array(3).fill(parseInt(bar_height_slider.value, 10)),
};

let toggleSidenavOptions,
  activeTab = 0,
  switchTabs = false;

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

sidenav_options.forEach((btn) => {
  btn.addEventListener("click", () => {
    if (btn.id === "hamburger") {
      toggleDrawer();
    } else if (btn.id === "source") {
      window.location.href = "https://github.com/Roy-05/audio-visualizer";
    }
  });

  btn.addEventListener("mouseenter", () => {
    btn.classList.add("hover");
  });

  btn.addEventListener("mouseleave", () => {
    btn.classList.remove("hover");
  });
});

input_fields.forEach((elem) => {
  elem.addEventListener("focus", () => {
    isShortcutsEnabled = false;
  });
  elem.addEventListener("blur", () => {
    isShortcutsEnabled = true;
  });
});

color_picker_btns.forEach((btn) => {
  btn.addEventListener("click", () => {
    toggleColorPicker();
  });
});

document.addEventListener("keydown", (e) => {
  keyboardControls(e);
});

closebtn.addEventListener("click", () => {
  toggleDrawer();
});

settings.forEach((elem) => {
  elem.addEventListener("change", () => {
    updateParams = true;
  });
});

canvas.addEventListener("fullscreenchange", () => {
  isFullScreen = !isFullScreen;
});

function toggleFullScreen() {
  if (!document.fullscreenElement) {
    canvas.requestFullscreen();
    // canvas.style.cursor = "none";
  } else if (document.exitFullscreen) {
    document.exitFullscreen();
    // canvas.style.removeProperty("cursor");
  }
}

function toggleDrawer() {
  drawer.style.width = `${DRAWER_WIDTH}px`;
  // Open drawer if closed else close it

  if (isDrawerClosed) {
    clearTimeout(toggleSidenavOptions);
    // Remove a -400px translate from the div and shift the rest of the page 400px
    drawer.style.transform = `translateX(0)`;
    canvasCtr.style.marginLeft = `${DRAWER_WIDTH}px`;

    sidenav_options.forEach((btn) => {
      btn.style.display = "none";
    });
  } else {
    // Hide any open pickers on drawer close
    for (let picker in picker_map) {
      picker_map[picker].hide();
    }

    drawer.style.transform = `translateX(-${DRAWER_WIDTH}px)`;
    canvasCtr.style.marginLeft = "0";

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
  start_gdt.value = start;
  end_gdt.value = end;

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

function setNumBars(num) {
  num = parseInt(num, 10);
  numBars = num;
  audio_slider.value = num;
  settings_obj["numBars"][activeTab] = num;
}

function setRadius(r) {
  r = parseInt(r, 10);
  RADIUS = r;
  radius_slider.value = r;
  settings_obj["radius"][activeTab] = r;
}

function setBarHeight(num) {
  num = parseInt(num, 10);
  MAX_BAR_HEIGHT = num;
  bar_height_slider.value = num;
  settings_obj["barHeight"][activeTab] = num;
}

function setBgColor() {
  let color = picker_map["bg_color_btn"].toHEXString();
  page_container.style.background = color;
  canvas.style.background = color;

  bg_color.value = color;
  settings_obj["bg_color"][activeTab] = color;

  setContrastColor();
}

function keyboardControls(e) {
  if (isShortcutsEnabled) {
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
}

function pauseVisual() {
  isPaused = !isPaused;

  if (!isPaused) {
    update();
  }
}

/**
 * --------------------------------------------------------------------------------
 * HANDLE LOCAL STORAGE
 * These functions take setting inputs from the user and updates the local storage.
 * --------------------------------------------------------------------------------
 */

function populateSettings() {
  for (let key in initial_settings_obj) {
    localStorage.setItem(key, JSON.stringify(initial_settings_obj[key]));
  }
}

function updateSettings() {
  for (let key in settings_obj) {
    localStorage.setItem(key, JSON.stringify(settings_obj[key]));
  }
}

function clearSettings() {
  localStorage.clear();
}

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
 * END LOCAL STORAGE FUNCTIONS
 * --------------------------------------------------------------------------------
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

function setUpColorPicker() {
  // Check if color picker instantiated buttons are present already
  let cp_btns = [...document.getElementsByClassName("color-picker-btn")];

  // if there are then iteratively remove each button node from the DOM
  cp_btns.forEach((btn) => {
    btn.remove();
    color_picker_btns = []; // Reinitialize container to empty array
  });

  // Get each DOM Element where the color picker button element will be appended to
  let cp_btn_containers = [...document.getElementsByClassName("cp-container")],
    cp_btn_ids = ["start_gdt_btn", "end_gdt_btn", "bg_color_btn"];

  // Iteratively create a color picker button and append it to the DOM container element
  cp_btn_containers.forEach((container, i) => {
    let btn = document.createElement("button");

    btn.className = "color-picker-btn";
    btn.id = cp_btn_ids[i];

    container.appendChild(btn);
    color_picker_btns.push(btn); // Add it to our global array of color picker elements
  });

  // Set up jscolor parameters for each button mapping them to the corresponding input field
  input_color_fields.forEach((elem, i) => {
    let params = {
      value: "",
      valueElement: elem, // these two parmas indicates the element
      styleElement: elem, // to which the color picker will be mapped to
      buttonHeight: 12,
      hash: true,
      width: 250,
      height: 150,
      position: "right",
      borderColor: "#FFF",
      insetColor: "#FFF",
      backgroundColor: "#333",
      padding: 32,
    };

    // Create a new jscolor instance for each color picker button
    let picker = new jscolor(color_picker_btns[i], params);

    // Create a color picker map, mapping the button id to the picker instance
    picker_map[color_picker_btns[i].id] = picker;
  });
}

function toggleColorPicker() {
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

function updateBarHeightSlider(max_height) {
  let min = Math.floor(max_height / 3);
  max_height = max_height - (max_height % 20);
  min_height = min - (min % 20);
  min_height = min < 10 ? 10 : min_height;
  bar_height_slider.max = max_height;
  bar_height_slider.min = min_height;

  // Clamp bar height to both extremes
  if (MAX_BAR_HEIGHT > max_height) {
    MAX_BAR_HEIGHT = max_height;
  } else if (MAX_BAR_HEIGHT < min_height) {
    MAX_BAR_HEIGHT = min_height;
  }

  bar_height_slider.value = MAX_BAR_HEIGHT;

  updateSliderLabels(min_barH_label, max_barH_label, min_height, max_height);
}

function updateRadiusSlider(max_radius) {
  let min_radius = Math.floor(max_radius * 0.667);
  max_radius = max_radius - (max_radius % 20);
  min_radius = min_radius - (min_radius % 20);
  radius_slider.max = max_radius;
  radius_slider.min = min_radius;
  if (RADIUS > max_radius) {
    RADIUS = max_radius;
  } else if (RADIUS < min_radius) {
    RADIUS = min_radius;
  }

  radius_slider.value = RADIUS;

  updateSliderLabels(
    min_radius_label,
    max_radius_label,
    min_radius,
    max_radius
  );
}

function updateNumBarSlider(max_radius) {
  let max_circumference = 2 * Math.PI * max_radius,
    min_circumference = 2 * Math.PI * radius_slider.min;
  let max_bars = Math.floor(max_circumference / (MIN_BAR_WIDTH * 2)),
    min_bars = Math.floor(min_circumference / (MAX_BAR_WIDTH * 2));

  max_bars = max_bars - (max_bars % 50);
  min_bars = min_bars - (min_bars % 50);
  min_bars = min_bars < 50 ? 50 : min_bars;

  audio_slider.max = max_bars;
  audio_slider.min = min_bars;

  if (numBars > max_bars) {
    numBars = max_bars;
  } else if (numBars < min_bars) {
    numBars = min_bars;
  }

  audio_slider.value = numBars;

  updateSliderLabels(min_numB_label, max_numB_label, min_bars, max_bars);
}

/**
 *
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
