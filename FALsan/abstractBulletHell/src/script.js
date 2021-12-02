// Title: Abstract Bullet Hell
// Author: FAL
// Date: 20. Sep. 2017
// Made with Processing 3.3.6

const IDEAL_FRAME_RATE = 60;
const UNIT_SPEED = 60 / IDEAL_FRAME_RATE;
const UNIT_ANGLE_SPEED = TWO_PI / IDEAL_FRAME_RATE;

let mySystem;
let backgroundGraphics;
let bulletPool;

function setup(){
  createCanvas(640, 640);
  frameRate(IDEAL_FRAME_RATE);

  backgroundGraphics = createColorFieldGraphics(width, height, color(232), 100, 100);

  initializeObjectPool();

  mySystem = new BulletHellSystem(2048);
  prepareBulletSampleData(mySystem);
}

function draw(){
  image(backgroundGraphics, 0, 0);
  fill(0);

  if(mouseIsPressed){ text(frameRate, 20, 20); }

  mySystem.update();
  mySystem.display();

  bulletPool.update();
}

function initializeObjectPool(){
  bulletPool = new ObjectPool_Bullet(2048);
  for(let i = 0; i < bulletPool.poolSize; i++){
    bulletPool.storeObject(new Bullet());
  }
}

function prepareBulletHellSampleData(system){
  // Define enemy
   let enemyGraphics = new ColorFieldParticleGraphics(32, 32, 6, color("#273244"), 8, 90);  // dark gray
   let myEnemy = new Enemy(width * 0.5, height * 0.15, enemyGraphics);
   myEnemy.rotationVelocity = 0.1 * UNIT_ANGLE_SPEED;
   system.currentEnemy = myEnemy;

   // Define enemy actions
   let initialAction = new WaitAction();
   myEnemy.currentAction = initialAction;
   myEnemy.actionList.add(initialAction);
   myEnemy.actionList.add(new AroundDeployGunsAction());
   myEnemy.actionList.add(new SpiralFireAction());
   myEnemy.actionList.add(new WaitAction());
   myEnemy.actionList.add(new HoldGunsAction());
   myEnemy.actionList.add(new FrontDeployGunsAction());
   myEnemy.actionList.add(new LinearFireAction());
   myEnemy.actionList.add(new WaitAction());
   myEnemy.actionList.add(new HoldGunsAction());
   myEnemy.actionList.add(new AroundDeployGunsAction());
   myEnemy.actionList.add(new ComplexFireAction());
   myEnemy.actionList.add(new WaitAction());
   myEnemy.actionList.add(new HoldGunsAction());

   // Define enemy guns
   // Colors picked from:  https://www.pinterest.jp/pin/305400418459473335/
   let gunGraphics = new ColorFieldParticleGraphics(20, 20, 6, color("#b8b1a8"), 7, 70);  // gray
   let bulletGraphicsArray = new ColorFieldParticleGraphics[3];
   bulletGraphicsArray[0] = new ColorFieldParticleGraphics(12, 12, 4, color("#263de2"), 3, 50);  // blue
   bulletGraphicsArray[1] = new ColorFieldParticleGraphics(12, 12, 4, color("#b00101"), 3, 50);  // red
   bulletGraphicsArray[2] = new ColorFieldParticleGraphics(12, 12, 4, color("#d2a908"), 3, 50);  // yellow
   for (int i = 0; i < 6; i++) {
     let newGun = new Gun(gunGraphics);
     newGun.firingBulletGraphics = bulletGraphicsArray[i % 3];
     newGun.rotationVelocity = 0.1 * UNIT_ANGLE_SPEED;
     newGun.xPosition = myEnemy.xPosition;
     newGun.yPosition = myEnemy.yPosition;
     system.gunList.add(newGun);
     myEnemy.gunList.add(newGun);
   }
}

/*
// --------------------------original-------------------------------//
private static final float IDEAL_FRAME_RATE = 60f;
private static final float UNIT_SPEED = 60f / IDEAL_FRAME_RATE;
private static final float UNIT_ANGLE_SPEED = TWO_PI / IDEAL_FRAME_RATE;

BulletHellSystem mySystem;
PGraphics backgroundGraphics;
ObjectPool<Bullet> bulletPool;

void setup() {
  size(640, 640, P2D);
  frameRate(IDEAL_FRAME_RATE);

  backgroundGraphics = createColorFieldGraphics(width, height, color(232f), 100f, 100);

  initializeObjectPool();

  mySystem = new BulletHellSystem(2048);
  prepareBulletHellSampleData(mySystem);
}

void draw() {
  imageMode(CORNER);
  image(backgroundGraphics, 0f, 0f);
  fill(0);

  if (mousePressed) text(frameRate, 20f, 20f);

  mySystem.update();
  mySystem.display();

  bulletPool.update();
}

void initializeObjectPool() {
  bulletPool = new ObjectPool<Bullet>(2048);
  for (int i = 0; i < bulletPool.poolSize; i++) {
    bulletPool.storeObject(new Bullet());
  }
}

void prepareBulletHellSampleData(BulletHellSystem system) {
   // Define enemy
    ColorFieldParticleGraphics enemyGraphics = new ColorFieldParticleGraphics(32, 32, 6f, color(#273244), 8f, 90);  // dark gray
    Enemy myEnemy = new Enemy(width * 0.5f, height * 0.15f, enemyGraphics);
    myEnemy.rotationVelocity = 0.1f * UNIT_ANGLE_SPEED;
    system.currentEnemy = myEnemy;

    // Define enemy actions
    Action initialAction = new WaitAction();
    myEnemy.currentAction = initialAction;
    myEnemy.actionList.add(initialAction);
    myEnemy.actionList.add(new AroundDeployGunsAction());
    myEnemy.actionList.add(new SpiralFireAction());
    myEnemy.actionList.add(new WaitAction());
    myEnemy.actionList.add(new HoldGunsAction());
    myEnemy.actionList.add(new FrontDeployGunsAction());
    myEnemy.actionList.add(new LinearFireAction());
    myEnemy.actionList.add(new WaitAction());
    myEnemy.actionList.add(new HoldGunsAction());
    myEnemy.actionList.add(new AroundDeployGunsAction());
    myEnemy.actionList.add(new ComplexFireAction());
    myEnemy.actionList.add(new WaitAction());
    myEnemy.actionList.add(new HoldGunsAction());

    // Define enemy guns
  	// Colors picked from:  https://www.pinterest.jp/pin/305400418459473335/
    ColorFieldParticleGraphics gunGraphics = new ColorFieldParticleGraphics(20, 20, 6f, color(#b8b1a8), 7f, 70);  // gray
    ColorFieldParticleGraphics[] bulletGraphicsArray = new ColorFieldParticleGraphics[3];
    bulletGraphicsArray[0] = new ColorFieldParticleGraphics(12, 12, 4f, color(#263de2), 3f, 50);  // blue
    bulletGraphicsArray[1] = new ColorFieldParticleGraphics(12, 12, 4f, color(#b00101), 3f, 50);  // red
    bulletGraphicsArray[2] = new ColorFieldParticleGraphics(12, 12, 4f, color(#d2a908), 3f, 50);  // yellow
    for (int i = 0; i < 6; i++) {
      Gun newGun = new Gun(gunGraphics);
      newGun.firingBulletGraphics = bulletGraphicsArray[i % 3];
      newGun.rotationVelocity = 0.1f * UNIT_ANGLE_SPEED;
      newGun.xPosition = myEnemy.xPosition;
      newGun.yPosition = myEnemy.yPosition;
      system.gunList.add(newGun);
      myEnemy.gunList.add(newGun);
    }
}
*/
