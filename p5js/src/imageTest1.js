// image関数の仕様変更が通ると
// まあこんな感じで
// 下に置くのも上に置くのも自由自在
// 便利です...！
// 額縁とか普通に行けます
// カメラもデプスも切るってのはそういうこと
// ね？影響受けるimage関数、マジで役に立たないでしょ？？

let gr, gr2, gl;
let defaultCam, cam;

function setup() {
  createCanvas(600, 400, WEBGL);
  gl = this._renderer.GL;

  gr = createGraphics(600, 400, WEBGL);
  gr.stroke(255,128,0);
  gr.strokeWeight(8);
  gr.beginShape();
  gr.fill(0);
  gr.vertex(-300,-200);
  gr.vertex(300,-200);
  gr.fill(0,0,255);
  gr.vertex(300,200);
  gr.vertex(-300,200);
  gr.endShape(CLOSE);
  defaultCam = createCamera();
  cam = createCamera();
  cam.camera(400,400,400,0,0,0,0,0,-1);
  gr2 = createGraphics(100,40);
  gr2.noStroke();
  gr2.fill(255);
  gr2.textSize(24);
  gr2.textAlign(CENTER, CENTER);
  gr2.text("test", 50, 20);

}

function draw() {
  clear();
  gl.disable(gl.DEPTH_TEST);
  setCamera(defaultCam);
  image(gr, -300, -200, 600, 400, 0, 0, 600, 400);
  setCamera(cam);
  gl.enable(gl.DEPTH_TEST);

  directionalLight(255, 255, 255, 0, 0, -1);
  ambientLight(64);
  ambientMaterial(255);

  noStroke();
  fill(255,200,200);
  plane(800, 600);
  fill(0,128,255);
  const t = frameCount*TAU/240;
  const x = 100*cos(t);
  const y = 100*sin(t);
  translate(x, y, 100);
  sphere(80);

  gl.disable(gl.DEPTH_TEST);
  setCamera(defaultCam);
  image(gr2, -300, -200);
  setCamera(cam);
  gl.enable(gl.DEPTH_TEST);
}

/*
let gr, gr2;

function setup() {
  createCanvas(600, 400, WEBGL);
  gr = createGraphics(600, 400, WEBGL);
  gr.stroke(255,128,0);
  gr.strokeWeight(8);
  gr.beginShape();
  gr.fill(0);
  gr.vertex(-300,-200);
  gr.vertex(300,-200);
  gr.fill(0,0,255);
  gr.vertex(300,200);
  gr.vertex(-300,200);
  gr.endShape(CLOSE);
  camera(400,400,400,0,0,0,0,0,-1);
  gr2 = createGraphics(100,40);
  gr2.noStroke();
  gr2.fill(255);
  gr2.textSize(24);
  gr2.textAlign(CENTER, CENTER);
  gr2.text("test", 50, 20);
}

function draw() {
  clear();
  image(gr, -300, -200, 600, 400, 0, 0, 600, 400);

  directionalLight(255, 255, 255, 0, 0, -1);
  ambientLight(64);
  ambientMaterial(255);

  noStroke();
  fill(255,200,200);
  plane(800, 600);
  fill(0,128,255);
  const t = frameCount*TAU/240;
  const x = 100*cos(t);
  const y = 100*sin(t);
  translate(x, y, 100);
  sphere(80);

  image(gr2, -300, -200);
}
*/
