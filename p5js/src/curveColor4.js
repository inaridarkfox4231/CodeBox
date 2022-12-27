// quadraticVertexやってみようー（線バージョン）

function setup() {
  createCanvas(400, 400, WEBGL);
  strokeWeight(3);
  noFill();

  beginShape();

  stroke(255);
  vertex(0, -200);

  stroke(255, 0, 0);
  quadraticVertex(200, 0, 0, 0);

  stroke(0, 0, 255);
  quadraticVertex(-200, 0, 0, 200);

  endShape();
}
