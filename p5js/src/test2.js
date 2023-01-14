// geom without vertex colors use curFillCol (noLight)
// lightなし、vertexColorsなしのgeometryの色は単純にセットした色になることを
// 確かめるとともにフラグチェック

function setup(){
  const renderer = createCanvas(256, 256, WEBGL);

  // expected center color is curFillColor.

  fill(200, 0, 200);
  rectMode(CENTER);
  rect(0, 0, width, height);

  console.log(renderer._useVertexColor);
  console.log(get(128, 128));
}

/*
test('geom without vertex colors use curFillCol (noLight)', function(done) {
  const renderer = createCanvas(256, 256, myp5.WEBGL);

  // expected center color is curFillColor.

  myp5.fill(200, 0, 200);
  myp5.rectMode(myp5.CENTER);
  myp5.rect(0, 0, myp5.width, myp5.height);

  assert.equal(renderer._useVertexColor, false);
  assert.deepEqual(myp5.get(128, 128), [200, 0, 200, 255]);
  done();
});
*/
