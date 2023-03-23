
function setup(){
  createCanvas(600,600,WEBGL);
  strokeWeight(6);
  const gl = this._renderer.GL;
  gl.disable(gl.DEPTH_TEST);
  background(0); // これで正しいです。最終的にはこれが必要になります。
}
function draw(){
  // マルチプル
  blendMode(MULTIPLY);
  fill(240,245,250);
  noStroke();
  plane(600);
  noFill();

  // ブレンド
  blendMode(BLEND);
  stroke(255);
  t=frameCount*TAU/480;
  rotate(t/2,[1,1,1]);
  rotate(t/3,[-1,1,1]);
  point(200*cos(t),200*sin(t),40*sin(t));
}
