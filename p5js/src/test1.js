// immediate mode uses vertex colors (light)
// lightがある状態でのimmediateの描画。色補間されることと_useVertexColorがtrueであることを
// 確かめればOK. これは以前の挙動とは異なるものです。

function setup(){
  const renderer = createCanvas(256, 256, WEBGL);

  directionalLight(255, 255, 255, 0, 0, -1);
  // diffuseFactor:0.73
  // so, expected color is (73, 0, 73, 255).

  beginShape();
  fill(200, 0, 0);
  vertex(-128, -128);
  fill(200, 0, 0);
  vertex(128, -128);
  fill(0, 0, 200);
  vertex(128, 128);
  fill(0, 0, 200);
  vertex(-128, 128);
  endShape(CLOSE);

  console.log(renderer._useVertexColor);
  console.log(get(128, 128));
}

/*
test('immediate mode uses vertex colors (light)', function(done) {
  const renderer = createCanvas(256, 256, myp5.WEBGL);

  myp5.directionalLight(255, 255, 255, 0, 0, -1);
  // diffuseFactor:0.73
  // so, expected color is (73, 0, 73, 255).

  myp5.beginShape();
  myp5.fill(200, 0, 0);
  myp5.vertex(-128, -128);
  myp5.fill(200, 0, 0);
  myp5.vertex(128, -128);
  myp5.fill(0, 0, 200);
  myp5.vertex(128, 128);
  myp5.fill(0, 0, 200);
  myp5.vertex(-128, 128);
  myp5.endShape(myp5.CLOSE);

  assert.equal(renderer._useVertexColor, true);
  assert.deepEqual(myp5.get(128, 128), [73, 0, 73, 255]);
  done();
});
*/
