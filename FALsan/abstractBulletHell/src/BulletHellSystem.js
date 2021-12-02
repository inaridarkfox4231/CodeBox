// Actorとかいろいろ

class Actor{
  constructor(x = 0, y = 0, graphicsObject = null){
    this.xPosition = x;
    this.yPosition = y;
    this.graphics = graphicsObject;
    this.properFrameCount = 0;
  }
  act(){
    this.properFrameCount++;
  }
  display(){
    this.graphics.display(xPosition, yPosition, rotationAngle);
  }
}

class Bullet extends Actor{
  constructor(x = 0, y = 0, graphicsObject = null){
    super();
    this.allocatedIndicator;
    this.belongingPool;
    this.allocationIdentifier;

    this.directionAngle = 0;
    this.speed = 0;
  }
  // override methods of PoolableObject
  isAllocated() {
    return allocatedIndicator;
  }
  setAllocated(indicator) {
    this.allocatedIndicator = indicator;
  }
  getBelongingPool() {
    return belongingPool;
  }
  setBelongingPool(pool) {
    this.belongingPool = pool;
  }
  getAllocationIdentifier() {
    return allocationIdentifier;
  }
  setAllocationIdentifier(id) {
    this.allocationIdentifier = id;
  }
  initialize() {
    this.graphics = null;
    this.xPosition = 0;
    this.yPosition = 0;
    this.rotationAngle = 0;
    this.rotationVelocity = 0;
    this.properFrameCount = 0;
    this.directionAngle = 0;
    this.speed = 0;
  act() {
      // Kill if out of screen
      if (this.xPosition < f || this.xPosition > width || this.yPosition < f || this.yPosition > height) mySystem.deadBulletList.add(this);

      // Deceleration
      if (this.speed > 3 * UNIT_SPEED) {
        this.speed -= (this.speed - 3 * UNIT_SPEED) * 0.05f;
        if (this.speed < 3.1 * UNIT_SPEED) this.speed = 3 * UNIT_SPEED;
      }

      this.xPosition += this.speed * cos(this.directionAngle);
      this.yPosition += this.speed * sin(this.directionAngle);
      this.rotationAngle += this.rotationVelocity;
      super.act();
    }
}











// 続きはまた今度

// ----------------------------------------------- //
abstract class Actor {
  ParticleGraphics graphics;

  float xPosition, yPosition;
  float rotationAngle, rotationVelocity;

  int properFrameCount;

  Actor(float x, float y, ParticleGraphics graphicsObject) {
    xPosition = x;
    yPosition = y;
    graphics = graphicsObject;
  }

  void act() {
    properFrameCount++;
  }

  void display() {
    graphics.display(xPosition, yPosition, rotationAngle);
  }
}

final class Bullet
  extends Actor
  implements Poolable
{
  boolean allocatedIndicator;
  ObjectPool belongingPool;
  int allocationIdentifier;

  float directionAngle;
  float speed;

  Bullet() {
    super(0f, 0f, null);
  }

  // override methods of PoolableObject
  public boolean isAllocated() {
    return allocatedIndicator;
  }
  public void setAllocated(boolean indicator) {
    allocatedIndicator = indicator;
  }
  public ObjectPool getBelongingPool() {
    return belongingPool;
  }
  public void setBelongingPool(ObjectPool pool) {
    belongingPool = pool;
  }
  public int getAllocationIdentifier() {
    return allocationIdentifier;
  }
  public void setAllocationIdentifier(int id) {
    allocationIdentifier = id;
  }
  public void initialize() {
    graphics = null;
    xPosition = 0f;
    yPosition = 0f;
    rotationAngle = 0f;
    rotationVelocity = 0f;
    properFrameCount = 0;
    directionAngle = 0f;
    speed = 0f;
  }


  void act() {
    // Kill if out of screen
    if (xPosition < 0f || xPosition > width || yPosition < 0f || yPosition > height) mySystem.deadBulletList.add(this);

    // Deceleration
    if (speed > 3f * UNIT_SPEED) {
      speed -= (speed - 3f * UNIT_SPEED) * 0.05f;
      if (speed < 3.1f * UNIT_SPEED) speed = 3f * UNIT_SPEED;
    }

    xPosition += speed * cos(directionAngle);
    yPosition += speed * sin(directionAngle);
    rotationAngle += rotationVelocity;
    super.act();
  }
}

final class Enemy
  extends Actor
{
  final ArrayList<Gun> gunList = new ArrayList<Gun>();
  final ArrayList<Action> actionList = new ArrayList<Action>();
  int actionIndex;
  Action currentAction;
  int currentActionFrameCount;

  Enemy(float x, float y, ParticleGraphics graphicsObject) {
    super(x, y, graphicsObject);
  }

  void act() {
    rotationAngle += rotationVelocity;

    actionList.get(actionIndex).execute(this);
    currentActionFrameCount++;
    if (currentActionFrameCount > currentAction.durationFrameCount) {
      actionIndex = (actionIndex + 1) % actionList.size();
      currentAction = actionList.get(actionIndex);
      currentActionFrameCount = 0;
    }

    super.act();
  }
}

final class Gun
  extends Actor
{
  ParticleGraphics firingBulletGraphics;

  float baseMuzzleDirectionAngle;
  float baseMuzzleSpeed;

  Gun(ParticleGraphics graphicsObject) {
    super(0f, 0f, graphicsObject);
    baseMuzzleDirectionAngle = HALF_PI;
    baseMuzzleSpeed = 10f * UNIT_SPEED;
  }

  void act() {
    rotationAngle += rotationVelocity;
  }

  void fire(float offsetMuzzleDirectionAngle, float speedFactor) {
    final Bullet newBullet = bulletPool.allocate();
    newBullet.xPosition = this.xPosition;
    newBullet.yPosition = this.yPosition;
    newBullet.graphics = firingBulletGraphics;
    newBullet.directionAngle = baseMuzzleDirectionAngle + offsetMuzzleDirectionAngle;
    newBullet.speed = baseMuzzleSpeed * speedFactor;
    newBullet.rotationVelocity = 0.5f * UNIT_ANGLE_SPEED;
    if (random(1f) < 0.5f) newBullet.rotationVelocity = -newBullet.rotationVelocity;
    mySystem.newBulletList.add(newBullet);
  }
  void fire() {
    fire(0f, 1f);
  }
}



final class BulletHellSystem {
  Enemy currentEnemy;
  final ArrayList<Gun> gunList;

  final ArrayList<Bullet> liveBulletList;
  final ArrayList<Bullet> newBulletList;
  final ArrayList<Bullet> deadBulletList;

  BulletHellSystem(int bulletListInitialCapacity) {
    liveBulletList = new ArrayList<Bullet>(bulletListInitialCapacity);
    newBulletList = new ArrayList<Bullet>(bulletListInitialCapacity);
    deadBulletList = new ArrayList<Bullet>(bulletListInitialCapacity);

    gunList = new ArrayList<Gun>();
  }

  void update() {
    currentEnemy.act();
    for (Bullet eachBullet : liveBulletList) {
      eachBullet.act();
    }
    for (Gun eachGun : gunList) {
      eachGun.act();
    }

    updateBulletList();
  }

  void updateBulletList() {
    if (deadBulletList.size() > 0) {
      for (Bullet eachInstance : deadBulletList) {
        liveBulletList.remove(eachInstance);
        bulletPool.deallocate(eachInstance);
      }
      deadBulletList.clear();
    }
    if (newBulletList.size() > 0) {
      for (Bullet eachInstance : newBulletList) {
        liveBulletList.add(eachInstance);
      }
      newBulletList.clear();
    }
  }

  void display() {
    imageMode(CENTER);
    for (Bullet eachBullet : liveBulletList) {
      eachBullet.display();
    }
    for (Gun eachGun : gunList) {
      eachGun.display();
    }
    currentEnemy.display();
  }
}

abstract class Action
{
  final int durationFrameCount;

  Action(float durationSecond) {
    durationFrameCount = int(durationSecond * IDEAL_FRAME_RATE);
  }

  abstract void execute(Enemy parentEnemy);

  void controlAllGuns(Enemy parentEnemy) {
    for (int gunIndex = 0; gunIndex < parentEnemy.gunList.size(); gunIndex++) {
      Gun eachGun = parentEnemy.gunList.get(gunIndex);
      controlGun(parentEnemy, eachGun, gunIndex);
    }
  }

  abstract void controlGun(Enemy parentEnemy, Gun eachGun, int gunIndex);
}
