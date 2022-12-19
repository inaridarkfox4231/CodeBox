let gl;

function setup(){
  createCanvas(400, 400, WEBGL);

  gl = this._renderer.GL;
  gl.enable(gl.CULL_FACE);
  gl.cullFace(gl.FRONT);

  background(128);
  fill(255, 128, 0);
  stroke(255);
  strokeWeight(3);
  directionalLight(255, 255, 255, 0, 0, -1);
  ambientLight(128);
  rotateX(TAU/8);
  rotateY(TAU/12);

  box(120);
}
