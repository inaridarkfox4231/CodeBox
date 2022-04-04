let _gl, gl;

function setup(){
  _gl = createCanvas(400, 400, WEBGL);
  gl = _gl.GL;
}

function draw(){
  _gl.clear(0.0, 0.5, 1.0, 1.0);
  noLoop();
}
