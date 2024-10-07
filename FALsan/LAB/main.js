// Title: CIELAB color space
// Author: FAL
// Made with Processing 3.3.6
/* Log:
    19. Sep. 2017  First version.
    30. Sep. 2017  Bug fix (CIELAB -> XYZ conversion method)
     1. Oct. 2017  Bug fix (Detected that calculation by processing.js may not be correct if you write float suffix (e.g. 2.4f), therefore deleted all suffixes in ColorConversion tab)
*/

private static final float IDEAL_FRAME_RATE = 30f;

final int lResolution = 10;
final int abResolution = 20;
final int dencity = 25;
color[][][] colorArray;
boolean[][][] validColorIndicatorArray;
boolean[] validLightnessIndicatorArray;

ViewAngleController myController;

void setup() {
  size(640, 640, P3D);
  frameRate(IDEAL_FRAME_RATE);
  background(0f);

  noStroke();

  myController = new ViewAngleController(HALF_PI * 0.7f, PI / 3f, (TWO_PI / 4f) / IDEAL_FRAME_RATE);
  prepareColorSpace(lResolution, abResolution, dencity);
}

void draw() {
  background(0f);
  ambientLight(96f, 96f, 96f);
  directionalLight(192f, 192f, 192f, 0, 0, -1);

  myController.addZRotationAngle(0.1f);
  myController.xRotationAngle = HALF_PI * 0.6f + QUARTER_PI * 0.5f * sin(0.01f * TWO_PI * frameCount / IDEAL_FRAME_RATE);
  myController.setFieldOfViewAngle((PI / 6f) * (1.25f + 0.25f * sin(0.01f * TWO_PI * frameCount / IDEAL_FRAME_RATE)));

  myController.applyPerspective();
  myController.translateCoordinates();
  myController.rotateCoordinates();

  for (int l = 0; l <= 100 / lResolution; l++) {
    if (validLightnessIndicatorArray[l] == false) continue;
    for (int a = 0; a < 256 / abResolution; a++) {
      for (int b = 0; b < 256 / abResolution; b++) {
        if (validColorIndicatorArray[l][a][b] == false) continue;
        fill(colorArray[l][a][b]);
        pushMatrix();
        float x = (a * abResolution - 128f) * 2f;
        float y = -(b * abResolution - 128f) * 2f;
        float z = (l * lResolution - 50f) * 3f;
        translate(x, y, z);
        sphere(5f);
        popMatrix();
      }
    }
  }
}


void prepareColorSpace(int lResolution, int abResolution, int dencity) {
  colorArray = new color[100 / lResolution + 1][255 / abResolution + 1][255 / abResolution + 1];
  validColorIndicatorArray = new boolean[100 / lResolution + 1][255 / abResolution + 1][255 / abResolution + 1];
  for (float r = 0f; int(r) <= 255; r += 255f / dencity) {
    for (float g = 0f; int(g) <= 255; g += 255f / dencity) {
      for (float b = 0f; int(b) <= 255; b += 255f / dencity) {
        CielabColor col = new LinearRgbColor(r, g, b, 255f).toXyzColor().toCielabColor();
        colorArray[int(col.lValue / lResolution)][int((col.aValue + 128) / abResolution)][int((col.bValue + 128) / abResolution)] = col.toColor();
        validColorIndicatorArray[int(col.lValue / lResolution)][int((col.aValue + 128) / abResolution)][int((col.bValue + 128) / abResolution)] = true;
      }
    }
  }

  validLightnessIndicatorArray = new boolean[100 / lResolution + 1];
  for (int l = 0; l <= 100 / lResolution; l++) {
    for (int a = 0; a < 256 / abResolution; a++) {
      for (int b = 0; b < 256 / abResolution; b++) {
        if (validColorIndicatorArray[l][a][b] == true) validLightnessIndicatorArray[l] = true;
      }
    }
  }
}
