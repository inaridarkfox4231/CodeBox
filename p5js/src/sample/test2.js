// textOutput
function setup(){
  createCanvas(400, 400);
}
function draw(){
  describe("出力テキスト内容", LABEL);
  describeElement("項目0", "併用は", LABEL);
  describeElement("項目1", "可能です", LABEL);
  textOutput(LABEL);
  background("aquamarine");
  stroke(0);
  strokeWeight(4);
  fill(64, 128, 96);
  circle(100, 100, 40);

  fill(255, 0, 0);
  triangle(200, 0, 200, 200, 400, 200);
  fill(0, 255, 0);
  rect(40, 240, 80, 60);
  noStroke();
  fill(0, 0, 255);
  arc(250, 250, 80, 80, 0, PI);
}
