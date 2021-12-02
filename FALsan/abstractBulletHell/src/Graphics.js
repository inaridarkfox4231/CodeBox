abstract class ParticleGraphics
{
  abstract void display(float xPosition, float yPosition, float rotationAngle);
}

final class ColorFieldParticleGraphics
  extends ParticleGraphics
{
  final PGraphics particleGraphics;
  final PGraphics shadowGraphics;
  final float graphicsXSize, graphicsYSize;
  final float graphicsRadius;

  ColorFieldParticleGraphics(int xSize, int ySize, float radius, color col, float brushWeight, int paintRepetitionCount) {
    particleGraphics = createColorFieldGraphics(xSize, ySize, col, brushWeight, paintRepetitionCount);
    graphicsXSize = xSize;
    graphicsYSize = ySize;
    graphicsRadius = radius;

    PGraphics maskGraphics = createGraphics(xSize, ySize);
    maskGraphics.beginDraw();
    maskGraphics.noStroke();
    maskGraphics.fill(0f);
    maskGraphics.rect(0f, 0f, xSize, ySize);
    maskGraphics.fill(255f);
    maskGraphics.rect(0f, 0f, xSize, ySize, radius);
    maskGraphics.endDraw();

    alternateMask(particleGraphics, maskGraphics);

    shadowGraphics = createGraphics(xSize, ySize);
    shadowGraphics.beginDraw();
    shadowGraphics.noStroke();
    shadowGraphics.fill(64f, 32f);
    shadowGraphics.rect(0f, 0f, xSize, ySize, radius);
    shadowGraphics.endDraw();
  }
  ColorFieldParticleGraphics() {
    this(64, 64, 8f, color(0f, 0f, 90f), 50f, 640);
  }

  void display(float xPosition, float yPosition, float rotationAngle) {
    noStroke();
    fill(64f, 32f);
    rectMode(CENTER);

    pushMatrix();
    translate(xPosition + 2f, yPosition + 4f);
    pushMatrix();
    rotate(rotationAngle);
    rect(0f, 0f, graphicsXSize, graphicsYSize, graphicsRadius);
    popMatrix();
    translate(-2f, -4f);
    rotate(rotationAngle);
    image(particleGraphics, 0f, 0f);
    popMatrix();
  }
}



PGraphics createColorFieldGraphics(int xSize, int ySize, color col, float brushWeight, int paintRepetitionCount) {
  PGraphics graphics = createGraphics(xSize, ySize);
  graphics.beginDraw();
  graphics.colorMode(HSB, 360f, 100f, 100f, 100f);
  graphics.background(0f, 0f, 100f);
  graphics.fill(col, 20f);
  graphics.noStroke();
  graphics.rect(0f, 0f, graphics.width, graphics.height);
  graphics.strokeWeight(brushWeight);

    for (int i = 0; i < paintRepetitionCount; i++) {
      graphics.stroke(col, 10f);
      float w = random(xSize * 0.1f, xSize * 0.5f);
      float x = random(0f, graphics.width);
      float y = random(-brushWeight, graphics.height + brushWeight);
      graphics.line(x - w * 0.5f, y, x + w * 0.5f, y);
    }
    for (int i = 0; i < paintRepetitionCount; i++) {
      graphics.stroke(col, 10f);
      float h = random(ySize * 0.1f, ySize * 0.5f);
      float x = random(-brushWeight, graphics.width + brushWeight);
      float y = random(0f, graphics.height);
      graphics.line(x, y - h * 0.5f, x, y + h * 0.5f);
    }

  graphics.endDraw();

  return graphics;
}



// from https://github.com/processing-js/processing-js/issues/149
void alternateMask(PImage p, PImage m) {
  m.loadPixels();
  p.loadPixels();
  for (int j=p.width*p.height-1; j >= 0; j--) {
    p.pixels[j] = p.pixels[j] & 0x00FFFFFF |    ((m.pixels[j] & 0x000000FF) << 24);
  }
  p.updatePixels();
}
