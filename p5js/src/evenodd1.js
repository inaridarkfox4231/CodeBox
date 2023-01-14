function setup(){
  createCanvas(640, 640);
  fill(200);
  strokeWeight(4);
  stroke(255,0,0);
  background(0);
  translate(320,320);

  beginShape();

  vertex(-200, -200);
  vertex(200, -200);
  vertex(200, 200);
  vertex(-200, 200);

  beginContour();
  vertex(-100, -100);
  vertex(100, -100);
  vertex(100, 100);
  vertex(-100, 100);
  endContour();

  beginContour();
  vertex(-300, -60);
  vertex(300, -60);
  vertex(300, 60);
  vertex(-300, 60);
  endContour();

  endShape();


}
