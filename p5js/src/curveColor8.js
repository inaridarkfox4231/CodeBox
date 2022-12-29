
function setup(){
  createCanvas(640, 640, WEBGL);

  beginShape();
  fill(255);
  vertex(-240, -240, 0);
  fill(0,0,255);
  bezierVertex(-80, -240, 0,-80, -80, 0, 80, -80, 0);
  fill(0,0,255);
  quadraticVertex(160, 0, 0, 80, 80, 0);
  fill(255);
  bezierVertex(-80, 80, 0, -80, 240, 0, -240, 240, 0);
  endShape();

}
