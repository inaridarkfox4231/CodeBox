abstract class MoveGunsAction
  extends Action
{
  MoveGunsAction(float durationSecond) {
    super(durationSecond);
  }

  void execute(Enemy parentEnemy) {
    controlAllGuns(parentEnemy);
  }

  void moveGun(Gun eachGun, float targetXPosition, float targetYPosition, float easingFactor) {
    eachGun.xPosition += (targetXPosition - eachGun.xPosition) * 0.1f * UNIT_SPEED;
    eachGun.yPosition += (targetYPosition - eachGun.yPosition) * 0.1f * UNIT_SPEED;
  }
}

final class AroundDeployGunsAction
  extends MoveGunsAction
{
  AroundDeployGunsAction() {
    super(1.25f);
  }

  void controlGun(Enemy parentEnemy, Gun eachGun, int gunIndex) {
    final float gunPositionAngle = TWO_PI * (gunIndex / float(parentEnemy.gunList.size()));
    final float targetXPosition = parentEnemy.xPosition + 160f * cos(gunPositionAngle);
    final float targetYPosition = parentEnemy.yPosition +  60f * sin(gunPositionAngle);
    moveGun(eachGun, targetXPosition, targetYPosition, 0.02f);
  }
}

final class FrontDeployGunsAction
  extends MoveGunsAction
{
  FrontDeployGunsAction() {
    super(1.25f);
  }

  void controlGun(Enemy parentEnemy, Gun eachGun, int gunIndex) {
    final float targetXPosition = parentEnemy.xPosition + 80f * (gunIndex - (parentEnemy.gunList.size() - 1) * 0.5f);
    final float targetYPosition = parentEnemy.yPosition + 60f;
    moveGun(eachGun, targetXPosition, targetYPosition, 0.02f);
  }
}

final class HoldGunsAction
  extends MoveGunsAction
{
  HoldGunsAction() {
    super(0.5f);
  }

  void controlGun(Enemy parentEnemy, Gun eachGun, int gunIndex) {
    final float targetXPosition = parentEnemy.xPosition;
    final float targetYPosition = parentEnemy.yPosition;
    moveGun(eachGun, targetXPosition, targetYPosition, 0.9f);
  }
}

final class WaitAction
  extends Action
{
  WaitAction() {
    super(1f);
  }

  void execute(Enemy parentEnemy) {
  }
  void controlGun(Enemy parentEnemy, Gun eachGun, int gunIndex) {
  }
}



abstract class CyclicFireAction
  extends Action
{
  final int fireIntervalFrameCount;

  CyclicFireAction(float durationSecond, float fireFrequencyPerSecond) {
    super(durationSecond);
    fireIntervalFrameCount = int(IDEAL_FRAME_RATE / fireFrequencyPerSecond);
  }

  void execute(Enemy parentEnemy) {
    controlAllGuns(parentEnemy);
  }
}

final class SpiralFireAction
  extends CyclicFireAction
{
  SpiralFireAction() {
    super(4f, 30f);  // duration, fire frequency
  }

  void controlGun(Enemy parentEnemy, Gun eachGun, int gunIndex) {
    final float gunPositionAngle = TWO_PI * gunIndex / float(parentEnemy.gunList.size()) + 0.5f * parentEnemy.currentActionFrameCount * UNIT_ANGLE_SPEED;
    eachGun.xPosition = parentEnemy.xPosition + 160f * cos(gunPositionAngle);
    eachGun.yPosition = parentEnemy.yPosition +  60f * sin(gunPositionAngle);

    eachGun.baseMuzzleDirectionAngle = gunPositionAngle;
    if (parentEnemy.properFrameCount % fireIntervalFrameCount == 0) {
      eachGun.fire();
    }
  }
}
final class LinearFireAction
  extends CyclicFireAction
{
  LinearFireAction() {
    super(4f, 2f);  // duration, fire frequency
  }

  void controlGun(Enemy parentEnemy, Gun eachGun, int gunIndex) {
    eachGun.baseMuzzleDirectionAngle = HALF_PI;
    final float offsetMuzzleDirectionAngle = QUARTER_PI * sin(gunIndex * 1.1f * parentEnemy.currentActionFrameCount * UNIT_ANGLE_SPEED);

    if (parentEnemy.currentActionFrameCount % fireIntervalFrameCount == 0) {
      for (int bulletCount = 0; bulletCount < 5; bulletCount++) {
        eachGun.fire(offsetMuzzleDirectionAngle, 1f + 2f * bulletCount / 7f);
      }
    }
  }
}
final class ComplexFireAction
  extends CyclicFireAction
{
  ComplexFireAction() {
    super(4f, 20f);  // duration, fire frequency
  }

  void controlGun(Enemy parentEnemy, Gun eachGun, int gunIndex) {
    final float angleDisplacementVariable = parentEnemy.currentActionFrameCount * UNIT_ANGLE_SPEED;
    final float gunPositionAngle = TWO_PI * gunIndex / float(parentEnemy.gunList.size()) + 0.1f * angleDisplacementVariable;
    eachGun.xPosition = parentEnemy.xPosition + 160f * cos(gunPositionAngle) * (1f + 0.5f * sin(0.5f * angleDisplacementVariable));
    eachGun.yPosition = parentEnemy.yPosition +  60f * sin(gunPositionAngle) * (1f + 0.1f * sin(0.5f * angleDisplacementVariable));

    eachGun.baseMuzzleDirectionAngle = gunPositionAngle;
    if (parentEnemy.properFrameCount % fireIntervalFrameCount == 0) {
      eachGun.fire(0.5f * angleDisplacementVariable, 1.5f);
    }
  }
}
