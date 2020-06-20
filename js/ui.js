const sidenav_options = [...document.getElementsByClassName("sidenav-options")],
  closebtn = document.getElementById("closebtn"),
  submit = document.getElementById("submit"),
  drawer = document.getElementById("drawer"),
  canvasCtr = document.getElementById("canvas-container"),
  settings = [...document.getElementsByClassName("settings")],
  input_fields = [...document.getElementsByTagName("input")],
  start_gdt = document.getElementById("start_gdt"),
  end_gdt = document.getElementById("end_gdt"),
  bg_color = document.getElementById("bg_color"),
  audio_slider = document.getElementById("audio_slider"),
  radius_slider = document.getElementById("radius_slider"),
  bar_height_slider = document.getElementById("bar_height_slider"),
  color_picker_btns = [...document.getElementsByClassName("color-picker-btn")],
  input_color_fields = [start_gdt, end_gdt, bg_color];

let isDrawerClosed = true,
  updateParams = false,
  isFullScreen = false,
  isShortcutsEnabled = true,
  showColorPicker = true,
  isPaused = false,
  picker_map = {};

let settings_obj = {
  bg_color: bg_color.value,
  start_gdt: start_gdt.value,
  end_gdt: end_gdt.value,
  radius: parseInt(radius_slider.value, 10),
  numBars: parseInt(audio_slider.value, 10),
  barHeight: parseInt(bar_height_slider.value, 10),
};

let toggleSidenavOptions;

sidenav_options.forEach((btn) => {
  btn.addEventListener("click", () => {
    if (btn.id === "hamburger") {
      toggleDrawer();
    }
  });

  btn.addEventListener("mouseenter", () => {
    let color = picker_map["bg_color_btn"].rgb;
    color = color.map((rgb) => 255 - rgb);
    color = `rgb(${color[0]},${color[1]},${color[2]})`;
    btn.style.color = color;
  });

  btn.addEventListener("mouseleave", () => {
    btn.style.color = "inherit";
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
    canvas.style.cursor = "none";
  } else if (document.exitFullscreen) {
    document.exitFullscreen();
    canvas.style.removeProperty("cursor");
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
        btn.style.display = "flex";
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
  updateSettings("start_gdt", start);
  updateSettings("end_gdt", end);

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
      console;
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
  numBars = parseInt(num, 10);
  audio_slider.value = num;
  updateSettings("numBars", num);
}

function setRadius(r) {
  RADIUS = parseInt(r, 10);
  radius_slider.value = r;
  updateSettings("radius", r);
}

function setBarHeight(num) {
  MAX_BAR_HEIGHT = parseInt(num, 10);
  bar_height_slider.value = num;
  updateSettings("barHeight", num);
}
function setBgColor() {
  let color = picker_map["bg_color_btn"].toHEXString();
  page_container.style.background = color;
  canvas.style.background = color;

  bg_color.value = color;
  updateSettings("bg_color", color);

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
function populateSettings() {
  for (let key in settings_obj) {
    updateSettings(key, settings_obj[key]);
  }
}
function updateSettings(key, val) {
  localStorage.setItem(key, val);
}

function clearSettings() {
  localStorage.clear();
}

function getSetting(key) {
  return localStorage.getItem(key);
}

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
  input_color_fields.forEach((elem, i) => {
    let params = {
      valueElement: elem,
      styleElement: elem,
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

    let picker = new jscolor(color_picker_btns[i], params);
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
  let min = Math.floor(max_height / 2);
  min = min - (min % 10);
  bar_height_slider.max = max_height;
  bar_height_slider.min = min;

  // Clamp bar height to both extremes
  if (MAX_BAR_HEIGHT > max_height) {
    MAX_BAR_HEIGHT = max_height;
  } else if (MAX_BAR_HEIGHT < min) {
    MAX_BAR_HEIGHT = min;
  }

  bar_height_slider.value = MAX_BAR_HEIGHT;

  let min_val_label = document.getElementById("min_bar_height"),
    max_val_label = document.getElementById("max_bar_height");

  min_val_label.removeChild(min_val_label.firstChild);
  max_val_label.removeChild(max_val_label.firstChild);

  let minTextNode = document.createTextNode(min);
  let maxTextNode = document.createTextNode(max_height);

  min_val_label.appendChild(minTextNode);
  max_val_label.appendChild(maxTextNode);
}

function updateRadiusSlider(max_radius) {
  let min = Math.floor(max_radius * 0.667);
  min = min - (min % 10);
  radius_slider.max = max_radius;
  radius_slider.min = min;
  if (RADIUS > max_radius) {
    RADIUS = max_radius;
  } else if (RADIUS < max_radius) {
    RADIUS = min;
  }

  radius_slider.value = RADIUS;

  let min_val_label = document.getElementById("min_radius"),
    max_val_label = document.getElementById("max_radius");

  min_val_label.removeChild(min_val_label.firstChild);
  max_val_label.removeChild(max_val_label.firstChild);

  let minTextNode = document.createTextNode(min);
  let maxTextNode = document.createTextNode(max_radius);

  min_val_label.appendChild(minTextNode);
  max_val_label.appendChild(maxTextNode);
}
