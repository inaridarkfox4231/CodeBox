// lightingとcolorVertの共存を目指します。

// Per-vertex coloring not working
// when using lighting in immediateMode.

// p5.Geometry.

function setup() {
  createCanvas(400, 400, WEBGL);
  noStroke();
  fill(255);

  const _gl = this._renderer;

  let geom = new p5.Geometry();
  const v = createVector();
  geom.vertices.push(v.set(-100,-100,0).copy(), v.set(100,-100,0).copy(), v.set(100,100,0).copy(), v.set(-100,100,0).copy());
  geom.vertexColors.push(1,1,1,1, 1,0,0,1, 0,1,0,1, 0,0,1,1);
  geom.faces.push([0,1,2], [0,2,3]);
  geom.computeNormals();
  _gl.createBuffers("key", geom);

  //pointLight(0, 255, 255, 0, 0, 30);
  _gl.drawBuffers("key");
}
