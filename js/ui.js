const hamburger = document.getElementById("hamburger"),
  closebtn = document.getElementById("closebtn"),
  submit = document.getElementById("submit"),
  drawer = document.getElementById("drawer"),
  canvasCtr = document.getElementById("canvas-container"),
  settings = [...document.getElementsByClassName("settings")],
  text_input = [...document.getElementsByTagName("input")],
  start_gdt = document.getElementById("start_gdt"),
  end_gdt = document.getElementById("end_gdt"),
  bg_color = document.getElementById("bg_color"),
  audio_slider = document.getElementById("audio_slider"),
  radius_slider = document.getElementById("radius_slider");

let drawerIsClosed = true,
  updateParams = false,
  isFullScreen = false;

hamburger.addEventListener("click", () => {
  toggleDrawer();
});

text_input.forEach((elem) => {
  if (elem.type === "text") {
    elem.addEventListener("focus", () => {
      document.removeEventListener("keydown", (e) => {
        keyboardControls(e);
      });
    });

    elem.addEventListener("blur", () => {
      document.addEventListener("keydown", (e) => {
        keyboardControls(e);
      });
    });
  }
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
  } else if (document.exitFullscreen) {
    document.exitFullscreen();
  }
}

function toggleDrawer() {
  // Open drawer if closed else close it
  if (drawerIsClosed) {
    drawer.style.width = "300px";
    canvasCtr.style.marginLeft = "300px";
  } else {
    drawer.style.width = "0";
    canvasCtr.style.marginLeft = "0";
  }

  drawerIsClosed = !drawerIsClosed;
}

/**
 *
 * @param {*} color
 */
function isValidHex(color) {
  let validHex = /^#?[\dA-F]{6}$/i;

  return validHex.test(color) ? true : false;
}

/**
 *
 * @param {*} hexColor
 */
function HexToRGB(hexColor) {
  /* 
  Executing the regex returns an array of 4 elements where the first elem is the 
  input itself so we splice it and take the next 3. We then convert each element 
  to the corresponding integer and return the result array.
  */
  return /^#?([A-F\d]{2})([A-F\d]{2})([A-F\d]{2})$/i
    .exec(hexColor)
    .splice(1, 4)
    .map((hex) => parseInt(hex, 16));
}

/**
 *
 * Create an array to store gradient values for each audio bar.
 * Doing this leads to faster render as the code does not need
 * to dynamically calculate each gradient every frame.
 * @param {Number} start
 * @param {Number} end
 */
function setGradient(start, end) {
  GDT = new Array(numBars);

  let start_rgb = [],
    end_rgb = [];

  // Validate if input is hex color code
  if (isValidHex(start)) {
    start_rgb = HexToRGB(start);
  } else {
    // Initialize to the default values
    start_rgb = [38, 245, 150];
    start_gdt.value = "#26F596";
    console.error(`Invalid Input ${start}`);
  }

  if (isValidHex(end)) {
    end_rgb = HexToRGB(end);
  } else {
    end_rgb = [4, 153, 242];
    end_gdt.value = "#0499F2";
    console.error(`Invalid Input ${end}`);
  }

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
  numBars = num;
}

function setRadius(r) {
  RADIUS = r;
}

function setBgColor(color) {
  if (isValidHex(color)) {
    //Check if the hexcode starts with a #, if not, add it
    color = color.slice(0) === "#" ? color : "#" + color;

    document.getElementsByTagName("body")[0].style.background = color;
    canvas.style.background = color;
  } else {
    document.getElementsByTagName("body")[0].style.background = "#00000f";
    canvas.style.background = "#00000f";
    bg_color.value("#00000f");

    console.error(`Invalid Hex Code: ${color}`);
  }
}

function keyboardControls(e) {
  if ((e.key === "f" || e.key === "F") && drawerIsClosed) {
    toggleFullScreen();
  }

  if ((e.key === "D" || e.key === "d") && !isFullScreen) {
    toggleDrawer();
  }
}
