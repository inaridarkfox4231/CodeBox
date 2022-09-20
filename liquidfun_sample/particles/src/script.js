
// pixi.js使ってるけど他のライブラリでもいけるんじゃないかと
// 描画部分をpixiに頼ってるということです
// なるほどね

// 12:00になったのでここまで。
// ふぅー－－－－
// 結論：わからん！！
// まあいいけどね。ふぅ。
// bufferSubDataが毎フレーム実行されてるのとdrawElementsで描画してることが分かればとりあえずはいいよ。
// これだけでかいレンダリングシステム、...
// Systemをたくさん放り込んでて
// そのうちのどれかが毎フレームの実行になってるんだろ。

// ああ、わかんね。
// わかんねけどまあ、んー。
// 通常の動的更新じゃダメなの？
// それよかpixi.jsの使い方を覚えた方が良さそうね。
// ただwebgl2の基礎については勉強が必要だと思う。コアな部分。
// じゃないと読めない部分が多すぎて。どうしようもない。処理が...
// それとは別にshaderGraphも気になる。かもそばさんの本。
// PixelFlowも気になる...時間が足りない...！！

// childにぶち込んでるからstage.childrenでアクセスできると思ったらstage.childrenが
// ない！！！！！！
// わけわからん！！！！

// childrenは操作したいオブジェクトのデータをまとめておいてるだけで
// 内容を計算で更新することはあっても
// そこからデータを読み取ってGPUに送信するのは
// 別のところがやってるみたい
// まあそれはいいんですけど
// それを何処でやってるのよ...
// つまりspriteのデータは二重に管理されているのね
// ひとつはデータの更新用
// もうひとつはデータの送信用
// 今の俺っちのやり方だと更新と送信を同じバッファでやってるから
// それで遅いのかもしれないね

// だとしても
// こっちから値を送るにはaddChildしか手段が無いわけで
// だから二重管理するにしてもaddChild以外の場所でそれは実行できないはずだろ？？？？
// どうなってるんだよ！！

// ああそうか
// SpriteってContainerの継承だから、
// 上書きしているんだ。んで再帰...
// つまりあそこで正解...

// 個数を決めてるの何処ですか？？

// グローバルに「world」インスタンスを用意しなければならない
let world = null;

/** LiquidFunの単位はメートル。px換算の数値を設定します。 */
const METER = 100;
/** 時間のステップを設定します。60FPSを示します。 */
const TIME_STEP = 1.0 / 60.0;
/** 速度の計算回数です。回数が多いほど正確になりますが、計算負荷が増えます。 */
const VELOCITY_ITERATIONS = 1;
/** 位置の計算回数です。回数が多いほど正確になりますが、計算負荷が増えます。 */
const POSITION_ITERATIONS = 1;
/** パーティクルのサイズです。 */
const SIZE_PARTICLE = 4;
/** ドラッグボールのサイズです。 */
const SIZE_DRAGBLE = 50;

/** 画面のサイズ(横幅)です。 */
const windowW = window.innerWidth;
/** 画面のサイズ(高さ)です。 */
const windowH = window.innerHeight;
/** DPIです。 */
const dpi = window.devicePixelRatio || 1.0;

/** [Pixi.js] ステージです。 */
let stage;
let app;
/** [Pixi.js] ドラッグボールの表示オブジェクトです。 */
let _pixiDragBall;
/** [Pixi.js] 粒子の表示オブジェクトの配列です。 */
const _pixiParticles = [];
let _isDragging = false;

/** [LiquidFun] パーティクルシステムです。 */
let _b2ParticleSystem;
/** [LiquidFun] ドラッグボール用のインスタンスです。 */
let _b2DragBallFixutre;
/** [LiquidFun] マクスジョイントです。 */
let _b2MouseJoint;
/** [LiquidFun] ドラッグボール制御用のインスタンスです。 */
let _b2GroundBody;

/** 端末ごとにパフォーマンスを調整するための変数です。 */
let performanceLevel;
switch (navigator.platform) {
  case "Win32": // Windowsだったら
  case "MacIntel": // OS Xだったら
    performanceLevel = "high";
    break;
  case "iPhone": // iPhoneだったら
  default:
    // その他の端末も
    performanceLevel = "low";
}

// ページが読み込み終わったら初期化する
window.addEventListener("DOMContentLoaded", init);

function init() {
  // 重力の設定
  const gravity = new b2Vec2(0, 10);
  // Box2D(LiquidFun)の世界を作成
  world = new b2World(gravity);

  // グランドの作成
  _b2GroundBody = world.CreateBody(new b2BodyDef());

  // Box2Dのコンテンツを作成
  createPhysicsWalls();
  createPhysicsParticles();
  createPhysicsBall();

  // Pixiのコンテンツを作成
  createPixiWorld();

  // 定期的に呼び出す関数(エンターフレーム)を設定
  handleTick();

  setupDragEvent();
}

/** LiquidFunの世界で「壁」を生成します。 */
function createPhysicsWalls() {
  const density = 0;

  const bdDef = new b2BodyDef();
  const bobo = world.CreateBody(bdDef);
  // 壁の生成 (地面)
  const wg = new b2PolygonShape();
  wg.SetAsBoxXYCenterAngle(
    windowW / METER / 2, // 幅
    5 / METER, // 高さ
    new b2Vec2(
      windowW / METER / 2, // X座標
      windowH / METER + 0.05
    ), // Y座標
    0
  );
  bobo.CreateFixtureFromShape(wg, density);

  // 壁の生成 (左側)
  const wgl = new b2PolygonShape();
  wgl.SetAsBoxXYCenterAngle(
    5 / METER, // 幅
    windowH / METER / 2, // 高さ
    new b2Vec2(
      -0.05, // X座標
      windowH / METER / 2
    ), // Y座標
    0
  );
  bobo.CreateFixtureFromShape(wgl, density);

  // 壁の生成 (右側)
  const wgr = new b2PolygonShape();
  wgr.SetAsBoxXYCenterAngle(
    5 / METER, // 幅
    windowH / METER / 2, // 高さ
    new b2Vec2(
      windowW / METER + 0.05, // X座標
      windowH / METER / 2
    ), // Y座標
    0
  );
  bobo.CreateFixtureFromShape(wgr, density);
}

/** LiquidFunの世界で「粒子」を生成します。 */
function createPhysicsParticles() {
  // 粒子の作成 (プロパティーの設定)
  const psd = new b2ParticleSystemDef();
  psd.radius = SIZE_PARTICLE / METER; // 粒子の半径
  psd.pressureStrength = 4.0; // Increases pressure in response to compression Smaller values allow more compression
  _b2ParticleSystem = world.CreateParticleSystem(psd);
  // 粒子の発生領域
  const box = new b2PolygonShape();

  //const w = performanceLevel === "high" ? 256 : 256;
  //const h = performanceLevel === "high" ? 384 : 128;

  const w = performanceLevel === "high" ? 16 : 16;
  const h = performanceLevel === "high" ? 24 : 8;    // テストのために1/16にしました
  box.SetAsBoxXYCenterAngle(
    w / METER, // 幅
    h / METER, // 高さ
    new b2Vec2(
      windowW / 2 / METER, // 発生X座標
      -windowH / 2 / METER
    ), // 発生Y座標
    0
  );
  const particleGroupDef = new b2ParticleGroupDef();
  particleGroupDef.shape = box; // 発生矩形を登録
  _b2ParticleSystem.CreateParticleGroup(particleGroupDef);
}

function createPhysicsBall() {
  // 属性を設定
  const bd = new b2BodyDef();
  bd.type = b2_dynamicBody;
  bd.position.Set(
    windowW / 2 / METER, // 発生X座標
    (-windowH * 1.5) / METER // 発生Y座標
  );
  // 形状を設定
  const circle = new b2CircleShape();
  circle.radius = SIZE_DRAGBLE / METER;

  // 実態を作成
  const body = world.CreateBody(bd);
  _b2DragBallFixutre = body.CreateFixtureFromShape(circle, 8); //鉄：7.9、アルミニウム：2.6、ゴム：0.4、木：1.4、コンクリート：2.4、氷：1;
  _b2DragBallFixutre.friction = 0.1; // 鉄：0.6、アルミニウム：0.6、ゴム：0.9、木：0.5、コンクリート：0.7、氷：0
  _b2DragBallFixutre.restitution = 0.1; // 鉄：0.2、アルミニウム：0.3、ゴム：0.9、木：0.3、コンクリート：0.1、氷：0.1
}

function createPixiWorld() {
  // Pixiの世界を作成
  app = new PIXI.Application({
    width: windowW,
    height: windowH,
    resolution: dpi,
    autoStart: true,
    resizeTo: window
  });
  document.body.appendChild(app.view);
  stage = app.stage;

  // canvas 要素でグラフィックを作成 (ドローコール削減のため)
  // ここがcreateCanvasなのね
  // わかったこれ2Dcanvas使ってパーティクルの円を描いてるんだ
  // 白いつぶつぶこれだ
  const canvas = document.createElement("canvas");
  canvas.width = SIZE_PARTICLE * 2 * dpi;
  canvas.height = SIZE_PARTICLE * 2 * dpi;
  // コンテクストを取得
  const ctx = canvas.getContext("2d");
  ctx.arc(
    SIZE_PARTICLE * dpi,
    SIZE_PARTICLE * dpi,
    (SIZE_PARTICLE * dpi) / 2,
    0,
    2 * Math.PI,
    false
  );
  ctx.fillStyle = "white"; // 色はここだわね
  ctx.fill(); //

  // canvas 要素をテクスチャーに変換
  // そしてテクスチャとして利用してる
  // p5.jsで言うところのcreateGraphicsみたいなやつだな
  const texture = PIXI.Texture.from(canvas);

  // パーティクルの作成
  const length = _b2ParticleSystem.GetPositionBuffer().length / 2;
  console.log("length:"+length); // 48個になりました。コンパクト！！少ないことはいいことだ。
  for (let i = 0; i < length; i++) {
    const shape = new PIXI.Sprite(texture); // シェイプを作成
    shape.scale.set(1 / dpi);
    shape.pivot.x = SIZE_PARTICLE * dpi;
    shape.pivot.y = SIZE_PARTICLE * dpi; // pivot...？？

    stage.addChild(shape); // 画面に追加 // ここでstageというContainerにぶちこんでて、それはいつレンダリングされるのかという。
    _pixiParticles[i] = shape; // 配列に格納
  }

  // 何が分からないって。だって、stageにaddChildするでしょ。lengthでしょ。
  // その数は何処に行っちゃったの？っていう。それがわかんないのよ！！

  // ドラッグボールの作成
  _pixiDragBall = new PIXI.Graphics();
  _pixiDragBall.beginFill(0x990000); // 色指定
  _pixiDragBall.drawCircle(0, 0, SIZE_DRAGBLE); // 大きさを指定
  stage.addChild(_pixiDragBall); // 画面に追加
}

/** 時間経過で指出される関数です。 */
function handleTick() {
  // 物理演算エンジンを更新
  world.Step(TIME_STEP, VELOCITY_ITERATIONS, POSITION_ITERATIONS);

  // パーティクルシステムの計算結果を取得
  const particlesPositions = _b2ParticleSystem.GetPositionBuffer();

  // ここで2次元座標を取得して
  // 描画に用いているというわけね
  // あっちのもそうだけどパーティクルの個数は画面サイズに応じて増減させた方がいいわね
  // 当たり前か...
  // 修正しないといけないわね
  // ていうかテクスチャとか全部初期化...しないと...

  // 粒子表現 : 物理演算エンジンとPixiの座標を同期
  for (let i = 0; i < _pixiParticles.length; i++) {
    const shape = _pixiParticles[i]; // 配列から要素を取得
    // LiquidFunの配列から座標を取得
    const xx = particlesPositions[i * 2] * METER;
    const yy = particlesPositions[i * 2 + 1] * METER;
    // 座標を表示パーツに適用
    shape.x = xx;
    shape.y = yy;
  }

  // ドラッグボール : 物理演算エンジンとPixiの座標を同期
  _pixiDragBall.x = _b2DragBallFixutre.body.GetPosition().x * METER;
  _pixiDragBall.y = _b2DragBallFixutre.body.GetPosition().y * METER;


  //console.log("loop");
  requestAnimationFrame(handleTick);
}

/** ドラッグイベントを設定します。 */
function setupDragEvent() {
  _pixiDragBall.interactive = true;
  _pixiDragBall.on("mousedown", dragStart);
  _pixiDragBall.on("mousemove", dragMove);
  _pixiDragBall.on("mouseup", dragEnd);
  _pixiDragBall.on("mouseupoutside", dragEnd);
  _pixiDragBall.on("touchstart", dragStart);
  _pixiDragBall.on("touchmove", dragMove);
  _pixiDragBall.on("touchend", dragEnd);
  _pixiDragBall.on("touchendoutside", dragEnd);

  function dragStart(event) {
    _isDragging = true;
    const p = getMouseCoords(event.data.global);
    const aabb = new b2AABB();
    aabb.lowerBound.Set(p.x - 0.001, p.y - 0.001);
    aabb.upperBound.Set(p.x + 0.001, p.y + 0.001);
    const queryCallback = new QueryCallback(p);
    world.QueryAABB(queryCallback, aabb);

    if (queryCallback.fixture) {
      const body = queryCallback.fixture.body;
      const md = new b2MouseJointDef();
      md.bodyA = _b2GroundBody;
      md.bodyB = body;
      md.target = p;
      md.maxForce = 1000 * body.GetMass();
      // マウスジョイントを作成
      _b2MouseJoint = world.CreateJoint(md);
      body.SetAwake(true);
    }
  }

  function dragMove(event) {
    if (_isDragging === true) {
      const p = getMouseCoords(event.data.global);
      if (_b2MouseJoint) {
        // マウスジョイントの対象座標を更新
        _b2MouseJoint.SetTarget(p);
      }
    }
  }

  function dragEnd(event) {
    _isDragging = false;
    if (_b2MouseJoint) {
      // マウスジョイントを破棄
      world.DestroyJoint(_b2MouseJoint);
      _b2MouseJoint = null;
    }
  }
}

/**
 * マウス座標を取得します。
 * @return b2Vec2 マウス座標のベクター情報です。
 */
function getMouseCoords(point) {
  const p = new b2Vec2(point.x / METER, point.y / METER);
  return p;
}

/**
 * LiquidFun の衝突判定に使うクラスです。
 * @constructor
 */
function QueryCallback(point) {
  this.point = point;
  this.fixture = null;
}
/**@return bool 当たり判定があれば true を返します。 */
QueryCallback.prototype.ReportFixture = function(fixture) {
  const body = fixture.body;
  if (body.GetType() === b2_dynamicBody) {
    const inside = fixture.TestPoint(this.point);
    if (inside) {
      this.fixture = fixture;
      return true;
    }
  }
  return false;
};
