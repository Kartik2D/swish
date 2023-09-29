import paper from "paper";
import p5 from "p5";
import potrace from "potrace";
import Jimp from "jimp";
import Pressure from "pressure";
import Stats from "stats.js";

let p;
let drawnPixels;

let worker = new Worker(new URL("./worker.js", import.meta.url), {
  type: "module",
});

// Listen for messages from the worker
worker.onmessage = function (event) {
  // Import the SVG into Paper.js
  paper.project.importSVG(event.data, function (item) {
    console.log("SVG imported successfully");
    console.log("Type of imported item:", item.constructor.name);
    // Set the position to the center of the p5 canvas
    const center = new paper.Point(p.width / 2, p.height / 2);
    handleItem(item, center);
    p.clear();
  });
};

var stats = new Stats();
document.body.appendChild(stats.dom);
requestAnimationFrame(function loop() {
  stats.update();
  requestAnimationFrame(loop);
});

function handleItem(item, position) {
  if (item instanceof paper.Path || item instanceof paper.CompoundPath) {
    item.position = position; // Set the position of the item
    console.log(item);
  } else if (
    item instanceof paper.Group ||
    item instanceof paper.Layer ||
    item.constructor.name === "Group2"
  ) {
    for (let child of item.children) {
      handleItem(child, position); // Pass the position to the recursive call
    }
  }
}

//on window onload, create a paper.js instance and attach it to canvas with id paperCanvas
window.onload = function () {
  paper.setup("paperCanvas");

  // //animate a rectangle
  // const rectangle = new paper.Path.Rectangle({
  //   point: [0, paper.view.size.height - 20],
  //   size: [5, 20],
  //   fillColor: "red",
  // });
  // paper.view.onFrame = () => {
  //   rectangle.position.x += 1;
  //   if (rectangle.position.x > paper.view.size.width) {
  //     rectangle.position.x = 0;
  //   }
  // };
  paper.view.onMouseMove = function (event) {
    // On mouse hover, set item to selected, otherwise unselect
    var hitResult = paper.project.hitTest(event.point);
    paper.project.activeLayer.selected = false;
    if (hitResult && hitResult.item) {
      hitResult.item.selected = true;
    }
  };
  const s = (_p) => {
    p = _p;
    let x = 100;
    let y = 100;
    let pressure = 0;

    p.setup = function () {
      //get p5Canvas element from dom
      const pc = document.getElementById("p5Canvas");
      //create a canvas with the same size as the p5Canvas
      p.createCanvas(pc.offsetWidth, pc.offsetHeight);
      p.pixelDensity(1);
      p.noSmooth();
      //p.noStroke();

      // Setup pressure.js
      Pressure.set("#p5Canvas", {
        change: function (force, event) {
          // Change the pressure value
          pressure = force;
        },
      });
      drawnPixels = new ImageData(
        new Uint8ClampedArray(p.width * p.height * 4),
        p.width,
        p.height
      );
    };
    //while the left mouse pressed draw a black square at mouse position, otherwise , dont draw anything
    p.draw = function () {
      if (p.mouseIsPressed) {
        p.fill(0);
        let size = pressure * 50;
        let prevMouseX = p.pmouseX;
        let prevMouseY = p.pmouseY;
        let distance = Math.sqrt(
          Math.pow(p.mouseX - prevMouseX, 2) +
            Math.pow(p.mouseY - prevMouseY, 2)
        );
        let steps = Math.ceil(distance);
        let stepX = (p.mouseX - prevMouseX) / steps;
        let stepY = (p.mouseY - prevMouseY) / steps;

        for (let i = 0; i <= steps; i++) {
          let x = prevMouseX + i * stepX;
          let y = prevMouseY + i * stepY;
          p.rect(x - size / 2, y - size / 2, size, size);

          // Set the pixel in the ImageData
          let index = (Math.floor(y) * drawnPixels.width + Math.floor(x)) * 4;
          drawnPixels.data[index] = 0; // Red
          drawnPixels.data[index + 1] = 0; // Green
          drawnPixels.data[index + 2] = 0; // Blue
          drawnPixels.data[index + 3] = 255; // Alpha
        }
      }
    };
    //when the parent div is resized, resize the canvas
    p.windowResized = function () {
      const pc = document.getElementById("p5Canvas");
      p.resizeCanvas(pc.offsetWidth, pc.offsetHeight);
    };
    //when the mouse is released, send the canvas to potrace and get the svg
    p.mouseReleased = function () {
      worker.postMessage({
        drawnPixels: drawnPixels,
        width: p.width,
        height: p.height,
      });
      drawnPixels = new ImageData(
        new Uint8ClampedArray(p.width * p.height * 4),
        p.width,
        p.height
      );
    };
  };
  let myp5 = new p5(s, "p5Canvas");
};
