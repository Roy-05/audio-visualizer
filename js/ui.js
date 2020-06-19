const hamburger = document.getElementById("hamburger"),
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
  color_picker_btns = [...document.getElementsByClassName("color-picker-btn")],
  input_color_fields = [start_gdt, end_gdt, bg_color];

let drawerIsClosed = true,
  updateParams = false,
  isFullScreen = false,
  isShortcutsEnabled = true,
  showColorPicker = true,
  picker_map = {};

let settings_obj = {
  bg_color: bg_color.value,
  start_gdt: start_gdt.value,
  end_gdt: end_gdt.value,
  radius: parseInt(radius_slider.value, 10),
  numBars: parseInt(audio_slider.value, 10),
};

hamburger.addEventListener("click", () => {
  toggleDrawer();
});

input_fields.forEach((elem) => {
  elem.addEventListener("focus", () => {
    isShortcutsEnabled = false;
  });
  elem.addEventListener("blur", () => {
    isShortcutsEnabled = true;
  });
});

// color_picker_btns.forEach((btn) => {
//   btn.addEventListener("click", () => {
//     toggleColorPicker(btn);
//   });
// });

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
  // Open drawer if closed else close it
  if (drawerIsClosed) {
    console.log("fire");
    // Remove a -400px translate from the div and shift the rest of the page 400px
    drawer.style.transform = `translateX(0)`;
    canvasCtr.style.marginLeft = DRAWER_WIDTH;

    hamburger.style.display = "none";
  } else {
    drawer.style.transform = `translateX(-${DRAWER_WIDTH})`;
    canvasCtr.style.marginLeft = "0";

    // Show the hamburger icon again after 0.5s + 0.05s delay
    // i.e once the drawer is hidden (check ui.css ln 21)
    window.setTimeout(() => {
      hamburger.style.display = "flex";
    }, 550);
  }

  drawerIsClosed = !drawerIsClosed;
}

/**
 * Create an array to store gradient values for each audio bar.
 * Doing this leads to better render as the code does not need
 * to dynamically calculate every bar's gradient every frame.
 */
function setGradient() {
  GDT = new Array(numBars);

  // Convert the value from the input box to a valid HexString
  let start = picker_map["start_gdt"].toHEXString(),
    end = picker_map["end_gdt"].toHEXString();

  // Change the value in the input box with the updated value
  // This is useful to handle invalid inputs
  start_gdt.value = start;
  end_gdt.value = end;

  // Push updated data to local storage
  updateSettings("start_gdt", start);
  updateSettings("end_gdt", end);

  //Convert the hex data to rgb to create a gradient
  let start_rgb = picker_map["start_gdt"].rgb,
    end_rgb = picker_map["end_gdt"].rgb;

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

function setBgColor() {
  let color = picker_map["bg_color"].toHEXString();
  page_container.style.background = color;
  canvas.style.background = color;

  bg_color.value = color;
  updateSettings("bg_color", color);

  setContrastColor();
}

function keyboardControls(e) {
  if (isShortcutsEnabled) {
    if ((e.key === "f" || e.key === "F") && drawerIsClosed) {
      toggleFullScreen();
    }

    if ((e.key === "D" || e.key === "d") && !isFullScreen) {
      toggleDrawer();
    }
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
  let color = picker_map["bg_color"].isLight() ? "#000000" : "#ffffff";
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
      closable: true,
      hash: true,
      width: 250,
      height: 150,
      position: "right",
      borderColor: "#FFF",
      insetColor: "#FFF",
      backgroundColor: "#333",
    };

    let picker = new jscolor(color_picker_btns[i], params);
    picker_map[elem.id] = picker;
  });
}

function toggleColorPicker(elem) {
  if (showColorPicker) {
    // Edit the default close button with a custom close button
    let cpCloseBtn = document.getElementsByClassName("jscolor-btn-close")[0];

    cpCloseBtn.id = "cp-close-btn";
    cpCloseBtn.style.backgroundImage = `url(${window.location}img/cross.png)`;
    if (cpCloseBtn.hasChildNodes()) {
      cpCloseBtn.removeChild(cpCloseBtn.firstChild);
    }
  }
}
