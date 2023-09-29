import paper from "paper";
import p5 from "p5";
import potrace from "potrace";
import Jimp from "jimp";

class Sketch {
  constructor() {
    this.p5Instance = new p5(Sketch, "p5Canvas");
    this.paperInstance = paper.setup("paperCanvas");
  }
}
