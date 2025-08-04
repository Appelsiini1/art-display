let currentVisibleID = "A";
const fadeDelay = 2900;
const slideInterval = 10;
const windowHeight = document.getElementById("img-container").clientHeight;
const windowWidth = document.getElementById("img-container").clientWidth;

function getClassList(elementID) {
  return document.getElementById(elementID).classList;
}

function triggerFadeIn(elementID) {
  getClassList(elementID).remove("fadeInImage");
  getClassList(elementID).add("fadeInImage");
}
function triggerFadeOut(elementID) {
  getClassList(elementID).remove("fadeOutImage");
  getClassList(elementID).add("fadeOutImage");
}

function setImgDimensions(elementID) {
  const element = document.getElementById(elementID);
  const height = element.naturalHeight;
  const width = element.naturalWidth;
  //console.log(`Height: ${element.naturalHeight}`);
  //console.log(`Width: ${element.naturalHeight}`);
  if (height < windowHeight && width < windowWidth) {
    if (height > width) {
      element.style.height = "100%";
      element.style.width = "auto";
      //element.height = window.screen.availHeight;
      //element.removeAttribute("width");
    } else {
      element.style.width = "100%";
      element.style.height = "auto";
    }
  } else {
    element.style.height = "auto";
    element.style.width = "auto";
  }
}

function setImgPosition(elementID) {
  const element = document.getElementById(elementID);
  const height = element.clientHeight;
  const width = element.clientWidth;

  const diffHeight = windowHeight - height;
  const diffWidth = windowWidth - width;

  if (diffHeight == 0) {
    element.style.setProperty("top", "0px", "important");
  } else if (diffHeight > 0) {
    element.style.setProperty(
      "top",
      Math.floor(diffHeight / 2).toString() + "px",
      "important"
    );
  }

  if (diffWidth == 0) {
    element.style.setProperty("left", "0px", "important");
  } else if (diffWidth > 0) {
    element.style.setProperty(
      "left",
      Math.floor(diffWidth / 2).toString() + "px",
      "important"
    );
  }
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
    getClassList(fadeOutID).add("hidden");
    getClassList(fadeOutID).remove("fadeOutImage");
  }, fadeDelay);

  setImgDimensions(fadeInID);
  setImgPosition(fadeInID);
  triggerFadeIn(fadeInID);
  window.setTimeout(() => {
    getClassList(fadeInID).remove("hidden");
    getClassList(fadeInID).remove("fadeInImage");
  }, fadeDelay);
}

function initPage() {
  console.log(window.screen.availHeight);
  console.log(window.screen.availWidth);
  setImgDimensions("img-A");
  setImgPosition("img-A");
  setImgDimensions("img-B");

  getClassList("img-A").add("fadeInImage");
  window.setTimeout(() => {
    getClassList("img-A").remove("hidden");
    getClassList("img-A").remove("fadeInImage");
  }, fadeDelay);
}

initPage();
window.setInterval(slideHandler, slideInterval * 1000);
