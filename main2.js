import paper from "paper";
import p5 from "p5";
import potrace from "potrace";
import Jimp from "jimp";
import Pressure from "pressure";
import Stats from "stats.js";

// Create a new Stats object
let stats = new Stats();
// Append the stats object to the DOM
document.body.appendChild(stats.dom);

// Update the stats in your animation loop
requestAnimationFrame(function loop() {
  stats.update();
  requestAnimationFrame(loop);
});

let points = [];
let pressure = 0;
function updateMousePosition(event) {
  // Get the bounding rectangle of the canvas
  let rect = event.target.getBoundingClientRect();
  // Calculate the mouse position relative to the canvas
  let x = event.clientX - rect.left;
  let y = event.clientY - rect.top;
  // Add the point to the array
  points.push({ x: x, y: y, pressure: pressure });
}

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
  const s = (p) => {
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

      // Add a mousemove event listener to the canvas
      p.canvas.addEventListener("mousemove", updateMousePosition);

      // Add a touchmove event listener to the canvas
      p.canvas.addEventListener("touchmove", function (event) {
        // Prevent scrolling when touching the canvas
        event.preventDefault();
        updateMousePosition(event.touches[0]);
      });
    };
    //while the left mouse pressed draw a black square at mouse position, otherwise , dont draw anything
    p.draw = function () {
      if (p.mouseIsPressed) {
        p.fill(0);
        // Draw a rectangle at every interpolated position between each pair of points
        for (let i = 0; i < points.length - 1; i++) {
          let point1 = points[i];
          let point2 = points[i + 1];
          let distance = p.dist(point1.x, point1.y, point2.x, point2.y);
          let steps = Math.ceil(distance);
          for (let j = 0; j <= steps; j++) {
            let t = j / steps;
            let x = p.lerp(point1.x, point2.x, t);
            let y = p.lerp(point1.y, point2.y, t);
            // Use the pressure of the first point to determine the size of the rectangle
            let size = point1.pressure * 50;
            p.rect(x - size / 2, y - size / 2, size, size);
          }
        }
      }
      points = [];
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
