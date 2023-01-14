function setup() {
  createCanvas(400, 400, WEBGL);
  setAttributes("alpha", true);
  strokeWeight(2);
}

function draw() {
  push();
  background(255);
  stroke(0);
  fill(200);

  push();
  translate(-100, 0);
  sphere(50);
  pop();

  push();
  translate(100, 0);
  beginShape(QUADS);
  stroke(255,0,0);
  vertex(-20, -20);
  stroke(0,0,255);
  vertex(-20, 20);
  stroke(0,255,0);
  vertex(20, -20);
  stroke(255,128,0);
  vertex(20, 20);
  endShape(CLOSE);
  pop();
}
