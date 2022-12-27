// curveVertexは
// 直前の色を使うという概念が無いのでやめた方がよさげ
// そもそも色を補間するに際して前の色が存在する前提というのがどうしても必要なわけで...
// あ、そうか、前の色がない場合は補間しないのも
// 手だわね...どうすっかね。
// たとえば最初の2回を...んー。

// どうするのが自然なのかわからん。
// 当初の予定通りbezierとquadraticに対して実装することにしましょう
// おわり！

function setup() {
  createCanvas(400, 400, WEBGL);
  background(0);

  beginShape(TESS);
  fill(0,128,255);
  curveVertex(-180,-180);
  fill(255,128,0);
  curveVertex(-180,-180);

  fill(128,64,0);
  curveVertex(-100,-180);
  curveVertex(-120,-40);

  fill(255,128,0);
  curveVertex(40,-70);
  fill(255,0,0);
  curveVertex(-40,20);
  fill(0,0,255);
  curveVertex(-20,80);

  fill(255);
  curveVertex(180,180);
  fill(128);
  curveVertex(180,180);

  endShape();
}
