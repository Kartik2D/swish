import paper from "paper";
import p5 from "p5";
import potrace from "potrace";
import Jimp from "jimp";
import Stats from "stats.js";

let p5Instance;
let paperInstance;
let inputInstance;

function setupPaper() {
  paperInstance = paper.setup("paperCanvas");
  return paperInstance;
}

function setupP5() {
  const sketch = (p) => {
    p5Instance = p;
    p.pc = document.getElementById("p5Canvas");
    p.setup = function () {
      p.createCanvas(p.pc.offsetWidth, p.pc.offsetHeight);
      p.pixelDensity(0.5);
      p.noSmooth();
      p.noStroke();
    };
    p.draw = function () {
      p.clear();
      p.fill(0);
      p.textSize(20);
      p.text("width: " + p.width, 10, 30);
      p.text("height: " + p.height, 10, 60);
    };
  };

  p5Instance = new p5(sketch, "p5Canvas");
  return p5Instance;
}

class Tool {
  constructor(name) {
    this.name = name;
    this.strokeStart = this.strokeStart.bind(this);
    this.strokeMove = this.strokeMove.bind(this);
    this.strokeEnd = this.strokeEnd.bind(this);
  }

  strokeStart(event) {
    console.log(`${this.name} strokeStart`);
    // Your implementation here
  }

  strokeMove(event) {
    console.log(`${this.name} strokeMove`);
    // Your implementation here
  }

  strokeEnd(event) {
    console.log(`${this.name} strokeEnd`);
    // Your implementation here
  }
}

class ToolManager {
  constructor() {
    this.currentTool = null;
  }

  selectTool(name) {
    if (this.currentTool) {
      this.removeEventListeners();
    }
    this.currentTool = name;
    this.addEventListeners();
  }

  addEventListeners() {
    window.addEventListener("touchstart", (event) =>
      this.currentTool.strokeStart(event)
    );
    window.addEventListener("touchmove", (event) =>
      this.currentTool.strokeMove(event)
    );
    window.addEventListener("touchend", (event) =>
      this.currentTool.strokeEnd(event)
    );

    window.addEventListener("mousedown", (event) =>
      this.currentTool.strokeStart(event)
    );
    window.addEventListener("mousemove", (event) =>
      this.currentTool.strokeMove(event)
    );
    window.addEventListener("mouseup", (event) =>
      this.currentTool.strokeEnd(event)
    );
  }

  removeEventListeners() {
    window.removeEventListener("touchstart", this.currentTool.strokeStart);
    window.removeEventListener("touchmove", this.currentTool.strokeMove);
    window.removeEventListener("touchend", this.currentTool.strokeEnd);

    window.removeEventListener("mousedown", this.currentTool.strokeStart);
    window.removeEventListener("mousemove", this.currentTool.strokeMove);
    window.removeEventListener("mouseup", this.currentTool.strokeEnd);
  }
}

window.onload = function () {
  paperInstance = setupPaper();
  p5Instance = setupP5();
  const toolManager = new ToolManager();

  function resize() {
    p5Instance.resizeCanvas(
      p5Instance.pc.offsetWidth,
      p5Instance.pc.offsetHeight
    );
  }

  window.addEventListener("resize", resize);
};
