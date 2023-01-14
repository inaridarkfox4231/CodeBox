// image関数の仕様変更が通ると
// まあこんな感じで
// 下に置くのも上に置くのも自由自在
// 便利です...！
// 額縁とか普通に行けます
// カメラもデプスも切るってのはそういうこと
// ね？影響受けるimage関数、マジで役に立たないでしょ？？

// デプス戻そう
// カリングの影響も殺さないと

let gr, gl, defaultCam, cam;

function setup() {
  createCanvas(600, 400, WEBGL);
  gl = this._renderer.GL;
  defaultCam = createCamera();
  cam = createCamera();
  setCamera(cam);
  gr = createGraphics(600, 400);
  gr.noStroke();
  gr.fill(255);
  gr.textSize(24);
  gr.textAlign(RIGHT, BOTTOM);
  gr.textStyle(ITALIC);
  gr.text("orbit control test", 590, 390);
  noStroke();
}

function draw() {
  background(0);
  orbitControl();

  directionalLight(255,255,255, 0, 0, -1);
  ambientLight(64);
  ambientMaterial(128);
  fill(0, 128, 255);
  plane(400);
  translate(0, 0, 80);
  fill(255, 128, 0);
  sphere(20);

  gl.disable(gl.DEPTH_TEST);
  setCamera(defaultCam);
  image(gr, -300, -200);
  setCamera(cam);
  gl.enable(gl.DEPTH_TEST);
}

/*
let gr;

function setup() {
  createCanvas(600, 400, WEBGL);
  gr = createGraphics(600, 400);
  gr.noStroke();
  gr.fill(255);
  gr.textSize(24);
  gr.textAlign(RIGHT, BOTTOM);
  gr.textStyle(ITALIC);
  gr.text("orbit control test", 590, 390);
  noStroke();
}

function draw() {
  background(0);
  orbitControl();

  directionalLight(255,255,255, 0, 0, -1);
  ambientLight(64);
  ambientMaterial(128);
  fill(0, 128, 255);
  plane(400);
  translate(0, 0, 80);
  fill(255, 128, 0);
  sphere(20);

  image(gr, -300, -200);
}

*/
