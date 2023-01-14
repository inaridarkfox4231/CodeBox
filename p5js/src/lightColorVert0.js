// lightingとcolorVertの共存を目指します。

// Per-vertex coloring not working
// when using lighting in immediateMode.

function setup() {
  createCanvas(400, 400, WEBGL);
  noStroke();

  //pointLight(0, 255, 255, 0, 0, 30);
  directionalLight(255, 255, 255, 0, 0, -1); // 75％になりますね。なぜ75％...？
  // 新しい仕様でも75％なので仕様ですね。次のバージョンでも75％です。しかしなぜ75％...？
  // おそらく73％. これdiffuseFactorですね。これが...そうですね。
  // 255 * 0.73 = 186.15
  // で、その186ですね。なるほど...
  // 128 * 0.73 = 93.44
  // だから186と93でアサーションすればいいです。
  // これはあれ、重ね掛けで明るくなりすぎないための処理なんですよね。

  beginShape();
  fill(255);
  vertex(-100,-100);
  fill(255,0,0);
  vertex(100,-100);
  fill(255,0,0);
  vertex(100,100);
  fill(255);
  vertex(-100,100);
  endShape();
  console.log(get(200,200));
}
