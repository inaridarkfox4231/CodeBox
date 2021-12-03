// Title: Fireworks
// Author: FAL
// Date: 13. Sep. 2017
// Made with Processing 3.3.6

// ちょっと暇があったら調べてみる

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
  gradationBackground = new GradationBackground(width, height, color(240, 100, 10, 30), color(240, 100, 40, 30), 2);
//  fogBackground = new AlphaFogBackground(width, height, color(0, 0, 100), 0, 30, 0.005);
  noStroke();
}

function draw(){
  // imageMode(CORNER);
  // よくわかんないけどはしっこ？によせてるぽい。単に背景おいてるだけだから
  // いかようにもできるよ
  gradationBackground.display();

  // imageMode(CENTER); // 中央揃え？
  translate(width * 0.5, 0);
  currentPhysicsSystem.update();
  currentActorSystem.run();

  actorPool.update();

  if (frameCount % 240 == 30){ launchFireworks(); }

  translate(-width * 0.5, 0);
  if (mousePressed){ drawDebugInfo(); }
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
  text(round(frameRate) + " FPS", 10, 20);
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
  gunpowderBallBuilder.component = new ImmutablePhysicsBodyComponent(0.2f, 0.05f);
  gunpowderBallBuilder.lifetimeFrameCount = int(IDEAL_FRAME_RATE * 4.5f);
  gunpowderBallBuilder.actionList.add(new LeaveGunpowderFireAction(flashingGunpowderBuilder));

  let displayerCandidateList = [];
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
  for(ActorDisplayer currentObject : displayerCandidateList) {
    explode.displayerCandidateList.add(currentObject);
  }
  fireworksBallBuilder.actionList.add(explode);
  fireworksBallBuilder.actionList.add(new BurnFireAction(burningGunpowderBuilder));
}

function createLightImage(redFactor, greenFactor, blueFactor, alphaFactor, lightRadius, graphicsSize) {
  // Required: default colorMode(RGB, 255, 255, 255, 255);

  let halfSideLength = graphicsSize / 2f;
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
      newImage.set(pixelXPosition, pixelYPosition, color(255f * redFactor, 255f * greenFactor, 255f * blueFactor, 255f * alphaFactor * alphaRatio));
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
    if(!x){ x = this.xPosition; }
    if(!y){ y = this.yPosition; }
    if(!vx){ vx = this.xVelocity; }
    if(!vy){ vy = this.yVelocity; }]
    
  }





  Actor build(float x, float y, float vx, float vy) {
    Actor newActor = (Actor)pool.allocate();
    newActor.displayer = this.displayer;
    for (Action currentObject : this.actionList) {
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



// ------------------------------------------------------------ //
private static final float IDEAL_FRAME_RATE = 30f;

ActorSystem currentActorSystem;
PhysicsSystem currentPhysicsSystem;
ObjectPool<Actor> actorPool;

AbstractBackground gradationBackground;
// AbstractBackground fogBackground;    // does not work in processing.js

ActorBuilder fireworksBallBuilder;

void setup() {
  size(480, 480, P2D);
  frameRate(IDEAL_FRAME_RATE);
  background(0f);

  initialize();          // Should be called BEFORE defineActorTypes()
  defineActorTypes();    // Should be called BEFORE colorMode()

  colorMode(HSB, 360f, 100f, 100f, 100f);
  gradationBackground = new GradationBackground(width, height, color(240f, 100f, 10f, 30f), color(240f, 100f, 40f, 30f), 2f);
//  fogBackground = new AlphaFogBackground(width, height, color(0f, 0f, 100f), 0f, 30f, 0.005f);

  noStroke();
}

void draw() {
  imageMode(CORNER);
  gradationBackground.display();
//  fogBackground.display();

  imageMode(CENTER);
  translate(width * 0.5f, 0f);
  currentPhysicsSystem.update();
  currentActorSystem.run();

  actorPool.update();

  if (frameCount % 240 == 30) launchFireworks();

  if (mousePressed) drawDebugInfo();
}
// ------------------------------------------------------------ //

void initialize() {
  initializeObjectPool();

  currentActorSystem = new ActorSystem();
  currentPhysicsSystem = new PhysicsSystem();

  // Define environment
  currentPhysicsSystem.addForceField(new GravityForceField(currentPhysicsSystem.bodyList));
  currentPhysicsSystem.addForceField(new StableAtmosphereDragForceField(currentPhysicsSystem.bodyList));
}

void initializeObjectPool() {
  actorPool = new ObjectPool<Actor>(4096);
  for (int i = 0; i < actorPool.poolSize; i++) {
    Actor newObject = new Actor();
    newObject.belongingPool = actorPool;
    actorPool.add(newObject);
  }
}

void launchFireworks() {
  Actor ball = fireworksBallBuilder.build(random(-50f, 50f), height, 0f, - 100f / IDEAL_FRAME_RATE);
  ball.lifetimeFrameCount = int((4f + random(-0.5f, 0.5f)) * IDEAL_FRAME_RATE);
  currentActorSystem.registerNewActor(ball);
}

void drawDebugInfo() {
  fill(0f, 0f, 100f);
  text(round(frameRate) + " FPS", 10f, 20f);
  text(actorPool.index + " particles", 10f, 40f);
}

// ------------------------------------------------------------ //

void defineActorTypes() {
  // Defining actor type: "BurningGunpowder"
  ActorBuilder burningGunpowderBuilder = new ActorBuilder();
  burningGunpowderBuilder.pool = actorPool;
  burningGunpowderBuilder.displayer = new ShrinkActorDisplayer(createLightImage(1f, 1f, 0.9f, 1f, 1f, 10));
  burningGunpowderBuilder.component = new ImmutablePhysicsBodyComponent(0.005f, 0.02f);
  burningGunpowderBuilder.lifetimeFrameCount = int(IDEAL_FRAME_RATE * 0.5f);

  // Defining actor type: "FlashingGunpowder"
  ActorBuilder flashingGunpowderBuilder = new ActorBuilder();
  flashingGunpowderBuilder.pool = actorPool;
  flashingGunpowderBuilder.component = new ImmutablePhysicsBodyComponent(0.005f, 0.02f);
  flashingGunpowderBuilder.lifetimeFrameCount = int(IDEAL_FRAME_RATE * 2.5f);

  // Defining actor type: "GunpowderBall"
  ActorBuilder gunpowderBallBuilder = new ActorBuilder();
  gunpowderBallBuilder.pool = actorPool;
  gunpowderBallBuilder.component = new ImmutablePhysicsBodyComponent(0.2f, 0.05f);
  gunpowderBallBuilder.lifetimeFrameCount = int(IDEAL_FRAME_RATE * 4.5f);
  gunpowderBallBuilder.actionList.add(new LeaveGunpowderFireAction(flashingGunpowderBuilder));

  ArrayList<ActorDisplayer> displayerCandidateList = new ArrayList<ActorDisplayer>();
  displayerCandidateList.add(new FlashActorDisplayer(createLightImage(1f, 1f, 1f, 1f, 1f, 20)));  // White
  displayerCandidateList.add(new FlashActorDisplayer(createLightImage(1f, 0.5f, 0.5f, 1f, 1f, 20)));  // Red
  displayerCandidateList.add(new FlashActorDisplayer(createLightImage(1f, 0.75f, 0.5f, 1f, 1f, 20)));  // Orange
  displayerCandidateList.add(new FlashActorDisplayer(createLightImage(1f, 1f, 0.5f, 1f, 1f, 20)));  // Yellow
//  displayerCandidateList.add(new FlashActorDisplayer(createLightImage(0.75f, 1f, 0.5f, 1f, 1f, 20)));  // Yellowgreen
//  displayerCandidateList.add(new FlashActorDisplayer(createLightImage(0.5f, 1f, 0.5f, 1f, 1f, 20)));  // Green
//  displayerCandidateList.add(new FlashActorDisplayer(createLightImage(0.5f, 1f, 0.75f, 1f, 1f, 20)));  // Cyan Green
//  displayerCandidateList.add(new FlashActorDisplayer(createLightImage(0.5f, 1f, 1f, 1f, 1f, 20)));  // Cyan blue
  displayerCandidateList.add(new FlashActorDisplayer(createLightImage(0.5f, 0.75f, 1f, 1f, 1f, 20)));  // Sky blue
//  displayerCandidateList.add(new FlashActorDisplayer(createLightImage(0.5f, 0.5f, 1f, 1f, 1f, 20)));  // Blue
  displayerCandidateList.add(new FlashActorDisplayer(createLightImage(0.75f, 0.5f, 1f, 1f, 1f, 20)));  // Blue purple
//  displayerCandidateList.add(new FlashActorDisplayer(createLightImage(1f, 0.5f, 1f, 1f, 1f, 20)));  // Purple
  displayerCandidateList.add(new FlashActorDisplayer(createLightImage(1f, 0.5f, 6f, 1f, 1f, 20)));  // Magenta


  // Define actor type: "FireworksBall" (global builder)
  fireworksBallBuilder = new ActorBuilder();
  fireworksBallBuilder.pool = actorPool;
  fireworksBallBuilder.displayer = new ShrinkActorDisplayer(createLightImage(1f, 1f, 0.9f, 1f, 4f, 20));
  fireworksBallBuilder.component = new ImmutablePhysicsBodyComponent(70f, 0.03f);
  ExplodeFireAction explode = new ExplodeFireAction(gunpowderBallBuilder);
  for(ActorDisplayer currentObject : displayerCandidateList) {
    explode.displayerCandidateList.add(currentObject);
  }
  fireworksBallBuilder.actionList.add(explode);
  fireworksBallBuilder.actionList.add(new BurnFireAction(burningGunpowderBuilder));
}



final PImage createLightImage(float redFactor, float greenFactor, float blueFactor, float alphaFactor, float lightRadius, int graphicsSize) {
  // Required: default colorMode(RGB, 255, 255, 255, 255);

  float halfSideLength = graphicsSize / 2f;
  PImage newImage = createImage(graphicsSize, graphicsSize, ARGB);

  for (int pixelYPosition = 0; pixelYPosition < graphicsSize; pixelYPosition++) {
    for (int pixelXPosition = 0; pixelXPosition < graphicsSize; pixelXPosition++) {
      // alphaRatio will be calculated from:
      float distanceFromCenter = max(sqrt(sq(halfSideLength - pixelXPosition) + sq(halfSideLength - pixelYPosition)), 1f);  // should be 1 or more
      // Required conditions are:
      // (1) alphaRatio = factor / (distanceFromCenter ^ exponent)
      // (2) alphaRatio = 1 where distance = lightRadius
      // (3) alphaRatio = 1/255 where distance = halfSideLength (= border of this graphics screen)
      // Therefore,
      float exponent = ((log(255)) / log(halfSideLength)) / (1f - log(lightRadius) / log(halfSideLength));
      // and factor = (lightRadius ^ exponent)
      // Therefore alphaRatio = (lightRadius / distanceFromCenter) ^ exponent

      float alphaRatio = pow(lightRadius / distanceFromCenter, exponent);
      newImage.pixels[pixelXPosition + pixelYPosition * graphicsSize] = color(255f * redFactor, 255f * greenFactor, 255f * blueFactor, 255f * alphaFactor * alphaRatio);
    }
  }
  return newImage;
}

// This tab is dependent on Physics3D.pde and ObjectPool.pde

final class ActorSystem
{
  final ArrayList<Actor> liveActorList;
  final ArrayList<Actor> newActorList;
  final ArrayList<Actor> deadActorList;

  ActorSystem(int initialCapacity) {
    liveActorList = new ArrayList<Actor>(initialCapacity);
    newActorList = new ArrayList<Actor>(initialCapacity);
    deadActorList = new ArrayList<Actor>(initialCapacity);
  }
  ActorSystem() {
    this(16);
  }

  void registerNewActor(Actor obj) {
    newActorList.add(obj);
    obj.belongingActorSystem = this;
  }
  void registerDeadActor(Actor obj) {
    deadActorList.add(obj);
  }

  void run() {
    updateActorList();
    display();
  }

  void display() {
    for (Actor currentObject : liveActorList) {
      currentObject.act();
    }
  }

  void updateActorList() {
    for (Actor currentObject : deadActorList) {
      liveActorList.remove(currentObject);
      currentPhysicsSystem.removeBody(currentObject);
      currentObject.belongingPool.deallocate(currentObject);
    }
    deadActorList.clear();
    for (Actor currentObject : newActorList) {
      liveActorList.add(currentObject);
      currentPhysicsSystem.addBody(currentObject);
    }
    newActorList.clear();
  }
}



class Actor
  extends PhysicsBody
{
  ActorDisplayer displayer;
  ArrayList<Action> actionList = new ArrayList<Action>();
  int lifetimeFrameCount;
  int properFrameCount;
  ActorSystem belongingActorSystem;
  float scaleFactor = 1f;

  Actor(float x, float y) {
    super(x, y);
  }
  Actor() {
    this(0f, 0f);
  }

  void initialize() {
    super.initialize();
    displayer = null;
    actionList.clear();
    lifetimeFrameCount = 0;
    properFrameCount = 0;
    belongingActorSystem = null;
    scaleFactor = 1f;
  }

  void act() {
    displayer.display(this);
    for (Action currentObject : actionList) {
      currentObject.execute(this);
    }
    properFrameCount++;
    if (properFrameCount > lifetimeFrameCount) belongingActorSystem.registerDeadActor(this);
  }

  float getProgressRatio() {
    if (lifetimeFrameCount < 1f) return 0f;
    return min(properFrameCount / float(lifetimeFrameCount), 1f);
  }
  float getFadeRatio() {
    return 1f - getProgressRatio();
  }
}


class ActorDisplayer {
  final PImage actorImage;


  ActorDisplayer(PImage img) {
    actorImage = img;
  }

  void display(Actor parentActor) {
    image(actorImage, parentActor.xPosition, parentActor.yPosition);
  }
}


abstract class Action {
  Action() {
  }

  abstract void execute(Actor parentActor);
}

// Generates new actor(s);
abstract class FireAction extends Action {
  final ActorBuilder builder;

  FireAction(ActorBuilder b) {
    builder = b;
  }
}

final class ActorBuilder {
  ActorDisplayer displayer = null;
  final ArrayList<Action> actionList = new ArrayList<Action>();
  PhysicsBodyComponent component;
  int lifetimeFrameCount;

  float xPosition, yPosition;
  float xVelocity, yVelocity;

  ObjectPool pool;

  ActorBuilder() {
  }

  ActorBuilder clone() {
    ActorBuilder clonedBuilder = new ActorBuilder();
    clonedBuilder.displayer = this.displayer;
    for (Action currentObject : this.actionList) {
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

  Actor build() {
    return build(this.xPosition, this.yPosition, this.xVelocity, this.yVelocity);
  }
  Actor build(float x, float y, float vx, float vy) {
    Actor newActor = (Actor)pool.allocate();
    newActor.displayer = this.displayer;
    for (Action currentObject : this.actionList) {
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



// This tab is independent.
// Required: colorMode(HSB, 360f, 100f, 100f, 100f);

abstract class AbstractBackground {
  final float xSize, ySize;

  AbstractBackground(int x, int y) {
    xSize = x;
    ySize = y;
  }
  AbstractBackground() {
    this(width, height);
  }

  abstract void display();
}

class SolidBackground extends AbstractBackground {
  final color backgroundColor;

  SolidBackground(int x, int y, color c) {
    backgroundColor = c;
  }
  SolidBackground(int x, int y) {
    this(x, y, color(0f, 0f, 100f));
  }
  SolidBackground() {
    this(width, height);
  }

  void display() {
    pushStyle();
    fill(backgroundColor);
    noStroke();
    rect(0f, 0f, xSize, ySize);
    popStyle();
  }
}

abstract class PreRenderedBackground extends AbstractBackground {
  final PImage graphics;

  PreRenderedBackground(int x, int y) {
    graphics = createImage(x, y, ARGB);
  }
  PreRenderedBackground() {
    this(width, height);
  }

  void display() {
    image(graphics, 0f, 0f);
  }
}

abstract class FogBackground extends PreRenderedBackground {
  FogBackground(int x, int y, color baseColor, float baseBrightness, float noiseBrightness, float noiseIncrement) {
    super(x, y);
    createFog(x, y, baseColor, baseBrightness, noiseBrightness, noiseIncrement);
  }
  FogBackground(int x, int y) {
    this(x, y, color(0f, 0f, 0f), 70f, 30f, 0.01f);
  }
  FogBackground() {
    this(width, height);
  }

  void createFog(int x, int y, color baseColor, float baseBrightness, float noiseBrightness, float noiseIncrement) {
    graphics.loadPixels();
    float xoff = 0.0;
    for (int xp = 0; xp < x; xp++) {
      xoff += noiseIncrement;
      float yoff = 0.0;
      for (int yp = 0; yp < y; yp++) {
        yoff += noiseIncrement;
        float bright = constrain(baseBrightness + noise(xoff, yoff) * noiseBrightness, 0f, 100f);
        graphics.pixels[xp + yp * x] = getPixelColor(baseColor, bright);
      }
    }
    graphics.updatePixels();
  }

  abstract color getPixelColor(color baseColor, float bright);
}

class OpaqueFogBackground extends FogBackground {
  OpaqueFogBackground(int x, int y, color baseColor, float baseBrightness, float noiseBrightness, float noiseIncrement) {
    super(x, y, baseColor, baseBrightness, noiseBrightness, noiseIncrement);
  }
  OpaqueFogBackground(int x, int y) {
    this(x, y, color(0f, 0f, 0f), 70f, 30f, 0.01f);
  }
  OpaqueFogBackground() {
    this(width, height);
  }

  color getPixelColor(color baseColor, float bright) {
    return color(hue(baseColor), saturation(baseColor), bright);
  }
}

class AlphaFogBackground extends FogBackground {
  AlphaFogBackground(int x, int y, color baseColor, float baseBrightness, float noiseBrightness, float noiseIncrement) {
    super(x, y, baseColor, baseBrightness, noiseBrightness, noiseIncrement);
  }
  AlphaFogBackground(int x, int y) {
    this(x, y, color(0f, 0f, 100f), 70f, 30f, 0.01f);
  }
  AlphaFogBackground() {
    this(width, height);
  }

  color getPixelColor(color baseColor, float bright) {
    return color(baseColor, bright);
  }
}

class GradationBackground extends PreRenderedBackground {
  GradationBackground(int x, int y, color aboveColor, color belowColor, float gradient) {
    super(x, y);
    graphics.loadPixels();
    for (int xp = 0; xp < x; xp++) {
      for (int yp = 0; yp < y; yp++) {
        graphics.pixels[xp + yp * x] = lerpColor(aboveColor, belowColor, pow(float(yp) / y, gradient));
      }
    }
    graphics.updatePixels();
  }
  GradationBackground(int x, int y) {
    this(x, y, color(0f, 0f, 100f), color(240f, 20f, 100f), 1f);
  }
  GradationBackground() {
    this(width, height);
  }
}


// User defined actions

final class BurnFireAction extends FireAction {
  final float burningTimeRatio = 0.6f;

  BurnFireAction(ActorBuilder b) {
    super(b);
  }

  void execute(Actor parentActor) {
    if (parentActor.getProgressRatio() > burningTimeRatio) return;
    final float burnRatio = (burningTimeRatio - parentActor.getProgressRatio()) / burningTimeRatio;

    final float xOff = 3f * sin(3f * frameCount * TWO_PI / IDEAL_FRAME_RATE) * burnRatio;
    final Actor newActor = builder.build(parentActor.xPosition + xOff, parentActor.yPosition, parentActor.xVelocity - xOff, parentActor.yVelocity);
    newActor.scaleFactor = burnRatio;
    parentActor.belongingActorSystem.registerNewActor(newActor);
  }
}

final class ExplodeFireAction extends FireAction {
  final ArrayList<ActorDisplayer> displayerCandidateList = new ArrayList<ActorDisplayer>();

  ExplodeFireAction(ActorBuilder b) {
    super(b);
  }

  void execute(Actor parentActor) {
    if(parentActor.properFrameCount == int(parentActor.lifetimeFrameCount * 0.99f)) {
      explode(parentActor, 400f / IDEAL_FRAME_RATE);
    }
    if(parentActor.properFrameCount == parentActor.lifetimeFrameCount) {
      explode(parentActor, 150f / IDEAL_FRAME_RATE);
    }
  }

  void explode(Actor parentActor, float initialSpeed) {
    // Set the displayer of the child (GunpowderBall) randomly for the purpose of color variation
    final ActorDisplayer gunpowderBallDisplayer = displayerCandidateList.get(int(random(displayerCandidateList.size())));

    final int anglePartitionCount = 15;
    final float unitAngle = TWO_PI / anglePartitionCount;
    for (int i = 0; i < anglePartitionCount; i++) {
      for (int k = 0; k < anglePartitionCount; k++) {
        final Actor newActor = builder.build();
        newActor.displayer = gunpowderBallDisplayer;
        newActor.xPosition = parentActor.xPosition;
        newActor.yPosition = parentActor.yPosition;

        final float theta = (i + random(0.5f)) * unitAngle;
        final float phi = (k + random(0.5f)) * unitAngle;
        newActor.xVelocity = initialSpeed * cos(theta) * cos(phi);
        newActor.yVelocity = initialSpeed * cos(theta) * sin(phi);

        parentActor.belongingActorSystem.registerNewActor(newActor);
      }
    }
  }
}

final class LeaveGunpowderFireAction
  extends FireAction
{
  LeaveGunpowderFireAction(ActorBuilder b) {
    super(b);
  }

  void execute(Actor parentActor) {
    if (random(1f) < calculateFireProbability(parentActor)) {
      final Actor newActor = builder.build(parentActor.xPosition, parentActor.yPosition, parentActor.xVelocity, parentActor.yVelocity);
      newActor.displayer = parentActor.displayer;
      parentActor.belongingActorSystem.registerNewActor(newActor);
    }
  }

  float calculateFireProbability(Actor parentActor) {
    if (parentActor.getProgressRatio() < 0.2f) return 0.1f * parentActor.getProgressRatio() * 5f;
    return 0.1f * parentActor.getFadeRatio();
  }
}



// User defined displayers

final class FlashActorDisplayer extends ActorDisplayer {
  FlashActorDisplayer(PImage img) {
    super(img);
  }

  void display(Actor parentActor) {
    if(random(1f) < calculateDisplayProbability(parentActor)) {
      image(actorImage, parentActor.xPosition, parentActor.yPosition);
    }
  }

  float calculateDisplayProbability(Actor parentActor) {
    final float fadeRatio = parentActor.getFadeRatio();
    if (fadeRatio > 0.5f) return 0.9f;
    return fadeRatio * 2f * 0.9f;
  }
}

final class ShrinkActorDisplayer extends ActorDisplayer {
  float displayTimeRatio = 0.8f;

  ShrinkActorDisplayer(PImage img) {
    super(img);
  }

  void display(Actor parentActor) {
    if(parentActor.getProgressRatio() > displayTimeRatio) return;
    final float shrinkRatio = (displayTimeRatio - parentActor.getProgressRatio()) / displayTimeRatio;

    pushMatrix();
    translate(parentActor.xPosition, parentActor.yPosition);
    scale(parentActor.scaleFactor * pow(shrinkRatio, 0.5f));
    image(actorImage, 0f, 0f);
    popMatrix();
  }
}

final class FadeActorDisplayer extends ActorDisplayer {
  FadeActorDisplayer(PImage img) {
    super(img);
  }

  void display(Actor parentActor) {
    tint(color(0f, 0f, 100f, 100f * pow(parentActor.getFadeRatio(), 0.5f)));
    image(actorImage, parentActor.xPosition, parentActor.yPosition);
    noTint();
  }
}



abstract class PoolableObject
{
  public boolean isAllocated;
  public ObjectPool belongingPool;

  abstract void initialize();
}


final class ObjectPool<T extends PoolableObject>
{
  final int poolSize;
  final ArrayList<T> pool;
  int index = 0;
  final ArrayList<T> temporalInstanceList;
  int temporalInstanceCount = 0;

  ObjectPool(int pSize) {
    poolSize = pSize;
    pool = new ArrayList<T>(pSize);
    temporalInstanceList = new ArrayList<T>(pSize);
  }

  ObjectPool() {
    this(256);
  }

  T allocate() {
    if (isAllocatable() == false) {
      println("Object pool allocation failed. Too many objects created!");
      // Need exception handling
      return null;
    }
    T allocatedInstance = pool.get(index);

    allocatedInstance.isAllocated = true;
    index++;

    return allocatedInstance;
  }

  T allocateTemporal() {
    T allocatedInstance = allocate();
    setTemporal(allocatedInstance);
    return allocatedInstance;
  }

  void add(T obj) {
    pool.add(obj);
  }

  boolean isAllocatable() {
    return index < poolSize;
  }

  void deallocate(T killedObject) {
    if (!killedObject.isAllocated) {
      return;
    }
    killedObject.initialize();
    killedObject.isAllocated = false;
    index--;
    pool.set(index, killedObject);
  }

  void update() {
    while(temporalInstanceCount > 0) {
      temporalInstanceCount--;
      deallocate(temporalInstanceList.get(temporalInstanceCount));
    }
    temporalInstanceList.clear();    // not needed when array
  }

  void setTemporal(T obj) {
    temporalInstanceList.add(obj);    // set when array
    temporalInstanceCount++;
  }
}



// This tab is dependent on ObjectPool.pde

class PhysicsBody extends PoolableObject
{
  PhysicsBodyComponent component;

  float xPosition, yPosition;
  float xVelocity, yVelocity;
  float xAcceleration, yAcceleration;

  PhysicsBody(float x, float y) {
    xPosition = x;
    yPosition = y;
  }
  PhysicsBody() {
    this(0f, 0f);
  }

  void initialize() {
    component = null;
    xPosition = 0f;
    yPosition = 0f;
    xVelocity = 0f;
    yVelocity = 0f;
    xAcceleration = 0f;
    yAcceleration = 0f;
  }

  float getMass() {
    return component.getMass();
  }
  float getRadius() {  // Body is regarded as a simple sphere
    return component.getRadius();
  }

  void applyForce(float xForce, float yForce) {
    xAcceleration += xForce / getMass();
    yAcceleration += yForce / getMass();
  }

  void update() {
    component.update(this);
    xVelocity += xAcceleration;
    xAcceleration = 0;
    yVelocity += yAcceleration;
    yAcceleration = 0;
    xPosition += xVelocity;
    yPosition += yVelocity;
  }
}

abstract class PhysicsBodyComponent
{
  PhysicsBodyComponent(float m, float r) {
  }

  abstract void update(PhysicsBody body);

  abstract float getMass();
  abstract float getRadius();
}

class ImmutablePhysicsBodyComponent extends PhysicsBodyComponent
{
  final float mass;
  final float radius;  // regard as a simple sphere

  ImmutablePhysicsBodyComponent(float m, float r) {
    super(m, r);
    mass = m;
    radius = r;
  }

  float getMass() {
    return mass;
  }
  float getRadius() {
    return radius;
  }

  void update(PhysicsBody body) {
  }
}

class PropellantPhysicsBodyComponent extends PhysicsBodyComponent
{
  float mass;
  final float radius;  // regard as a simple sphere
  final float massChangeRate;
  final float thrustMagnitude;  // Thrust |T| = v * (dm/dt) = exaustGasSpeed * massChangeRate

  PropellantPhysicsBodyComponent(float m, float r, float exaustGasSpeed, float massChgRate) {
    super(m, r);
    mass = m;
    radius = r;
    massChangeRate = massChgRate;
    thrustMagnitude = exaustGasSpeed * massChgRate;
  }
  PropellantPhysicsBodyComponent(float m, float r) {
    this(m, r, 1f, 1f);
  }

  float getMass() {
    return mass;
  }
  float getRadius() {
    return radius;
  }

  void update(PhysicsBody body) {
    mass -= massChangeRate;

    float xTUnit, yTUnit, zTUnit;
    if(body.xVelocity == 0f && body.xVelocity == 0f) {
      xTUnit = 0f;
      yTUnit = -1f;
    }
    else {
      float bodyAbsV = sqrt(sq(body.xVelocity) + sq(body.yVelocity));
      xTUnit = body.xVelocity / bodyAbsV;
      yTUnit = body.yVelocity / bodyAbsV;
    }
    body.applyForce(thrustMagnitude * xTUnit, thrustMagnitude * yTUnit);

    if (mass < 0f) ;  // should be fixed
  }
}



abstract class PhysicsForceField
{
  final ArrayList<PhysicsBody> bodyList;

  PhysicsForceField(ArrayList<PhysicsBody> bodies) {
    bodyList = bodies;
  }

  abstract void update();
}

final class GravityForceField
  extends PhysicsForceField
{
  final float gravityAcceleration;

  GravityForceField(ArrayList<PhysicsBody> bodies, float g) {
    super(bodies);
    gravityAcceleration = g;
  }
  GravityForceField(ArrayList<PhysicsBody> bodies) {
    this(bodies, 9.80665f / sq(IDEAL_FRAME_RATE));
  }

  void update() {
    for(PhysicsBody currentBody : bodyList) {
      currentBody.yAcceleration += gravityAcceleration;
    }
  }
}

abstract class DragForceField
  extends PhysicsForceField
{
  final float dencity;
  final float coefficient;
  final float factor;

  DragForceField(ArrayList<PhysicsBody> bodies, float d, float c) {
    super(bodies);
    dencity = d;
    coefficient = c;

    // drag force = 1/2 * dencity * |relative velocity|^2 * (frontal projected area = r^2 * PI) * (drag coefficient) * (unit vector of relative velocity)
    //            = v^2 * r^2 * factor * (unit vector of relative velocity)
    // relative velocity = velocity of the fluid in the rest frame of the body
    factor = 0.5f * dencity * PI * coefficient;
  }
  DragForceField(ArrayList<PhysicsBody> bodies) {
    this(bodies, 1f, 1f);
  }

  abstract void update();

  abstract float getXFluidVelocity();
  abstract float getYFluidVelocity();

  float getXRelativeVelocity(PhysicsBody body) {
    return getXFluidVelocity() - body.xVelocity;
  }
  float getYRelativeVelocity(PhysicsBody body) {
    return getYFluidVelocity() - body.yVelocity;
  }

  void applyDragForce(PhysicsBody body) {
    final float xRelVel = getXRelativeVelocity(body);
    final float yRelVel = getYRelativeVelocity(body);

    if(xRelVel == 0f && yRelVel == 0f) return;

    // v = relative velocity of the fluid
    final float vPow2 = sq(xRelVel) + sq(yRelVel);
    final float vMag = sqrt(vPow2);
    final float rPow2 = sq(body.getRadius());
    final float forceMag = vPow2 * rPow2 * factor;
    final float xVUnit = xRelVel / vMag;
    final float yVUnit = yRelVel / vMag;
    body.applyForce(forceMag * xVUnit, forceMag * yVUnit);
  }
}

final class StableAtmosphereDragForceField
  extends DragForceField
{
  StableAtmosphereDragForceField(ArrayList<PhysicsBody> bodies, float d, float c) {
    super(bodies, d, c);
  }
  StableAtmosphereDragForceField(ArrayList<PhysicsBody> bodies) {
    this(bodies, 1f, 1f);
  }

  void update() {
    for(PhysicsBody currentBody : bodyList) {
      applyDragForce(currentBody);
    }
  }

  float getXFluidVelocity() {
    return 0f;
  }
  float getYFluidVelocity() {
    return 0f;
  }
}



class PhysicsJoint
{
  final PhysicsBody body1;
  final PhysicsBody body2;

  PhysicsJoint(PhysicsBody b1, PhysicsBody b2) {
    body1 = b1;
    body2 = b2;
  }

  void update() {
    // Omitted
  }
}



final class PhysicsSystem
{
  final float idealFrameRate;
  final ArrayList<PhysicsBody> bodyList;
  final ArrayList<PhysicsJoint> jointList;
  final ArrayList<PhysicsForceField> forceFieldList;

  PhysicsSystem(float fr, int initialCapacity) {
    idealFrameRate = fr;
    bodyList = new ArrayList<PhysicsBody>(initialCapacity);
    jointList = new ArrayList<PhysicsJoint>(initialCapacity);
    forceFieldList = new ArrayList<PhysicsForceField>(initialCapacity);
  }
  PhysicsSystem() {
    this(60f, 1024);
  }

  void update() {
    for(PhysicsForceField currentObject : forceFieldList) {
      currentObject.update();
    }
    for(PhysicsJoint currentObject : jointList) {
      currentObject.update();
    }
    for(PhysicsBody currentObject : bodyList) {
      currentObject.update();
    }
  }

  void addBody(PhysicsBody obj) {
    bodyList.add(obj);
  }
  void removeBody(PhysicsBody obj) {
    bodyList.remove(obj);
  }
  void addJoint(PhysicsJoint obj) {
    jointList.add(obj);
  }
  void removeJoint(PhysicsJoint obj) {
    jointList.remove(obj);
  }
  void addForceField(PhysicsForceField obj) {
    forceFieldList.add(obj);
  }
  void removeForceField(PhysicsForceField obj) {
    forceFieldList.remove(obj);
  }
}
