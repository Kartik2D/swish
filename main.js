import paper from "paper";
import p5 from "p5";
import potrace from "potrace";
import Jimp from "jimp";
import Pressure from "pressure";
import Stats from "stats.js";

var stats = new Stats();
document.body.appendChild(stats.dom);
requestAnimationFrame(function loop() {
  stats.update();
  requestAnimationFrame(loop);
});
function handleItem(item, position) {
  if (item instanceof paper.Path || item instanceof paper.CompoundPath) {
    item.scale(2);
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

  //animate a rectangle
  const rectangle = new paper.Path.Rectangle({
    point: [0, paper.view.size.height - 20],
    size: [5, 20],
    fillColor: "red",
  });
  paper.view.onFrame = () => {
    rectangle.position.x += 1;
    if (rectangle.position.x > paper.view.size.width) {
      rectangle.position.x = 0;
    }
  };
  paper.view.onMouseMove = function (event) {
    // On mouse hover, set item to selected, otherwise unselect
    var hitResult = paper.project.hitTest(event.point);
    paper.project.activeLayer.selected = false;
    if (hitResult && hitResult.item) {
      hitResult.item.selected = true;
    }
  };
  const s = (p) => {
    let x = 100;
    let y = 100;
    let pressure = 0;
    let drawnPixels = [];

    p.setup = function () {
      //get p5Canvas element from dom
      const pc = document.getElementById("p5Canvas");
      //create a canvas with the same size as the p5Canvas
      p.createCanvas(pc.offsetWidth, pc.offsetHeight);
      p.pixelDensity(0.5);
      p.noSmooth();
      //p.noStroke();

      // Setup pressure.js
      Pressure.set("#p5Canvas", {
        change: function (force, event) {
          // Change the pressure value
          pressure = force;
        },
      });
    };
    //while the left mouse pressed draw a black square at mouse position, otherwise , dont draw anything
    p.draw = function () {
      if (p.mouseIsPressed) {
        p.fill(0);
        // Use pressure to change the size of the square
        let size = pressure * 50;
        // Adjust the rectangle's position to be centered at the mouse
        // Store previous mouse position
        let prevMouseX = p.pmouseX;
        let prevMouseY = p.pmouseY;
        // Calculate the distance between current and previous mouse position
        let distance = Math.sqrt(
          Math.pow(p.mouseX - prevMouseX, 2) +
            Math.pow(p.mouseY - prevMouseY, 2)
        );
        // Calculate the number of steps for the loop
        let steps = Math.ceil(distance);
        // Calculate the step size for x and y direction
        let stepX = (p.mouseX - prevMouseX) / steps;
        let stepY = (p.mouseY - prevMouseY) / steps;
        // Loop through all the positions between current and previous mouse position
        for (let i = 0; i <= steps; i++) {
          let x = prevMouseX + i * stepX;
          let y = prevMouseY + i * stepY;
          p.rect(x - size / 2, y - size / 2, size, size);
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
      //get the image data of the p5 canvas
      const imgData = p.drawingContext.getImageData(0, 0, p.width, p.height);
      //use Jimp to read the image data
      Jimp.read(imgData)
        .then((image) => {
          //use potrace to get the SVG
          potrace.trace(
            image.bitmap,
            {
              threshold: 200,
              color: "#000000",
              background: "none",
              optTolerance: 1,
              turbo: true,
              turnPolicy: "minority",
              alphaMax: 1,
              longCurve: false,
              curveTightness: 0,
            },
            function (err, svg) {
              if (err) throw err;
              // Import the SVG into Paper.js
              paper.project.importSVG(svg, function (item) {
                console.log("SVG imported successfully");
                console.log("Type of imported item:", item.constructor.name);
                // Set the position to the center of the p5 canvas
                const center = new paper.Point(p.width / 2, p.height / 2);
                handleItem(item, center);
                p.clear();
              });
            }
          );
        })
        .catch((err) => {
          console.error(err);
        });
    };
  };
  let myp5 = new p5(s, "p5Canvas");
};
