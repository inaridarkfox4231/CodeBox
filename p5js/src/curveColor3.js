// quadraticVertexやってみようー

function setup() {
  createCanvas(400, 400, WEBGL);

  beginShape();

  fill(255);
  vertex(0, -200);

  fill(255, 0, 0);
  quadraticVertex(200, 0, 0, 0);

  fill(0, 0, 255);
  quadraticVertex(-200, 0, 0, 200);

  endShape();
}
