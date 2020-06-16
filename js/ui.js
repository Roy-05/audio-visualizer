const hamburger = document.getElementById("hamburger"),
  closebtn = document.getElementById("closebtn"),
  submit = document.getElementById("submit"),
  drawer = document.getElementById("drawer"),
  canvasCtr = document.getElementById("canvas-container"),
  settings = [...document.getElementsByClassName("settings")],
  start_gdt = document.getElementById("start_gdt"),
  end_gdt = document.getElementById("end_gdt"),
  audio_slider = document.getElementById("audio_slider"),
  radius_slider = document.getElementById("radius_slider");

let drawerIsClosed = true,
  updateParams = false,
  isFullScreen = false;

hamburger.addEventListener("click", () => {
  toggleDrawer();
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

  console.log(
    `isFullScreen: ${isFullScreen}, drawerIsClosed: ${drawerIsClosed}`
  );
});

document.addEventListener("keydown", (e) => {
  if ((e.key === "f" || e.key === "F") && drawerIsClosed) {
    toggleFullScreen();
  }

  if ((e.key === "D" || e.key === "d") && !isFullScreen) {
    toggleDrawer();
  }

  console.log(
    `isFullScreen: ${isFullScreen}, drawerIsClosed: ${drawerIsClosed}`
  );
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

// Create an array of gradient values for each audio bar
// Doing it on DOMContentLoad provides improved visualization as
// the code does not need to dynamically calculate each gradient every frame
function setGradient(start, end) {
  GDT = new Array(numBars);

  let validHex = /^#?[\dA-F]{6}$/i,
    start_rgb = { r: 0, g: 0, b: 0 },
    end_rgb = { r: 0, g: 0, b: 0 };

  // Validate if input is hex color code
  if (validHex.test(start)) {
    let result = /^#?([A-F\d]{2})([A-F\d]{2})([A-F\d]{2})$/i.exec(start);
    start_rgb["r"] = parseInt(result[1], 16);
    start_rgb["g"] = parseInt(result[2], 16);
    start_rgb["b"] = parseInt(result[3], 16);
  } else {
    // Initialize to the default values
    start_rgb["r"] = 38;
    start_rgb["g"] = 245;
    start_rgb["b"] = 150;
    start_gdt.value = "26F596";
    console.error("Invalid Value");
  }

  if (validHex.test(end)) {
    let result = /^#?([A-F\d]{2})([A-F\d]{2})([A-F\d]{2})$/i.exec(end);
    end_rgb["r"] = parseInt(result[1], 16);
    end_rgb["g"] = parseInt(result[2], 16);
    end_rgb["b"] = parseInt(result[3], 16);
  } else {
    end_rgb["r"] = 4;
    end_rgb["g"] = 153;
    end_rgb["b"] = 242;
    end_gdt.value = "0499F2";
    console.error("Invalid Value");
  }

  let halfNumBars = Math.floor(numBars / 2);
  for (let i = 0; i < numBars; i++) {
    //Temporarily store the color code for the i-th audio bar
    let gdt = [0, 0, 0];
    if (i < halfNumBars) {
      gdt = [
        start_rgb["r"] +
          (end_rgb["r"] - start_rgb["r"]) * (i / (halfNumBars - 1)),
        start_rgb["g"] +
          (end_rgb["g"] - start_rgb["g"]) * (i / (halfNumBars - 1)),
        start_rgb["b"] +
          (end_rgb["b"] - start_rgb["b"]) * (i / (halfNumBars - 1)),
      ];
      console;
    } else {
      gdt = [
        end_rgb["r"] +
          (start_rgb["r"] - end_rgb["r"]) *
            ((i % halfNumBars) / (halfNumBars - 1)),
        end_rgb["g"] +
          (start_rgb["g"] - end_rgb["g"]) *
            ((i % halfNumBars) / (halfNumBars - 1)),
        end_rgb["b"] +
          (start_rgb["b"] - end_rgb["b"]) *
            ((i % halfNumBars) / (halfNumBars - 1)),
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
