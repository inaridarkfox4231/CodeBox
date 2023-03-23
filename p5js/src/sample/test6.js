function setup() {
  createCanvas(60, 60, WEBGL);
  console.log("--------------------------------------------------------------");
  pixelDensity(1.25);
  background(0,128,255);
  console.log(width,height);
  const gl = this._renderer.GL;
  console.log(gl.drawingBufferWidth, gl.drawingBufferHeight);

  console.log("----------------------------------------------");
  const gr = createGraphics(6000, 6000, WEBGL);
  gr.fill(255,0,0);
  gr.translate(3000,3000,0);
  gr.sphere(20);
  gr.save("saveTest4");
  //gr.save("test12"); // だめですね。5760x5760になってしまいました～
}

// pixelDensity(1)ならOKなんですが
// 1.1にするとだめですね
// 5760をくらう
// 1より大きいと既にダメ。んー...
// というかデフォルトキャンバスもだめ。んー...

// デフォルトが1.1を適用することによりなぜか
// 5760に戻されてますね
// 原因は不明...
