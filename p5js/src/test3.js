// geom without vertex colors use curFillCol (light)
// lightあり、vertexColorsなしのgeometryの色は単純にセットした色の73％になることを
// 確かめるとともにフラグチェック

function setup(){
  const renderer = createCanvas(256, 256, WEBGL);

  directionalLight(255, 255, 255, 0, 0, -1);
  // diffuseFactor:0.73
  // so, expected color is (146, 0, 146, 255).

  fill(200, 0, 200);
  rectMode(CENTER);
  rect(0, 0, width, height);

  console.log(renderer._useVertexColor);
  console.log(get(128, 128));
}

/*
test('geom without vertex colors use curFillCol (noLight)', function(done) {
  const renderer = createCanvas(256, 256, myp5.WEBGL);

  directionalLight(255, 255, 255, 0, 0, -1);
  // diffuseFactor:0.73
  // so, expected color is (146, 0, 146, 255).

  myp5.fill(200, 0, 200);
  myp5.rectMode(myp5.CENTER);
  myp5.rect(0, 0, myp5.width, myp5.height);

  assert.equal(renderer._useVertexColor, false);
  assert.deepEqual(myp5.get(128, 128), [146, 0, 146, 255]);
  done();
});
*/
