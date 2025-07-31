let currentVisibleID = "A";
const fadeDelay = 2900;

function triggerFadeIn(elementID) {
  document.getElementById(elementID).classList.remove("fadeInImage");
  document.getElementById(elementID).classList.add("fadeInImage");
}
function triggerFadeOut(elementID) {
  document.getElementById(elementID).classList.remove("fadeOutImage");
  document.getElementById(elementID).classList.add("fadeOutImage");
}

function slideHandler() {
  let fadeInID = "";
  let fadeOutID = "";
  if (currentVisibleID == "A") {
    fadeInID = "img-B";
    fadeOutID = "img-A";
    currentVisibleID = "B";
  } else {
    fadeInID = "img-A";
    fadeOutID = "img-B";
    currentVisibleID = "A";
  }

  triggerFadeOut(fadeOutID);
  window.setTimeout(() => {
    document.getElementById(fadeOutID).classList.add("hidden");
    document.getElementById(fadeOutID).classList.remove("fadeOutImage");
  }, fadeDelay);

  triggerFadeIn(fadeInID);
  window.setTimeout(() => {
    document.getElementById(fadeInID).classList.remove("hidden");
    document.getElementById(fadeInID).classList.remove("fadeInImage");
  }, fadeDelay);
}

function initPage() {
  document.getElementById("img-A").classList.add("fadeInImage");
  window.setTimeout(() => {
    document.getElementById("img-A").classList.remove("hidden");
    document.getElementById("img-A").classList.remove("fadeInImage");
  }, fadeDelay);
}

initPage();
window.setInterval(slideHandler, 10 * 1000);
