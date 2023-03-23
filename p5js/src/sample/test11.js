// unit test.
// まあ、どうでもいいけどね...

function setup(){
  createCanvas(32,32,WEBGL);
  background(0);
  blendMode(ADD);
  strokeWeight(32);
  stroke(255,0,0);
  point(0,0,0);
  stroke(0,0,255);
  point(0,0,0);
  console.log(get(16,16)); // 255,0,255,255. これでOK.
}
