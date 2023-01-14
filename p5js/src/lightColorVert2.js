// lightingとcolorVertの共存を目指します。

// Per-vertex coloring not working
// when using lighting in immediateMode.

// 立体の場合

function setup() {
  createCanvas(400, 400, WEBGL);
  noStroke();
}
function draw() {
  const a = sqrt(6);

  directionalLight(0,255,255,0,0,-1);
  ambientLight(64);
  pointLight(255, 255, 0, 0, 0, 150);

  rotateX(PI/3);
  rotateZ(frameCount*TAU/240);

  background(0);
  beginShape(TRIANGLE_FAN);

  fill(0,0,255);
  normal(0,0,1);
  vertex(0, 0, 100);

  fill(255);

  normal(1/a, 1/a, 2/a);
  vertex(100,100,0);

  normal(-1/a, 1/a, 2/a);
  vertex(-100,100,0);

  normal(-1/a, -1/a, 2/a);
  vertex(-100,-100,0);

  normal(1/a, -1/a, 2/a);
  vertex(100,-100,0);

  normal(1/a, 1/a, 2/a);
  vertex(100,100,0);

  endShape();
}
