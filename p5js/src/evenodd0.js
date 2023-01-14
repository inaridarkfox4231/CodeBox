function setup(){
  createCanvas(640, 640);
  fill(200);
  noStroke();
  background(0);
  translate(320,320);
  beginShape();

  for(let i=0; i<400; i++){
    const t = TAU*i/400;
    const x = 160*cos(3*t)-80*sin(4*t);
    const y = 160*sin(3*t)-80*cos(4*t);
    vertex(x,y);
  }

  endShape();


}
