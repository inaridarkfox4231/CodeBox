// サンプルコード

function setup(){
  createCanvas(400, 400, WEBGL);
  background(0);
  strokeWeight(3);

  beginShape(TESS);
  stroke(255);
  vertex(-100, 0, 0);
  stroke(0, 0, 255);
  vertex(0, 0, 0);
  stroke(255, 0, 0);
  vertex(100, 0, 0);
  endShape();
}

/*
function setup(){
  createCanvas(820, 400);
  let gr = createGraphics(400, 400, WEBGL);
  let gr2 = createGraphics(400, 400, WEBGL);
  gr.background(0);
  gr.strokeWeight(3);
  gr.stroke(255, 0, 0);
  gr.beginShape();
  gr.vertex(-100, 0, 0);
  gr.vertex(0, 0, 0);
  gr.vertex(100, 0, 0);
  gr.endShape();

  gr2.background(0);
  gr2.strokeWeight(3);
  gr2.beginShape();
  gr2.stroke(255);
  gr2.vertex(-100, 0, 0);
  gr2.stroke(0, 0, 255);
  gr2.vertex(0, 0, 0);
  gr2.stroke(255, 0, 0);
  gr2.vertex(100, 0, 0);
  gr2.endShape();

  background(255);
  image(gr, 0, 0);
  image(gr2, 420, 0);
}
*/
