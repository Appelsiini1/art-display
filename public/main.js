let currentVisibleID = "A";
const fadeDelay = 2900;
const slideInterval = 900;
const windowHeight = document.getElementById("img-container").clientHeight;
const windowWidth = document.getElementById("img-container").clientWidth;
//const apiURL = "http://localhost:9000";
const apiURL = "http://starlight-rise:54560";

let blobA = null;
let blobB = null;

let imgInfoA = null;
let imgInfoB = null;

const artistEL = document.getElementById("artist");
const fileEL = document.getElementById("file");
const ratingEL = document.getElementById("rating");
const typeEL = document.getElementById("type-field");

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

function revokeBlobURL(elementID) {
  switch (elementID) {
    case "A":
      blobA ? URL.revokeObjectURL(blobA) : null;
      break;
    case "B":
      blobB ? URL.revokeObjectURL(blobB) : null;
  }
}

async function getImage(elementID) {
  return new Promise((resolve, reject) => {
    fetch(new Request(apiURL + "/img/random"))
      .then(async (response) => {
        const resJson = await response.json();
        switch (elementID) {
          case "img-A":
            imgInfoA = resJson;
            break;
          case "img-B":
            imgInfoB = resJson;
        }
        return resJson;
      })
      .then((resJson) => {
        fetch(new Request(apiURL + "/img/file?id=" + resJson.id.toString()))
          .then((response) => response.blob())
          .then((myBlob) => {
            const objectURL = URL.createObjectURL(myBlob);
            switch (elementID) {
              case "img-A":
                blobA = objectURL;
                break;
              case "img-B":
                blobB = objectURL;
            }
            document.getElementById(elementID).src = objectURL;
            resolve(null);
          });
      })
      .catch((reason) => {
        console.error(reason);
        reject(reason);
      });
  });
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

function setFileDetails(elementID) {
  const imgDetails = elementID == "img-A" ? imgInfoA : imgInfoB;

  artistEL.innerText = `Artist: ${imgDetails.artist}`;
  fileEL.innerText = `File: ${imgDetails.file}`;
  ratingEL.innerText = `Rating: ${imgDetails.rating}`;
  typeEL.innerText = `Type: ${imgDetails.type}`;
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
  setFileDetails(fadeInID);
}

async function initPage() {
  console.log(window.screen.availHeight);
  console.log(window.screen.availWidth);
  await getImage("img-A");
  await getImage("img-B");
  setFileDetails("img-A");
  setImgDimensions("img-A");
  setImgPosition("img-A");
  setImgDimensions("img-B");

  getClassList("img-A").add("fadeInImage");
  window.setTimeout(() => {
    getClassList("img-A").remove("hidden");
    getClassList("img-A").remove("fadeInImage");
  }, fadeDelay);
}

function imageGetInit() {
  window.setInterval(() => {
    switch (currentVisibleID) {
      case "A":
        revokeBlobURL("B");
        getImage("img-B");
        break;
      case "B":
        revokeBlobURL("A");
        getImage("img-A");
        break;
    }
  }, slideInterval * 1000);
}

initPage();
window.setInterval(slideHandler, slideInterval * 1000);
window.setTimeout(imageGetInit, (slideInterval / 2) * 1000);
