let gr;
let _gl;

function setup(){
  createCanvas(400, 400, WEBGL);

  _gl = this._renderer;

  gr = createGraphics(200, 200);
  gr.noStroke();
  gr.fill(255);
  gr.background(128);
  gr.rectMode(CENTER);
  gr.square(100, 100, 160);

  texture(gr);
  textureMode(NORMAL);

}
function draw(){
  background(200,200,255);

  beginShape(TESS);
  vertex(-100,-100,0,0);
  _gl._currentTexCoord.set(1,0);
  bezierVertex(0,-50,0,-150,100,-100);
  _gl._currentTexCoord.set(1,1);
  bezierVertex(50, 0, 150, 0, 100,100);
  _gl._currentTexCoord.set(0,1);
  bezierVertex(0, 50, 0, 150, -100, 100);
  _gl._currentTexCoord.set(0,0);
  bezierVertex(-50,0,-150,0,-100,-100);
  endShape();
}
