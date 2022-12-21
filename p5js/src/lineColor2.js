// issue: https://github.com/processing/p5.js/issues/5912


function setup() {
  createCanvas(600, 600, WEBGL);

  background(255);
  strokeWeight(5);

  beginShape();
  fill(0, 0, 255);
  stroke(0, 255, 255);
  vertex(0,0);
  fill(255, 0, 0);
  stroke(255, 0, 255);
  vertex(width*0.5-10,0);
  fill(0, 255, 0);
  stroke(0, 255, 0);
  vertex(width*0.5-10,height*0.5-10);
  fill(255, 255, 0);
  vertex(0,height*0.5-10);
  endShape(CLOSE);

  beginShape();
  fill(255,0,0);
  vertex(-width*0.5+10,-height*0.5+10);
  //fill(0,0,255);
  bezierVertex(-width*0.5+10,-height*0.5+290,-width*0.5,10,0,0);
  fill(0,0,255);
  vertex(0,0);
  bezierVertex(-width*0.5+50,-height*0.5-20,-width*0.5,10,-width*0.5+60,-height*0.5+70);
  fill(0,255,0);
  vertex(width*0.5-10,-height*0.5+10);
  endShape(CLOSE);

}
