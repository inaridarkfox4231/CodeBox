function setup(){
  createCanvas(400, 400, WEBGL);
  strokeWeight(3);

  const _gl = this._renderer;
  const geom = new p5.Geometry();
  geom.vertices = [createVector(-100, 0, 0), createVector(100, 0, 0)];
  geom.lineVertexColors = [1, 1, 1, 1, 0, 1, 0, 1];
  geom.edges = [[0, 1]];
  geom._edgesToVertices();
  _gl.createBuffers("customLine", geom);

  _gl.drawBuffers("customLine");
}
