// 線バージョン。線も補間したい。

function setup() {
  createCanvas(400, 400, WEBGL);

  noFill();
  strokeWeight(3);

  beginShape();

  stroke(255);
  vertex(0, -200);

  stroke(255, 0, 0);
  bezierVertex(200, -200, 200, 0, 0, 0);

  stroke(0, 0, 255);
  bezierVertex(-200, 0, -200, 200, 0, 200);

  endShape();
}
