function setup(){
  createCanvas(640, 640, WEBGL);

  beginShape();
  noStroke();

  curveVertex(-100,-100);

  curveVertex(-100,-100);
  fill(255); // (-100,-100)の頂点色を決めてる
  curveVertex(100,-100);
  fill(255); // (-100,-100)～(100,-100)の頂点色を決めてる
  curveVertex(100,100);
  fill(0,0,255); // (100,-100)～(100,100)の頂点色を決めてる
  curveVertex(-100,100);
  fill(0,0,255); // (100,100)～(-100,100)の頂点色を決めてる
  curveVertex(-100,-100);
  fill(255); // (-100,100)～(-100,-100)の頂点色を決めてる

  curveVertex(-100,-100);

  endShape();
  // 仕様変更がされればね。ていうか...今回control pointが無いのでね。どうすんだろ。今度こそ
  // 通常補間でよくね？だってないじゃん。control pointが。
  // 結局最初と最後の重複頂点を無視したうえで、
  // 間の点について直後にfillなりstrokeなり呼び出すとその色が変わる、って認識でいいのではないかと。
}
