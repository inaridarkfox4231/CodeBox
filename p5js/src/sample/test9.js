function setup(){
  createCanvas(400,400,WEBGL);
  background(0);
  blendMode(ADD);
  strokeWeight(100);

  stroke(255,0,0);
  point(0,0,0);
  stroke(0,0,255);
  point(50,0,0);
  //save("pointBug2");
}
