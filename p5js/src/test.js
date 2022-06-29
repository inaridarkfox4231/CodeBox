let _gl, gl;

function setup(){
  _gl = createCanvas(400, 400, WEBGL);
  gl = _gl.GL;
}

function draw(){
  _gl.clear(0.0, 0.5, 1.0, 1.0);
  noLoop();
}
/*
Welcome to RendererGL Immediate Mode. Immediate mode is used for drawing custom shapes
from a set of vertices.  Immediate Mode is activated
when you call <a href="#/p5/beginShape">beginShape()</a> & de-activated when you call <a href="#/p5/endShape">endShape()</a>.
Immediate mode is a style of programming borrowed
from OpenGL's (now-deprecated) immediate mode.
It differs from p5.js' default, Retained Mode, which caches
geometries and buffers on the CPU to reduce the number of webgl
draw calls. Retained mode is more efficient & performative,
however, Immediate Mode is useful for sketching quick
geometric ideas.
Begin shape drawing.  This is a helpful way of generating
custom shapes quickly.  However in WEBGL mode, application
performance will likely drop as a result of too many calls to
<a href="#/p5/beginShape">beginShape()</a> / <a href="#/p5/endShape">endShape()</a>.  As a high performance alternative,
please use p5.js geometry primitives.
*/
