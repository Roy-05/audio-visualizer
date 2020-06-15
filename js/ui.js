const hamburger = document.getElementById("hamburger"),
  closebtn = document.getElementById("closebtn"),
  submit = document.getElementById("submit"),
  drawer = document.getElementById("drawer"),
  canvasCtr = document.getElementById("canvas-container"),
  start_gdt = document.getElementById("start_gdt_data"),
  end_gdt = document.getElementById("end_gdt_data");

let drawerIsClosed = true;

hamburger.addEventListener("click", () => {
  toggleDrawer();
});

closebtn.addEventListener("click", () => {
  toggleDrawer();
});

submit.addEventListener("click", () => {
  setGradient(start_gdt.value, end_gdt.value);
  init();
});
document.addEventListener("keydown", (e) => {
  if (
    (e.key === "Escape" || e.key === "f" || e.key === "F") &&
    drawerIsClosed
  ) {
    toggleFullScreen();
  }

  if (e.key === "Enter" && !drawerIsClosed) {
    //no-op
  }
});

function toggleFullScreen() {
  if (!document.fullscreenElement) {
    canvas.requestFullscreen();
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }
}

function toggleDrawer() {
  // Open drawer if closed else close it
  if (drawerIsClosed) {
    drawer.style.width = "300px";
    canvasCtr.style.marginLeft = "300px";
    drawerIsClosed = !drawerIsClosed;
  } else {
    drawer.style.width = "0";
    canvasCtr.style.marginLeft = "0";
    drawerIsClosed = !drawerIsClosed;
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
