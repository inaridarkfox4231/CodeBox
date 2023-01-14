// immediate mode uses vertex colors (noLight)
// lightが無い状態でのimmediateの描画。色補間されることと_useVertexColorがtrueであることを
// 確かめればOK.

function setup(){
  const renderer = createCanvas(256, 256, WEBGL);

  // upper color: (200, 0, 0, 255);
  // lower color: (0, 0, 200, 255);
  // expected center color: (100, 0, 100, 255);

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

// test!
/*
test('immediate mode uses vertex colors (noLight)', function(done) {
  const renderer = createCanvas(256, 256, myp5.WEBGL);

  // upper color: (200, 0, 0, 255);
  // lower color: (0, 0, 200, 255);
  // expected center color: (100, 0, 100, 255);

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
  assert.deepEqual(myp5.get(128, 128), [100, 0, 100, 255]);
  done();
});
*/
