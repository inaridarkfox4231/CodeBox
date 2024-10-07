// This tab is independent.
// Needs constant float IDEAL_FRAME_RATE
// Last update: 19. Sep. 2017

final class ViewAngleController
{
  final float halfWidth, halfHeight;
  float xRotationAngle, yRotationAngle, zRotationAngle;
  final float initialXRotationAngle;
  float fieldOfViewAngle;
  final float initialFieldOfViewAngle;
  final float aspectRatio;
  final float cameraXPosition, cameraYPosition;
  float cameraZPosition;
  final float centerXPosition, centerYPosition, centerZPosition;
  float nearestClippingPlaneZPosition, farthestClippingPlaneZPosition;

  final float unitAngle;

  ViewAngleController(float initXRot, float initFov, float unitAngleValue) {
    initialXRotationAngle = initXRot;
    initialFieldOfViewAngle = initFov;
    unitAngle = unitAngleValue;

    halfWidth = width * 0.5f;
    halfHeight = height * 0.5f;
    aspectRatio = float(width) / float(height);

    cameraXPosition = halfWidth;
    cameraYPosition = halfHeight;
    centerXPosition = halfWidth;
    centerYPosition = halfHeight;
    centerZPosition = 0f;

    initialize();
  }
  ViewAngleController() {
    this(QUARTER_PI, PI / 3f, (TWO_PI / 4f) / IDEAL_FRAME_RATE);
  }

  void initialize() {
    xRotationAngle = initialXRotationAngle;
    yRotationAngle = 0f;
    zRotationAngle = 0f;
    setFieldOfViewAngle(initialFieldOfViewAngle);
  }

  void addFieldOfViewAngle(float v) {
    setFieldOfViewAngle(fieldOfViewAngle + v * unitAngle);
  }
  void setFieldOfViewAngle(float v) {
    fieldOfViewAngle = v;
    cameraZPosition = cameraYPosition / tan(fieldOfViewAngle * 0.5f);
    nearestClippingPlaneZPosition = cameraZPosition * 0.1f;
    farthestClippingPlaneZPosition = cameraZPosition * 10f;
  }

  void addXRotationAngle(float v) {
    xRotationAngle += v * unitAngle;
  }
  void addYRotationAngle(float v) {
    yRotationAngle += v * unitAngle;
  }
  void addZRotationAngle(float v) {
    zRotationAngle += v * unitAngle;
  }

  void translateCoordinates() {
    translate(centerXPosition, centerYPosition, centerZPosition);
  }
  void rotateCoordinates() {
    rotateX(xRotationAngle);
    rotateY(yRotationAngle);
    rotateZ(zRotationAngle);
  }

  void applyPerspective() {
    perspective(fieldOfViewAngle, aspectRatio, nearestClippingPlaneZPosition, farthestClippingPlaneZPosition);
  }

  void checkKey() {
    if (!keyPressed) return;
    processKey();
  }

  void processKey() {
    if (key == CODED) {
      if (keyCode == UP) {
        addFieldOfViewAngle(-1f);
        return;
      }
      if (keyCode == DOWN) {
        addFieldOfViewAngle(+1f);
        return;
      }
      if (keyCode == LEFT) {
        addZRotationAngle(-1f);
        return;
      }
      if (keyCode == RIGHT) {
        addZRotationAngle(+1f);
        return;
      }
    }

    if (key == 'w') {
      addXRotationAngle(+1f);
      return;
    }
    if (key == 's') {
      addXRotationAngle(-1f);
      return;
    }
    if (key == 'a') {
      addYRotationAngle(-1f);
      return;
    }
    if (key == 'd') {
      addYRotationAngle(+1f);
      return;
    }
  }
}
