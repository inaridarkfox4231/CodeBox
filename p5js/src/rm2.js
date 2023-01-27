/*
  webglでの挙動
  (100, 0, 0)に赤い球、(-100, 0, 0)に青い球を置きます。
  間にresetMatrixを挟むことで2Dと同じように具体的に位置を指定
  できるようにすることができると思われますが、
  実際に置けるのは赤い球だけです。
  これはresetMatrixによりuMVMatrixが単位行列になることで、
  カメラの情報が失われてしまうからです。
*/

/*
  Behavior in webgl mode.
  put red sphere on (100, 0, 0), put blue sphere on (-100, 0, 0).
  By inserting resetMatrix function in between,
  it seems that it can be made to be able to specify the position
  specifically like in 2D,
  but only the red sphere can actually be placed.
  This is because the resetMatrix function makes uMVMatrix
  an identity matrix, and camera information is lost.
*/
// resetMatrixのおかげでこのように
// 問題なく記述できる

let gr;

function setup() {
  createCanvas(400, 400);
}
function draw() {
  background(0);
  gr.clear();
  gr.resetMatrix();
  gr.rotateX(frameCount*TAU/240);
  gr.rotateY(frameCount*TAU/320);
  gr.box(80);
}
