// 区別がつかないのでこれで。

let gr;

const L1 = 3;
const L2 = 3;
const L3 = 4;
const L4 = 5;
const T = Math.PI*2/30;

function setup(){
  createCanvas(640, 640);
  gr = createGraphics(640, 640, WEBGL);
  gr.noStroke();
  textSize(20);
  textAlign(LEFT, TOP);

  noLoop();
}

function draw(){
  gr.clear();
  gr.background(0);

  gr.push();

  drawFrake(0, 0, 0, 242, 36, 242, 30);
  drawFrake(-160,-160,0, 0, 128, 244, 20);
  drawFrake(160, 160, 0, 0, 128, 244, 20);
  drawFrake(160, -160, 0, 128, 244, 0, 20);
  drawFrake(-160, 160, 0, 128, 244, 0, 20);
  drawFrake(-240,0,0, 244, 128, 0, 10);
  drawFrake(240, 0, 0, 244, 128, 0, 10);
  drawFrake(0, -240, 0, 28, 232, 244, 10);
  drawFrake(0, 240, 0, 28, 232, 244, 10);

  drawFrake(-80, 280, 0, 242, 232, 22, 5);
  drawFrake(80, 280, 0, 242, 232, 22, 5);
  drawFrake(-80, -280, 0, 242, 232, 22, 5);
  drawFrake(80, -280, 0, 242, 232, 22, 5);

  drawFrake(-280, 80, 0, 25, 128, 22, 5);
  drawFrake(280, 80, 0, 25, 128, 22, 5);
  drawFrake(-280, -80, 0, 25, 128, 22, 5);
  drawFrake(280, -80, 0, 25, 128, 22, 5);

  gr.pop();

  image(gr, 0, 0);

  fill(255);
  text(frameRate().toFixed(3), 5, 5);
  rect(5, 30, 5 + frameRate(), 10); // current fps.
  fill(255, 242, 36);
  rect(5, 40, 5 + 60, 10); // 60fps.
}

function drawFrake(x, y, z, r, g, b, s = 1){
  gr.translate(x, y, z);
  gr.scale(s);
  const rot = (millis()/1000)*TAU*0.2;
  gr.rotateZ(rot);
  gr.beginShape();
  gr.fill(255);
  gr.vertex(0,0);
  for(let i=0; i<30; i+=6){
    gr.fill(r, g, b);
    gr.bezierVertex(L1*cos(i*T),L1*sin(i*T),
                    L2*cos((i+1)*T),L2*sin((i+1)*T),
                    L3*cos((i+2)*T),L3*sin((i+2)*T));
    gr.fill(r, g, b);
    gr.quadraticVertex(L4*cos((i+3)*T),L4*sin((i+3)*T),
                       L3*cos((i+4)*T),L3*sin((i+4)*T));
    gr.fill(255);
    gr.bezierVertex(L2*cos((i+5)*T),L2*sin((i+5)*T),
                    L1*cos((i+6)*T),L1*sin((i+6)*T),0,0);
  }
  gr.endShape();
  gr.rotateZ(-rot);
  gr.scale(1/s);
  gr.translate(-x, -y, -z);
}
