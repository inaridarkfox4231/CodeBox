// なるほど。これはやばいわ。
// 気づけよ誰か...

// ところで普通に修正版image機能しますね
// これいいな～～～～～～～～～～～～～～
// ほしい！！

let cam;
let gr;

function setup() {
  createCanvas(600, 600, WEBGL);
  cam = createCamera();
  cam.camera(0,0,100,800,0,100,0,0,-1);
  setCamera(cam);
  noStroke();

  gr = createGraphics(600, 600);
  gr.noStroke();
  gr.fill(255);
  gr.textSize(16);
  gr.textAlign(RIGHT, BOTTOM);
  gr.text("camera move test", 590, 590);
}

function draw() {
  background(0);

  cameraMove();

  directionalLight(255,255,255,0,0,-1);
  ambientLight(64);
  ambientMaterial(128);

  fill(255);
  plane(1600, 20);
  fill(255,128,0);
  translate(0,50,50);
  for(i=0;i<10;i++){
    sphere(4);
    translate(40,0,0);
  }
  translate(-400,-100,0);
  for(i=0;i<10;i++){
    sphere(4);
    translate(40,0,0);
  }

  image(gr, -300, -300); // こんだけでいいんだぜ！？
}

function cameraMove(){
  if(mouseIsPressed){
    if(mouseY > 200){ cam.move(0, 0, 10); }else{ cam.move(0, 0, -10); }
  }
}
