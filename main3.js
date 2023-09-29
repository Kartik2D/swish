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
let brushSize = 70;
let brushColor = "#440404";
let tool;

//let clientRect = document.getElementById("p5Canvas").getBoundingClientRect();

function updateMousePosition(event) {
  // Get the bounding rectangle of the canvas
  //let rect = event.target.getBoundingClientRect();
  // Calculate the mouse position relative to the canvas
  let x = event.clientX; // - clientRect.left;
  let y = event.clientY; // - clientRect.top;
  // Add the point to the array
  points.push({ x: x, y: y });
}

function handleItem(item) {
  if (item instanceof paper.Path || item instanceof paper.CompoundPath) {
    //item.scale(2);
    //item.fillColor = brushColor;
    //item.position = position; // Set the position of the item
    console.log(item);
  } else if (
    item instanceof paper.Group ||
    item instanceof paper.Layer ||
    item.constructor.name === "Group2"
  ) {
    for (let child of item.children) {
      handleItem(child); // Pass the position to the recursive call
    }
  }
}

//on window onload, create a paper.js instance and attach it to canvas with id paperCanvas
window.onload = function () {
  paper.setup("paperCanvas");

  paper.view.onMouseMove = function (event) {
    // On mouse hover, set item to selected, otherwise unselect
    var hitResult = paper.project.hitTest(event.point);
    paper.project.activeLayer.selected = false;
    if (hitResult && hitResult.item) {
      hitResult.item.selected = true;
    }
  };

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

  const s = (p) => {
    function drawBrush(x, y, c, b) {
      p.fill(c);
      //Use pressure to change the size of the square
      let size = pressure * b;
      //size cannot be below 1
      if (size < 1) {
        size = 1;
      }
      //let size = 20;
      p.rect(x - size / 2, y - size / 2, size, size);
    }

    p.setup = function () {
      //get p5Canvas element from dom
      const pc = document.getElementById("p5Canvas");
      //create a canvas with the same size as the p5Canvas
      p.createCanvas(pc.offsetWidth, pc.offsetHeight);
      p.pixelDensity(0.5);
      p.noSmooth();
      p.noStroke();

      // Setup pressure.js
      Pressure.set("#p5Canvas", {
        change: function (force, event) {
          // Change the pressure value
          pressure = force;
        },
      });

      // Add a mouse scroll event
      p.canvas.addEventListener("wheel", function (event) {
        //scroll the paper canvas
        // Calculate the zoom factor
        let zoomFactor = 1.01;
        if (event.deltaY < 0) {
          // Zoom in
          paper.view.zoom *= zoomFactor;
        } else {
          // Zoom out
          paper.view.zoom /= zoomFactor;
        }
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
        //drawBrush(p.mouseX, p.mouseY, brushColor, brushSize);
        for (let point of points) {
          for (let i = 0; i < points.length - 1; i++) {
            let start = points[i];
            let end = points[i + 1];
            let distance = p.dist(start.x, start.y, end.x, end.y);
            for (let j = 0; j < distance; j++) {
              let x = p.lerp(start.x, end.x, j / distance);
              let y = p.lerp(start.y, end.y, j / distance);
              drawBrush(x, y, brushColor, brushSize);
            }
          }
        }
      }
      if (points.length > 1) {
        let lastPoint = points[points.length - 1];
        points = [];
        points.push(lastPoint);
      }
    };
    //when the parent div is resized, resize the canvas
    p.windowResized = function () {
      const pc = document.getElementById("p5Canvas");
      p.resizeCanvas(pc.offsetWidth, pc.offsetHeight);
      //clientRect = document.getElementById("p5Canvas").getBoundingClientRect();
    };
    //when the mouse is released, send the canvas to potrace and get the svg
    p.mouseReleased = function () {
      //get the image data of the p5 canvas
      const imgData = p.drawingContext.getImageData(
        0,
        0,
        p.width * p.pixelDensity(),
        p.height * p.pixelDensity()
      );
      //use Jimp to read the image data
      Jimp.read(imgData)
        .then((image) => {
          //   // Download the image
          //   image.getBuffer(Jimp.MIME_PNG, (err, buffer) => {
          //     if (err) throw err;
          //     let downloadLink = document.createElement("a");
          //     downloadLink.href = URL.createObjectURL(
          //       new Blob([buffer], { type: Jimp.MIME_PNG })
          //     );
          //     downloadLink.download = "image.png";
          //     downloadLink.click();
          //   });

          //use potrace to get the SVG
          potrace.trace(
            image.bitmap,
            {
              threshold: 200,
              color: "#000000",
              background: "transparent",
              optTolerance: 1,
              turbo: true,
              turnPolicy: "minority",
              alphaMax: 1,
              longCurve: false,
              curveTightness: 0,
              width: p.width,
              height: p.height,
            },
            function (err, svg) {
              if (err) throw err;
              //   //Download the SVG
              //   var downloadLink = document.createElement("a");
              //   downloadLink.href =
              //     "data:image/svg+xml;utf8," + encodeURIComponent(svg);
              //   downloadLink.download = "drawing.svg";
              //   downloadLink.click();

              // Import the SVG into Paper.js
              paper.project.importSVG(svg, function (item) {
                console.log("SVG imported successfully");
                console.log("Type of imported item:", item.constructor.name);
                // Set the position to the center of the p5 canvas
                //const center = new paper.Point(0, 0);
                //item.position = center;
                //item.scale(1 / p.pixelDensity());
                handleItem(item);
                item.fillColor = brushColor;
                p.clear();
              });
            }
          );
        })
        .catch((err) => {
          console.error(err);
        });
      points = [];
    };
  };
  let myp5 = new p5(s, "p5Canvas");
};
