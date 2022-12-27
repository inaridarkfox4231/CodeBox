// 勘違いでした。

function setup() {
  createCanvas(400, 400, WEBGL);

  beginShape();

  fill(255);
  vertex(0, -200);

  fill(255, 0, 0);
  bezierVertex(200, -200, 200, 0, 0, 0);

  endShape();
}
