// print
// frameCount
// deltaTime
/*
function setup(){
  createCanvas(100, 100);
  print(12345);
  print('はじめまして' + '数学' + 3);
  print([1, 2, 3]);
  print((3*3 + 4*4) == 5*5);
  print((x) => x*x);
  print({x:0, y:1, z:2});
}
*/
/*
let x = 20;
let y = 20;
function setup(){
  createCanvas(400, 400);
  textAlign(CENTER, CENTER);
  textSize(16);
  fill(0);
  background(255);
  text(frameCount, x, y);
}
function draw(){
  x += 40;
  if (x > 400) { y += 40; x -= 400; }
  if (y > 400) {
    noLoop();
  } else {
    text(frameCount, x, y);
  }
}
*/
let t = 0;
function setup(){
  createCanvas(400, 400);
  noStroke();
  fill(0, 128, 255);
}
function draw(){
  background(0);
  t += deltaTime / 1000;
  circle(200 + 200 * sin(t*TAU*0.5), 200, 80);
}
