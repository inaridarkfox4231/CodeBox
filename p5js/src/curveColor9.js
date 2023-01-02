
function setup(){
  createCanvas(640, 640, WEBGL);

  noFill();
  strokeWeight(2);
  beginShape();
  stroke(255);
  vertex(-160, -160);
  stroke(255, 0, 0);
  bezierVertex(160, -160, 160, 0, -160, 0);
  stroke(0, 0, 255);
  quadraticVertex(0, 160, 0, 160, 0, 0);
  stroke(255);
  bezierVertex(160, 320, 0, -160, 320, 0, -160, 80, 0);
  endShape();
}
