let currentVisibleID = "A";
const fadeDelay = 2900;
const slideInterval = 900;
const windowHeight = document.getElementById("img-container").clientHeight;
const windowWidth = document.getElementById("img-container").clientWidth;
const apiURL =
  window.location.protocol === "http:" || window.location.protocol === "https:"
    ? window.location.origin
    : "http://localhost:9000";

let blobA = null;
let blobB = null;

let imgInfoA = null;
let imgInfoB = null;

const artistEL = document.getElementById("artist");
const fileEL = document.getElementById("file");
const ratingEL = document.getElementById("rating");
const dimensionsEL = document.getElementById("dimensions");
const idEL = document.getElementById("file-id");

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

async function getImageInfo() {
  return new Promise((resolve, reject) => {
    fetch(new Request(apiURL + "/img/random"))
      .then(async (response) => {
        const resJson = await response.json();
        resolve(resJson);
      })
      .catch((reason) => {
        console.error(reason);
        reject(reason);
      });
  });
}

async function getImage(elementID) {
  return new Promise((resolve, reject) => {
    const MAX_ATTEMPTS = 6;
    const THRESHOLD = 500; // px
    // internal attempt-aware loader to allow retries for small images
    function attemptLoad(attempt) {
      getImageInfo()
        .then(async (response) => {
          switch (elementID) {
            case "img-A":
              imgInfoA = response;
              break;
            case "img-B":
              imgInfoB = response;
          }
          return response;
        })
        .then((resJson) => {
          return fetch(new Request(apiURL + "/img/file?id=" + resJson.id.toString()));
        })
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
          const imageElement = document.getElementById(elementID);

          const onloadHandler = () => {
            const w = imageElement.naturalWidth || 0;
            const h = imageElement.naturalHeight || 0;
            if (w < THRESHOLD && h < THRESHOLD) {
              // too small: clean up and retry (unless we've exhausted attempts)
              console.warn(
                `Image ${elementID} too small (${w}x${h}), attempt ${attempt}`,
              );
              try {
                URL.revokeObjectURL(objectURL);
              } catch (e) {
                /* ignore */
              }
              switch (elementID) {
                case "img-A":
                  blobA = null;
                  break;
                case "img-B":
                  blobB = null;
              }
              if (attempt < MAX_ATTEMPTS) {
                // slight delay to avoid tight loop
                window.setTimeout(() => attemptLoad(attempt + 1), 100);
                return;
              } else {
                // give up and resolve so UI can proceed
                resolve(null);
                return;
              }
            }

            // good image
            // call sizing/positioning now that natural sizes are available
            try {
              setImgDimensions(elementID);
              setImgPosition(elementID);
            } catch (e) {
              /* ignore errors from layout */
            }
            // detach handlers
            imageElement.onload = null;
            imageElement.onerror = null;
            resolve(null);
          };

          const onerrorHandler = (error) => {
            console.error("image load error", error);
            try {
              URL.revokeObjectURL(objectURL);
            } catch (e) {
              /* ignore */
            }
            switch (elementID) {
              case "img-A":
                blobA = null;
                break;
              case "img-B":
                blobB = null;
            }
            if (attempt < MAX_ATTEMPTS) {
              window.setTimeout(() => attemptLoad(attempt + 1), 100);
            } else {
              reject(error);
            }
          };

          imageElement.onload = onloadHandler;
          imageElement.onerror = onerrorHandler;
          imageElement.src = objectURL;
        })
        .catch((reason) => {
          console.error(reason);
          reject(reason);
        });
    }

    attemptLoad(1);
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
      "important",
    );
  }

  if (diffWidth == 0) {
    element.style.setProperty("left", "0px", "important");
  } else if (diffWidth > 0) {
    element.style.setProperty(
      "left",
      Math.floor(diffWidth / 2).toString() + "px",
      "important",
    );
  }
}

function setFileDetails(elementID) {
  const imgDetails = elementID == "img-A" ? imgInfoA : imgInfoB;
  const imageElement = document.getElementById(elementID);
  const width = imageElement.naturalWidth || 0;
  const height = imageElement.naturalHeight || 0;

  artistEL.innerText = `Artist: ${imgDetails.artist}`;
  fileEL.innerText = `File: ${imgDetails.file}`;
  ratingEL.innerText = `Rating: ${imgDetails.nsfw ? "NSFW" : "SFW"}`;
  dimensionsEL.innerText = `Dimensions: ${width} x ${height}`;
  idEL.innerText = `ID: ${imgDetails.id}`;
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
