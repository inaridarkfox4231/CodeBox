function setup() {
  createCanvas(100, 100);
}

function draw() {
  colorMode(RGB);
  background(30);

  // create a bunch of circles that move in... circles!
  for (let i = 0; i < 10; i++) {
    let opacity = map(i, 0, 10, 0, 255);
    noStroke();
    fill(230, 250, 90, opacity);
    circle(
      30 * sin(frameCount / (30 - i)) + width / 2,
      30 * cos(frameCount / (30 - i)) + height / 2,
      10
    );
  }
}

// you can put it in the mousePressed function,
// or keyPressed for example
function keyPressed() {
  // this will download the first 5 seconds of the animation!
  if (key === 's') {
    saveGif('mySketch', 5, {delay:120});
  }
}
