// Title: Fireworks
// Author: FAL
// Date: 13. Sep. 2017
// Made with Processing 3.3.6

// ちょっと暇があったら調べてみる

// p5.jsに落としてようやくスタートライン

// FadeActorDisplayer使われてないですね
// おそらくですけど18個くらいできてそのうち17個がshrink（収縮）して
// 消えてそれから残ったひとつがばーん！して225個くらいできてそれから
// さらに分裂してるみたいですね

const IDEAL_FRAME_RATE = 30;

let currentActorSystem;
let currentPhysicsSystem;
let actorPool;

let gradationBackground;

let fireworksBallBuilder;

function setup(){
  createCanvas(480, 480);
  background(0);

  frameRate(30);

  initialize();
  defineActorTypes();

  colorMode(HSB, 360, 100, 100, 100);
  //gradationBackground = new GradationBackground(width, height, color(240, 100, 10, 30), color(240, 100, 40, 30), 2);
//  fogBackground = new AlphaFogBackground(width, height, color(0, 0, 100), 0, 30, 0.005);
  noStroke();
}

function draw(){
   imageMode(CORNER);
  // よくわかんないけどはしっこ？によせてるぽい。単に背景おいてるだけだから
  // いかようにもできるよ
  //gradationBackground.display();
  background(0);

   imageMode(CENTER); // 中央揃え？
  translate(width * 0.5, 0);
  currentPhysicsSystem.update();
  currentActorSystem.run();

  actorPool.update();

  if (frameCount % 240 == 30){ launchFireworks(); }

  translate(-width * 0.5, 0);
  drawDebugInfo();
}

function initialize(){
  initializeObjectPool();

  currentActorSystem = new ActorSystem();
  currentPhysicsSystem = new PhysicsSystem();

  // Define environment
  currentPhysicsSystem.addForceField(new GravityForceField(currentPhysicsSystem.bodyList));
  currentPhysicsSystem.addForceField(new StableAtmosphereDragForceField(currentPhysicsSystem.bodyList));
}

function initializeObjectPool() {
  actorPool = new ObjectPool(4096);
  for(let i = 0; i < actorPool.poolSize; i++){
    let newObject = new Actor();
    newObject.belongingPool = actorPool;
    actorPool.add(newObject);
  }
}

function launchFireworks() {
  let ball = fireworksBallBuilder.build(random(-50, 50), height, 0, - 100 / 30);
  ball.lifetimeFrameCount = floor((4 + random(-0.5, 0.5)) * IDEAL_FRAME_RATE);
  currentActorSystem.registerNewActor(ball);
}

function drawDebugInfo() {
  fill(0, 0, 100);
  text(round(frameRate()) + " FPS", 10, 20);
  text(actorPool.index + " particles", 10, 40);
}

function defineActorTypes() {
  // Defining actor type: "BurningGunpowder"
  let burningGunpowderBuilder = new ActorBuilder();
  burningGunpowderBuilder.pool = actorPool;
  burningGunpowderBuilder.displayer = new ShrinkActorDisplayer(createLightImage(1, 1, 0.9, 1, 1, 10));
  burningGunpowderBuilder.component = new ImmutablePhysicsBodyComponent(0.005, 0.02);
  burningGunpowderBuilder.lifetimeFrameCount = floor(IDEAL_FRAME_RATE * 0.5);

  // Defining actor type: "FlashingGunpowder"
  let flashingGunpowderBuilder = new ActorBuilder();
  flashingGunpowderBuilder.pool = actorPool;
  flashingGunpowderBuilder.component = new ImmutablePhysicsBodyComponent(0.005, 0.02);
  flashingGunpowderBuilder.lifetimeFrameCount = floor(IDEAL_FRAME_RATE * 2.5);

  // Defining actor type: "GunpowderBall"
  let gunpowderBallBuilder = new ActorBuilder();
  gunpowderBallBuilder.pool = actorPool;
  gunpowderBallBuilder.component = new ImmutablePhysicsBodyComponent(0.2, 0.05);
  gunpowderBallBuilder.lifetimeFrameCount = int(IDEAL_FRAME_RATE * 4.5);
  gunpowderBallBuilder.actionList.add(new LeaveGunpowderFireAction(flashingGunpowderBuilder));

  let displayerCandidateList = new SimpleCrossReferenceArray();
  displayerCandidateList.add(new FlashActorDisplayer(createLightImage(1, 1, 1, 1, 1, 20)));  // White
  displayerCandidateList.add(new FlashActorDisplayer(createLightImage(1, 0.5, 0.5, 1, 1, 20)));  // Red
  displayerCandidateList.add(new FlashActorDisplayer(createLightImage(1, 0.75, 0.5, 1, 1, 20)));  // Orange
  displayerCandidateList.add(new FlashActorDisplayer(createLightImage(1, 1, 0.5, 1, 1, 20)));  // Yellow
//  displayerCandidateList.add(new FlashActorDisplayer(createLightImage(0.75, 1, 0.5, 1, 1, 20)));  // Yellowgreen
//  displayerCandidateList.add(new FlashActorDisplayer(createLightImage(0.5, 1, 0.5, 1, 1, 20)));  // Green
//  displayerCandidateList.add(new FlashActorDisplayer(createLightImage(0.5, 1, 0.75, 1, 1, 20)));  // Cyan Green
//  displayerCandidateList.add(new FlashActorDisplayer(createLightImage(0.5, 1, 1, 1, 1, 20)));  // Cyan blue
  displayerCandidateList.add(new FlashActorDisplayer(createLightImage(0.5, 0.75, 1, 1, 1, 20)));  // Sky blue
//  displayerCandidateList.add(new FlashActorDisplayer(createLightImage(0.5, 0.5, 1, 1, 1, 20)));  // Blue
  displayerCandidateList.add(new FlashActorDisplayer(createLightImage(0.75, 0.5, 1, 1, 1, 20)));  // Blue purple
//  displayerCandidateList.add(new FlashActorDisplayer(createLightImage(1, 0.5, 1, 1, 1, 20)));  // Purple
  displayerCandidateList.add(new FlashActorDisplayer(createLightImage(1, 0.5, 6, 1, 1, 20)));  // Magenta


  // Define actor type: "FireworksBall" (global builder)
  fireworksBallBuilder = new ActorBuilder();
  fireworksBallBuilder.pool = actorPool;
  fireworksBallBuilder.displayer = new ShrinkActorDisplayer(createLightImage(1, 1, 0.9, 1, 4, 20));
  fireworksBallBuilder.component = new ImmutablePhysicsBodyComponent(70, 0.03);
  let explode = new ExplodeFireAction(gunpowderBallBuilder);
  for(let currentObject of displayerCandidateList) {
    explode.displayerCandidateList.add(currentObject);
  }
  fireworksBallBuilder.actionList.add(explode);
  fireworksBallBuilder.actionList.add(new BurnFireAction(burningGunpowderBuilder));
}

function createLightImage(redFactor, greenFactor, blueFactor, alphaFactor, lightRadius, graphicsSize) {
  // Required: default colorMode(RGB, 255, 255, 255, 255);

  let halfSideLength = graphicsSize / 2;
  let newImage = createImage(graphicsSize, graphicsSize);
  newImage.loadPixels();

  for (let pixelYPosition = 0; pixelYPosition < graphicsSize; pixelYPosition++) {
    for (let pixelXPosition = 0; pixelXPosition < graphicsSize; pixelXPosition++) {
      // alphaRatio will be calculated from:
      let distanceFromCenter = max(sqrt(sq(halfSideLength - pixelXPosition) + sq(halfSideLength - pixelYPosition)), 1);  // should be 1 or more
      // Required conditions are:
      // (1) alphaRatio = factor / (distanceFromCenter ^ exponent)
      // (2) alphaRatio = 1 where distance = lightRadius
      // (3) alphaRatio = 1/255 where distance = halfSideLength (= border of this graphics screen)
      // Therefore,
      let exponent = ((log(255)) / log(halfSideLength)) / (1 - log(lightRadius) / log(halfSideLength));
      // and factor = (lightRadius ^ exponent)
      // Therefore alphaRatio = (lightRadius / distanceFromCenter) ^ exponent

      let alphaRatio = pow(lightRadius / distanceFromCenter, exponent);
      newImage.set(pixelXPosition, pixelYPosition, color(255 * redFactor, 255 * greenFactor, 255 * blueFactor, 255 * alphaFactor * alphaRatio));
    }
  }
  newImage.updatePixels();
  return newImage;
}

class ActorSystem{
  constructor() {
    // SimpleCrossReferenceArrayの方がいいかもしれない（addとかremoveとか出てくるし）
    // ていうか知りたいのは原理であってこのコード自体はどうでもいいのよね・・・
    this.liveActorList = new SimpleCrossReferenceArray();
    this.newActorList = new SimpleCrossReferenceArray();
    this.deadActorList = new SimpleCrossReferenceArray();
  }
  registerNewActor(obj) {
    this.newActorList.add(obj);
    obj.belongingActorSystem = this;
  }
  registerDeadActor(obj) {
    this.deadActorList.add(obj);
  }
  run(){
    this.updateActorList();
    this.display();
  }
  display(){
    this.liveActorList.loop("act");
  }
  updateActorList(){
    for(let currentObject of this.deadActorList){
      this.liveActorList.remove(currentObject);
      currentPhysicsSystem.removeBody(currentObject);
      currentObject.belongingPool.deallocate(currentObject);
    }
    this.deadActorList.clear();
    for(let currentObject of this.newActorList){
      this.liveActorList.add(currentObject);
      currentPhysicsSystem.addBody(currentObject);
    }
    this.newActorList.clear();
  }
}



// んー
class ActorDisplayer{
  constructor(img) {
    this.actorImage = img;
  }
  display(parentActor) {
    image(actorImage, parentActor.xPosition, parentActor.yPosition);
  }
}


class Action {
  constructor(){}
  execute(parentActor){}
}

// Generates new actor(s);
class FireAction extends Action{
  constructor(b){
    super();
    this.builder = b;
  }
}

class ActorBuilder{
  constructor(){
    this.displayer = null;
    this.actionList = new SimpleCrossReferenceArray();
    this.component;
    this.lifetimeFrameCount = 0;
    this.xPosition = 0;
    this.yPosition = 0;
    this.xVelocity = 0;
    this.yVelocity = 0;
    this.pool;
  }
  clone(){
    let clonedBuilder = new ActorBuilder();
    clonedBuilder.displayer = this.displayer;
    for(let currentObject of this.actionList){
      clonedBuilder.actionList.add(currentObject);
    }
    clonedBuilder.component = this.component;
    clonedBuilder.lifetimeFrameCount = this.lifetimeFrameCount;

    clonedBuilder.xPosition = this.xPosition;
    clonedBuilder.yPosition = this.yPosition;
    clonedBuilder.xVelocity = this.xVelocity;
    clonedBuilder.yVelocity = this.yVelocity;



    clonedBuilder.pool = this.pool;

    return clonedBuilder;
  }
  build(x, y, vx, vy){
    // undefinedでいいじゃん。なんなのよ。
    if(arguments.length === 0){
      x = this.xPosition;
      y = this.yPosition;
      vx = this.xVelocity;
      vy = this.yVelocity;
    }
    let newActor = this.pool.allocate();

    newActor.displayer = this.displayer;
    for(let currentObject of this.actionList){
      newActor.actionList.add(currentObject);
    }
    newActor.component = this.component;
    newActor.lifetimeFrameCount = this.lifetimeFrameCount;

    newActor.xPosition = x;
    newActor.yPosition = y;
    newActor.xVelocity = vx;
    newActor.yVelocity = vy;



    return newActor;
  }
}

class BurnFireAction extends FireAction{
  constructor(b) {
    super(b);
    this.burningTimeRatio = 0.6;
  }

  execute(parentActor) {



    if(parentActor.getProgressRatio() > this.burningTimeRatio){ return; }
    let burnRatio = (this.burningTimeRatio - parentActor.getProgressRatio()) / this.burningTimeRatio;

    let xOff = 3 * sin(3 * frameCount * TWO_PI / IDEAL_FRAME_RATE) * burnRatio;

    let newActor = this.builder.build(parentActor.xPosition + xOff, parentActor.yPosition, parentActor.xVelocity - xOff, parentActor.yVelocity);



    newActor.scaleFactor = burnRatio;
    parentActor.belongingActorSystem.registerNewActor(newActor);
  }
}

class ExplodeFireAction extends FireAction{
  constructor(b) {
    super(b);
    this.displayerCandidateList = new SimpleCrossReferenceArray();
  }
  execute(parentActor){
    if(parentActor.properFrameCount == floor(parentActor.lifetimeFrameCount * 0.99)){
      this.explode(parentActor, 400 / IDEAL_FRAME_RATE);
    }
    if(parentActor.properFrameCount == parentActor.lifetimeFrameCount){
      this.explode(parentActor, 150 / IDEAL_FRAME_RATE);
    }
  }
  explode(parentActor, initialSpeed){
    // Set the displayer of the child (GunpowderBall) randomly for the purpose of color variation
    let gunpowderBallDisplayer = this.displayerCandidateList.get(floor(random(this.displayerCandidateList.length)));

    let anglePartitionCount = 15;
    let unitAngle = TWO_PI / anglePartitionCount;

    // 225個同時に発生させているみたいです

    for(let i = 0; i < anglePartitionCount; i++){
      for(let k = 0; k < anglePartitionCount; k++){
        let newActor = this.builder.build();
        newActor.displayer = gunpowderBallDisplayer;
        newActor.xPosition = parentActor.xPosition;
        newActor.yPosition = parentActor.yPosition;

        let theta = (i + random(0.5)) * unitAngle;
        let phi = (k + random(0.5)) * unitAngle;
        newActor.xVelocity = initialSpeed * cos(theta) * cos(phi);
        newActor.yVelocity = initialSpeed * cos(theta) * sin(phi);

        parentActor.belongingActorSystem.registerNewActor(newActor);
      }
    }
  }
}

class LeaveGunpowderFireAction extends FireAction{
  constructor(b){
    super(b);
  }
  execute(parentActor) {

    if (random(1) < this.calculateFireProbability(parentActor)) {
      let newActor = this.builder.build(parentActor.xPosition, parentActor.yPosition, parentActor.xVelocity, parentActor.yVelocity);
      newActor.displayer = parentActor.displayer;
      parentActor.belongingActorSystem.registerNewActor(newActor);

    }
  }
  calculateFireProbability(parentActor) {
    if (parentActor.getProgressRatio() < 0.2){ return 0.1 * parentActor.getProgressRatio() * 5; }
    return 0.1 * parentActor.getFadeRatio();
  }
}

// User defined displayers
// 多分ちかちかする感じのあれ
// こっちは使われてる
class FlashActorDisplayer extends ActorDisplayer{
  constructor(img) {
    super(img);
  }
  display(parentActor) {
    if(random(1) < this.calculateDisplayProbability(parentActor)) {
      image(this.actorImage, parentActor.xPosition, parentActor.yPosition);
    }

  }
  calculateDisplayProbability(parentActor) {
    let fadeRatio = parentActor.getFadeRatio();
    if(fadeRatio > 0.5){ return 0.9; }
    return fadeRatio * 2 * 0.9;
  }
}

// 小さくなる？
class ShrinkActorDisplayer extends ActorDisplayer{
  constructor(img) {
    super(img);
    this.displayTimeRatio = 0.8;
  }
  display(parentActor) {
    if(parentActor.getProgressRatio() > this.displayTimeRatio) return;
    let shrinkRatio = (this.displayTimeRatio - parentActor.getProgressRatio()) / this.displayTimeRatio;
    push();
    translate(parentActor.xPosition, parentActor.yPosition);
    scale(parentActor.scaleFactor * pow(shrinkRatio, 0.5));
    image(this.actorImage, 0, 0);
    pop();
  }
}

// 使われてない？？？
class FadeActorDisplayer extends ActorDisplayer{
  constructor(img) {
    super(img);
  }
  display(parentActor){
    tint(color(0, 0, 100, 100 * pow(parentActor.getFadeRatio(), 0.5)));
    image(this.actorImage, parentActor.xPosition, parentActor.yPosition);
    noTint();
    console.log("error");noLoop();
  }
}

class ObjectPool{
  constructor(pSize = 256) {
    this.poolSize = pSize;
    this.pool = new SimpleCrossReferenceArray();
    this.temporalInstanceList = new SimpleCrossReferenceArray();
    this.index = 0;
    this.temporalInstanceCount = 0;
  }
  allocate(){
    if(this.isAllocatable() == false){
      console.log("Object pool allocation failed. Too many objects created!");
      // Need exception handling
      return null;
    }
    let allocatedInstance = this.pool.get(this.index);
    allocatedInstance.isAllocated = true; // Physics Bodyはpoolableのextendsなのでこのプロパティを付与するの忘れないでね
    this.index++;
    return allocatedInstance;
  }
  allocateTemporal(){
    let allocatedInstance = this.allocate();
    this.setTemporal(allocatedInstance);
    return allocatedInstance;
  }
  add(obj){
    this.pool.add(obj);
  }
  isAllocatable(){
    return this.index < this.poolSize;
  }
  deallocate(killedObject){
    if(!killedObject.isAllocated){
      return;
    }
    killedObject.initialize();
    killedObject.isAllocated = false;
    this.index--;
    this.pool.set(this.index, killedObject); // this.killedObjectになってました。馬鹿じゃん。
  }
  update(){
    while(this.temporalInstanceCount > 0){
      this.temporalInstanceCount--;
      this.deallocate(this.temporalInstanceList.get(this.temporalInstanceCount));
    }
    this.temporalInstanceList.clear(); // not needed when array.
  }
  setTemporal(obj){
    this.temporalInstanceList.add(obj);
    this.temporalInstanceCount++;
  }
}

class PhysicsBody{
  constructor(x = 0, y = 0){
    this.component = null;
    this.xPosition = x;
    this.yPosition = y;
    this.xVelocity = 0;
    this.yVelocity = 0;
    this.xAcceleration = 0; // ここを0で初期化しないといけなかったみたい
    this.yAcceleration = 0; // ここも
    this.isAllocated = false;
  }
  initialize() {
    this.component = null;
    this.xPosition = 0;
    this.yPosition = 0;
    this.xVelocity = 0;
    this.yVelocity = 0;
    this.xAcceleration = 0;
    this.yAcceleration = 0;
  }
  getMass() {
    return this.component.getMass();
  }
  getRadius() {  // Body is regarded as a simple sphere
    return this.component.getRadius();
  }
  applyForce(xForce, yForce) {

    this.xAcceleration += xForce / this.getMass();
    this.yAcceleration += yForce / this.getMass();
  }
  update() {

    this.component.update(this);
    this.xVelocity += this.xAcceleration;
    this.xAcceleration = 0;
    this.yVelocity += this.yAcceleration;
    this.yAcceleration = 0;
    this.xPosition += this.xVelocity;
    this.yPosition += this.yVelocity;

  }
}

class PhysicsBodyComponent{
  constructor(m, r){}
  update(body){}
  getMass(){}
  getRadius(){}
}

class ImmutablePhysicsBodyComponent extends PhysicsBodyComponent{
  constructor(m, r){
    super(m, r);
    this.mass = m;
    this.radius = r;
  }
  getMass(){
    return this.mass;
  }
  getRadius(){
    return this.radius;
  }
  update(body){}
}

class PropellantPhysicsBodyComponent extends PhysicsBodyComponent{
  constructor(m, r, exaustGasSpeed = 1, massChgRate = 1) {
    super(m, r);
    this.mass = m;
    this.radius = r;
    this.massChangeRate = massChgRate;
    this.thrustMagnitude = exaustGasSpeed * massChgRate; // Thrust |T| = v * (dm/dt) = exaustGasSpeed * massChangeRate
  }
  getMass() {
    return this.mass;
  }
  getRadius() {
    return this.radius;
  }
  update(body) {
    this.mass -= this.massChangeRate;

    let xTUnit, yTUnit, zTUnit;
    if(body.xVelocity == 0 && body.yVelocity == 0) { // 凡ミス
      xTUnit = 0;
      yTUnit = -1;
    }else{
      let bodyAbsV = sqrt(sq(body.xVelocity) + sq(body.yVelocity));
      xTUnit = body.xVelocity / bodyAbsV;
      yTUnit = body.yVelocity / bodyAbsV;
    }
    body.applyForce(this.thrustMagnitude * xTUnit, this.thrustMagnitude * yTUnit);

    if (this.mass < 0) ;  // should be fixed // ???
  }
}



class PhysicsForceField{
  constructor(bodies) {
    this.bodyList = bodies;
  }
  update(){};
}

class GravityForceField extends PhysicsForceField{
  constructor(bodies, g) {
    super(bodies);
    if(g == undefined){ g = 9.80665 / sq(IDEAL_FRAME_RATE); }
    this.gravityAcceleration = g;
  }
  update(){
    for(let currentBody of this.bodyList) {
      currentBody.yAcceleration += this.gravityAcceleration;
    }
  }
}

class DragForceField extends PhysicsForceField{
  constructor(bodies, d = 1, c = 1){
    super(bodies);
    this.dencity = d;
    this.coefficient = c;

    // drag force = 1/2 * dencity * |relative velocity|^2 * (frontal projected area = r^2 * PI) * (drag coefficient) * (unit vector of relative velocity)
    //            = v^2 * r^2 * factor * (unit vector of relative velocity)
    // relative velocity = velocity of the fluid in the rest frame of the body
    this.factor = 0.5 * this.dencity * PI * this.coefficient;
  }
  update(){};
  getXFluidVelocity(){};
  getYFluidVelocity(){};
  getXRelativeVelocity(body) {
    return this.getXFluidVelocity() - body.xVelocity;
  }
  getYRelativeVelocity(body) {
    return this.getYFluidVelocity() - body.yVelocity;
  }
  applyDragForce(body) {
    let xRelVel = this.getXRelativeVelocity(body);
    let yRelVel = this.getYRelativeVelocity(body);

    if(xRelVel == 0 && yRelVel == 0) return;

    // v = relative velocity of the fluid
    let vPow2 = sq(xRelVel) + sq(yRelVel);
    let vMag = sqrt(vPow2);
    let rPow2 = sq(body.getRadius());
    let forceMag = vPow2 * rPow2 * this.factor;
    let xVUnit = xRelVel / vMag;
    let yVUnit = yRelVel / vMag;
    body.applyForce(forceMag * xVUnit, forceMag * yVUnit);
  }
}

class StableAtmosphereDragForceField extends DragForceField{
  constructor(bodies, d = 1, c = 1) {
    super(bodies, d, c);
  }
  update() {
    for(let currentBody of this.bodyList) {
      this.applyDragForce(currentBody);
    }
  }
  getXFluidVelocity() {
    return 0;
  }
  getYFluidVelocity() {
    return 0;
  }
}

class PhysicsJoint{
  constructor(b1, b2) {
    this.body1 = b1;
    this.body2 = b2;
  }
  update() {
    // Omitted
  }
}



class PhysicsSystem{
  constructor(fr = 60, initialCapacity = 1024) {
    this.idealFrameRate = fr;
    this.bodyList = new SimpleCrossReferenceArray();
    this.jointList = new SimpleCrossReferenceArray();
    this.forceFieldList = new SimpleCrossReferenceArray();
  }
  update() {
    for(let currentObject of this.forceFieldList) {
      currentObject.update();
    }
    for(let currentObject of this.jointList) {
      currentObject.update();
    }
    for(let currentObject of this.bodyList) {
      currentObject.update();
    }
  }
  addBody(obj) {
    this.bodyList.add(obj);
  }
  removeBody(obj) {
    this.bodyList.remove(obj);
  }
  addJoint(obj) {
    this.jointList.add(obj);
  }
  removeJoint(obj) {
    this.jointList.remove(obj);
  }
  addForceField(obj) {
    this.forceFieldList.add(obj);
  }
  removeForceField(obj) {
    this.forceFieldList.remove(obj);
  }
}

// ------------------------------------------------------------ //

// This tab is independent.
// Required: colorMode(HSB, 360f, 100f, 100f, 100f);

class AbstractBackground{
  constructor(x, y) {
    this.xSize = (x !== undefined ? x : width);
    this.ySize = (y !== undefined ? y : height);
  }
  display(){};
}

class PreRenderedBackground extends AbstractBackground {
  constructor(x, y) {
    super(x, y);
    x = (x !== undefined ? x : width);
    y = (y !== undefined ? y : height);
    this.graphics = createImage(x, y);
  }
  display() {
    image(this.graphics, 0, 0);
  }
}

class GradationBackground extends PreRenderedBackground{
  constructor(x, y, aboveColor, belowColor, gradient) {
    super(x, y);
    if(aboveColor == undefined){ aboveColor = color(0, 0, 100); }
    if(belowColor == undefined){ belowColor = color(240, 20, 100); }
    if(gradient == undefined){ gradient = 1; }
    this.graphics.loadPixels();
    for (let xp = 0; xp < x; xp++) {
      for (let yp = 0; yp < y; yp++) {
        this.graphics.set(xp, yp, lerpColor(aboveColor, belowColor, pow(float(yp) / y, gradient)));
      }
    }
    this.graphics.updatePixels();
  }
}

// Simple Cross Reference Array.
// 改造する前のやつ。
class SimpleCrossReferenceArray extends Array{
  constructor(){
    super();
  }
  add(element){
    this.push(element);
    element.belongingArray = this; // 所属配列への参照
  }
  addMulti(elementArray){
    // 複数の場合
    elementArray.forEach((element) => { this.add(element); })
  }
  get(index){
    if(index >= this.length){ return undefined; }
    return this[index];
  }
  set(index, obj){
    this[index] = obj;
  }
  remove(element){
    let index = this.indexOf(element, 0);
    this.splice(index, 1); // elementを配列から排除する
  }
  loop(methodName, args = []){
    if(this.length === 0){ return; }
    // methodNameには"update"とか"display"が入る。まとめて行う処理。
    for(let i = 0; i < this.length; i++){
      this[i][methodName](...args);
    }
  }
  loopReverse(methodName, args = []){
    if(this.length === 0){ return; }
    // 逆から行う。排除とかこうしないとエラーになる。もうこりごり。
    for(let i = this.length - 1; i >= 0; i--){
      this[i][methodName](...args);
    }
  }
  clear(){
    this.length = 0;
  }
}

class Actor extends PhysicsBody{
  constructor(x = 0, y = 0){
    super(x, y);
    this.displayer;
    this.actionList = new SimpleCrossReferenceArray();
    this.lifetimeFrameCount = 0;
    this.properFrameCount = 0;
    this.belongingActorSystem;
    this.scaleFactor = 1;
  }
  initialize(){
    super.initialize();
    this.displayer = null;
    this.actionList.clear();
    this.lifetimeFrameCount = 0;
    this.properFrameCount = 0;
    this.belongingActorSystem = null;
    this.scaleFactor = 1;
  }
  act(){

    this.displayer.display(this);
    for(let currentObject of this.actionList){
      currentObject.execute(this);
    }
    this.properFrameCount++;
    if(this.properFrameCount > this.lifetimeFrameCount){ this.belongingActorSystem.registerDeadActor(this); }
  }
  getProgressRatio() {
    if(this.lifetimeFrameCount < 1){ return 0; }
    return Math.min(this.properFrameCount / this.lifetimeFrameCount, 1);
  }
  getFadeRatio() {
    return 1 - this.getProgressRatio();
  }
}
