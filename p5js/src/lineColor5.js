/*
let graphic;

function setup() {
  createCanvas(640, 640);
  graphic = createGraphics(640, 640, WEBGL);
  graphic.colorMode(HSB, 1);
  graphic.fill(0.5);
  graphic.strokeWeight(2);
  textSize(16);
  textAlign(LEFT, TOP);
  fill(255);
}

function draw() {
  graphic.clear();
  graphic.background(0);
  graphic.beginShape(TESS);
  for(let i=0; i<=1200; i++){
    const t = TAU*i/1200;
    const x = 144*cos(13*t)-96*sin(7*t);
    const y = 144*sin(13*t)-96*cos(7*t);
    const _hue = fract((i+frameCount*2)/1200);
    const _sat = max(0, sin(t*40 + frameCount*TAU/100));
    graphic.stroke(_hue, _sat, 1);
    graphic.vertex(x, y, 0);
  }
  graphic.endShape();
  image(graphic, 0, 0);
  text(frameRate().toFixed(3), 5, 5);
}
*/

function setup() {
  createCanvas(400, 400, WEBGL);
  strokeWeight(2);
  fill(128);
  beginShape(TESS);
  stroke(255);
  vertex(0,0,0);
  stroke(0,0,255);
  vertex(100,0,0);
  stroke(255,0,0);
  vertex(0,100,0);
  stroke(255);
  vertex(0,0,0);
  endShape();
}
