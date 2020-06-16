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
  let validHex = /^#?[\dA-F]{6}$/i;

  if (validHex.test(start)) {
    let result = /^#?([A-F\d]{2})([A-F\d]{2})([A-F\d]{2})$/i.exec(start);
    console.log(result);
    RGB["r1"] = parseInt(result[1], 16);
    RGB["g1"] = parseInt(result[2], 16);
    RGB["b1"] = parseInt(result[3], 16);
  } else {
    console.error("Invalid Value");
    RGB["r2"] = 38;
    RGB["g2"] = 245;
    RGB["b2"] = 150;
  }
  if (validHex.test(end)) {
    let result = /^#?([A-F\d]{2})([A-F\d]{2})([A-F\d]{2})$/i.exec(end);
    RGB["r2"] = parseInt(result[1], 16);
    RGB["g2"] = parseInt(result[2], 16);
    RGB["b2"] = parseInt(result[3], 16);
  } else {
    console.error("Invalid Value");
    RGB["r2"] = 4;
    RGB["g2"] = 153;
    RGB["b2"] = 242;
  }
}
