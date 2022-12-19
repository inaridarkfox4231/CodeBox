/*
  2Dでの挙動。
  (300, 200)に赤い円, (100, 200)に青い円を置きます。
  間にresetMatrixを挟むことで具体的に位置を指定することが
  できます。
*/

/*
  Behavior in 2D.
  put red circle on (300, 200), put blue circle on (100, 200).
  You can specify the position specifically
  by inserting resetMatrix function in between.
*/

function setup() {
  createCanvas(400, 400);
}

function draw() {
  background(0);

  translate(300, 200);
  fill(255, 0, 0);
  circle(0, 0, 160);

  resetMatrix();

  translate(100, 200);
  fill(0, 0, 255);
  circle(0, 0, 160);
}
