// Title: Fireworks
// Author: FAL
// Date: 13. Sep. 2017
// Made with Processing 3.3.6

// ちょっと暇があったら調べてみる

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

// まず
// ローンチで1個作る
// それが3.5～4.5秒で消えるわけだが
// それまでの間、explodeとBurnFireActionをやるわけ
// で、explodeは消える瞬間とその直前に225個吐き出すので
// まずBurnの方を考えるわけですけど
// それが生み出すあれはBurningGunPowderといいまして
// 0.5秒で消えるわけ
// それを生み出すのが寿命の6割までなので
// 残り時間は最低でも1.4秒ある
// だから生み出したものはすべて消えて
// explodeの瞬間は1つだけとそういうことですね。
// で、生み出すあれについてはちょっと横にそれる感じですかね。

// explodeは消えるちょっと前に225個速い速度で飛ばす
// 消える瞬間には225個こちらはやや遅い速度で飛ばす
// これにより2段式の花火になるというわけ
// そんでもってそれらはleaveをする
// leaveというのはちかちかをする。ちかちかで残っていく感じ。で、それらの

// 花火
//

// 要するに
// 花火の運動の構成要素である
// 光る、動く、生成する
// FALさんはこれらを完全に分離しているわけですね
// すべて別々の要素が実行している
// ActionはひとつのBuilderからなる
// Builderは複数のActionからなる
// ActionはBuildするだけ。生成する。それ以外は何もしない。
// 動く、これはActorがPhysicsBodyの派生で、PhysicsBodyに丸投げ。加速度で速度を更新、速度で位置を更新しているだけ。
// ForceFieldにPhysicsBodyの配列を渡してそっちでForceをApplyして加速度を変えることで運動を決めている
// Actionは何もしない
// Actorを生成するだけ
// 最後に「光る」
// これはDisplayerの仕事
// なおfireworksBuilderの作るたったひとつのあれ
// あれは一応Shrinkです（最後消えてってる）
// Displayerは基本的にBuilderのものが設定されるんですが
// Explodeはそれがもつ候補で上書きされていますし（Candidate）
// Leaveの場合は親のDisplayerをそのまま使っていますね
// 柔軟性を持たせている
// 悪く言えばがさつ
// ....

// Actorのactを見ると
// Displayerにdisplayさせてから
// Actionを一通りexecuteさせている
// ここで新しいActorを生成
// 寿命が来たら破棄
// そんな感じ

// スパゲティここに極まれりって感じなんだけど
// ActorSystemとPhysicsSystemがあって分かりにくいでしょ
// なんとですね
// ActorSystem内でPhysicsSystem（グローバル）にアクセスしてるんですよね
// 馬鹿かな....
// 似たようなシステムが複数あると混乱するから統一してほしいですね

// PhysicsSystemとActorSystemは下にあるようにどっちもグローバルなんですが
// (これjavaの移植なので...ほんとは型宣言とかあるんですがjs無いのでね)
// それぞれ「update」と「run」してます
// で
// ActorのupdateはPhysicsSystemがやってるんですよね。ActorSystemじゃなくて
// じゃあActorSystemは何をしているかというと
// PhysicsSystemに干渉してそれのbodyListをいじって
// どのActorをupdateするかを管理してるんですよね
// ややこしい

// 個人的な意見としては
// 双方をまとめて管理するシステムを用意したうえで
// それがプロパティとしてActorSystem,PhysicsSystemを持ち
// それのメソッドとしてupdateとかrunなりすればいいんじゃないかと
// 思うけどね。


// 他に思ったこと

// まずfireworksBallBuilderがある
// これのActionListは2つの要素からなり順番は用意されていない
// ほら以前やったでしょSTGのもどきみたいな
// あれ順番があって順繰りに実行するみたいな感じだったと思うんだけど
// これはそうじゃなくて
// 並列なのね
// んで
// 2つのActionは実行するタイミングが違うだけ
// それぞれのActionはひとつのBuilderを持つが
// flashの方が持つBuilderはActionListが空
// だから生成したActorはActionを実行せず、光って消えるだけ
// explodeの方が持つBuilderはActionListの長さが1である
// だから生成するActorはただ一つのActionを実行しActorを生成するが
// そのActionを作るBuilderのActionListは空なのでこのActorはただ光って消えるだけ。
// これはyaml記法で次のように書くことができる
/*
  - BurnFireAction
  - ExplodeFireAction
    - LeaveGunpowderFireAction
*/
// これだけですね
// 同じ階層の- ~~~のActionはひとつの同じBuilderのActionListに対応していて
// そこから一つ下る場合
// そのActionを作るたったひとつのBuilderのActionListが羅列されるというわけ
// このスケッチではひとつのBuilderに登録されるActionがせいぜい2つまでなので分かりづらいが、
// そんな風に構造化して記述できる。
// もちろんさっき述べたようにこれは花火の3要素である「動く、光る、生成する」のうちの「生成する」に特化した内容なので
// 他の要素は他の要素がやってるんだけどね。

// たとえば「曲がる弾道」とかってどうなるんだろうね...
// もしくはホーミング？ああいうのはどういった位置づけになるのかしら。ねぇ？
// もしくは「待つ」
// 待つのはあれ、動きを止めるフラグを使ってそれに干渉するとか...
// もしくは？
// このコードではForceFieldという形ですべてのオブジェクトの加速度を変化させているけど
// 弾幕につなげたいのであればもうちょっと色々考える必要があるんだろう
// とはいえまあ、一度作ってはいるけどね.....
// 2019/12
// なつかし

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

	// ここでactorPool, currentActorSystem, currentPhysicsSystemを作っています。
  initialize();
	// ここでfireworksBallBuilderを作っています。
  defineActorTypes();

  // ここは色を指定してるだけ
  colorMode(HSB, 360, 100, 100, 100);

  // ここで背景画像を作ってる。背景画像は、オリジナルと変えてあります。
  gradationBackground = new GradationBackground(width, height, color(20, 100, 10, 30), color(60, 100, 40, 30), 2);
  //fogBackground = new AlphaFogBackground(width, height, 0, 0, 100, 0, 30, 0.005);
  noStroke();
}

function draw(){
   imageMode(CORNER);
  // よくわかんないけどはしっこ？によせてるぽい。単に背景おいてるだけだから
  // いかようにもできるよ
  //clear();
	// ただの背景なので解析中は黒一色でいいよ
  // そういうわけにもいかないだろ
  // これで表示される。
  gradationBackground.display();
  //fogBackground.display();
  //background(0);

   imageMode(CENTER); // 中央揃え？
  translate(width * 0.5, 0);

	// 要するにここで動かしてる
	// 動かすのも描画も全部ここ
	// 内容が意味不明だけど

  // つまりここが本丸ですね
  // 分裂によるオブジェクトの生成はこっちでやってるのよね
  // forceFieldとjointとbodyのupdate？？？？
  currentPhysicsSystem.update();

  // コード見ればわかるけどここってオブジェクトの在庫を整理してるだけ
  // なんです
  currentActorSystem.run();

	// 使い終わったオブジェクトの回収とかやってるんだと思う
  actorPool.update();

	// 花火の生成が240フレームごとに行われるんだけどそれをやってる
  if (frameCount % 240 == 30){ launchFireworks(); }

  translate(-width * 0.5, 0);

	// ここはfpsとか書いてるだけ
  drawDebugInfo();
}

function initialize(){
  initializeObjectPool();

  // ActorとPhysicsは何が違うんだろう
  currentActorSystem = new ActorSystem();
  currentPhysicsSystem = new PhysicsSystem();

  // Define environment
  // 重力と風の影響を加えているようです
  // この辺はグローバル効果なのでGPUに落とすのは難しくないかな
  // っていうか相互作用じゃなければな。可能じゃないかと思うけど...
  currentPhysicsSystem.addForceField(new GravityForceField(currentPhysicsSystem.bodyList));
  currentPhysicsSystem.addForceField(new StableAtmosphereDragForceField(currentPhysicsSystem.bodyList));
}

function initializeObjectPool() {
  // 4096個あるんだって。

  // 重要なこととして
  // Actorはここで4096匹作っているんですよね
  // OPの仕事はクラス生成の負荷を最初のループにむぎゅっと詰め込むこと
  // だからこれ以降Actorが生成されることは基本的にないわけですね


  actorPool = new ObjectPool(4096);
  for(let i = 0; i < actorPool.poolSize; i++){

    // プールからなんか出す、それに対してActionListを用意する、
    // 毎フレーム実行する
    let newObject = new Actor();

    newObject.belongingPool = actorPool;
    actorPool.add(newObject);
  }
}

// つまりすべての起点はfireworksBallBuilderというわけね。
// これが240フレームおきに実行されるというわけ。
// 実行されると、まず1つのボールが出現する。そこから理解していきましょう。xは-50～50のランダム、heightってのは要するに
// 画面の下側ってわけね。で、-100/30は逆方向の初速度ね。重力に逆らって進む。
// このballの寿命はIDEAL_FRAME_RATEに3.5～4.5を掛けたものですね。
// 要するに3.5～4.5秒で最初の1つは消えるわけですね
// それにしても直接放り込むとか乱暴すぎやしませんかね
// ではShrinkとはなんなのかって話ですけど。

// 文字通りlaunchだからローンチってことなんでしょう
function launchFireworks() {
  // ballっていうのが花火オブジェクトかなぁ
  let ball = fireworksBallBuilder.build(random(-50, 50), height, 0, - 100 / IDEAL_FRAME_RATE);

  // ここは寿命を決めてるんだろう
  ball.lifetimeFrameCount = floor((4 + random(-0.5, 0.5)) * IDEAL_FRAME_RATE);
  // 登録
  currentActorSystem.registerNewActor(ball);
}

function drawDebugInfo() {
  fill(0, 0, 100);
  text(round(frameRate()) + " FPS", 10, 20);
  text(actorPool.index + " particles", 10, 40);
}


// 上3つのビルダーと
// 最後のfireworksBallBuilderは何が違うの？？？

// このコードはっきりいって汚いんだよ
// まあいいや
// グローバルですね
// javaのコードを無理やりjsに落としてるせいで変なことになってるんだよな仕方ないわ

// めちゃくちゃだ
// まさにスパゲティコード

// 疲れるわ
// 一番上で定義したオブジェクトを一番最後の行で使う
// アホ過ぎる

function defineActorTypes() {



  // Defining actor type: "FlashingGunpowder"
  const flashingGunpowderBuilder = new ActorBuilder();
  flashingGunpowderBuilder.pool = actorPool;
  flashingGunpowderBuilder.component = new ImmutablePhysicsBodyComponent(0.005, 0.02);
  flashingGunpowderBuilder.lifetimeFrameCount = floor(IDEAL_FRAME_RATE * 2.5); // こんな風に
  // Flashingは次のあれで使われる感じ



  // Defining actor type: "GunpowderBall"
  let gunpowderBallBuilder = new ActorBuilder();
  gunpowderBallBuilder.pool = actorPool;
  gunpowderBallBuilder.component = new ImmutablePhysicsBodyComponent(0.2, 0.05);
  gunpowderBallBuilder.lifetimeFrameCount = floor(IDEAL_FRAME_RATE * 4.5);

  // flashingGunpowderBuilderはここで使うために作ってる
  // そういうのを明示するためにconstがあるんだがな

  // ビルダーからアクション作ってそれをリストに加えるって流れがめんどくさい
  // だったらいっそ...

  gunpowderBallBuilder.actionList.add(
    new LeaveGunpowderFireAction(flashingGunpowderBuilder)
  );

  // ここはdisplayerを作ってるんですが
  // ビルダーの材料なので仕方ないんですが
  // コードは分けた方がいいです

// いやこれあかんでしょ...
// なんで既にプロパティとして用意されてるのに、
// それとは別にわざわざクラス作ってるの...
// しかもそれを中身だけコピーして破棄してるの...
// あほか

// まあこういうことするんだったら
// 単純にdisplayerの入った配列でいいんじゃないですかね。
// 同じ名前だと混乱するからやめてほしい

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
  // ああこれ
  // 一応これで作るひとつの
  // も、Shrinkで光ってはいるのか
  // 最後に消えるが...
  fireworksBallBuilder.displayer = new ShrinkActorDisplayer(createLightImage(1, 1, 0.9, 1, 4, 20));
  fireworksBallBuilder.component = new ImmutablePhysicsBodyComponent(70, 0.03);


  // explodeはここで作ってる
  // 行が密着してるとわかんねぇんだよな


  // gunpowderBallBuilderはここで使ってるね

  let explode = new ExplodeFireAction(gunpowderBallBuilder);

// クッソ汚いコードやな
// displayCandidateListが二重の意味で使われてる
// 即時変数としてdisplayCandidateListを用意したのに
// 同じ、全く同じ名前の「プロパティ」に中身をそっくりそのままコピーしてる
// 普通に無駄では？？？？？


  for(let currentObject of displayerCandidateList) {
    explode.displayerCandidateList.add(currentObject);
  }



  fireworksBallBuilder.actionList.add(explode);

  // burnFireActionを最後に登録しているがこれは最初にやるのがburnFireActionだから
  // なんだね
  // actionListってなんだ？




    // Defining actor type: "BurningGunpowder"
  let burningGunpowderBuilder = new ActorBuilder();
  burningGunpowderBuilder.pool = actorPool;
  burningGunpowderBuilder.displayer = new ShrinkActorDisplayer(createLightImage(1, 1, 0.9, 1, 1, 10));
  burningGunpowderBuilder.component = new ImmutablePhysicsBodyComponent(0.005, 0.02);
  burningGunpowderBuilder.lifetimeFrameCount = floor(IDEAL_FRAME_RATE * 0.5); // 寿命がすべて決まっている



  // burningGunpowderBuilderはここで使ってますね。なるほどね。めんど。

  // なんでこれ死ぬほどわかりづらいかっていうと
  // ビルダーでアクション作ってそれをビルダーに登録するっていう
  // クソ面倒なことしてるからですね

  // あの
  // globalのBuilderってこのfirew......だけでしょ
  // これがいちばんえらいわけ
  // 実行されてるのはこれだけ
  // ローンチでやってるのこれだけだし
  // そのactionListにactionをぶち込んでるんですが
  // それらのactionもまたBuilderからできている。
  // んでそのBuilder, つまりサブビルダーっていう概念。
  // このパートで作ってるのはそのサブビルダーなんですね。全部で3つ。

  // まずflashからactionを作ってそれをgunpowderに登録し、
  // gunpowderからactionを作ってそれをfireworksに登録する
  // それとは別にburningからactionを作ってそれをfireworksに登録する
  // 二重と三重の入れ子があるわけ

  fireworksBallBuilder.actionList.add(
    new BurnFireAction(burningGunpowderBuilder)
  );

  // つまり2です
  console.log(fireworksBallBuilder.actionList.length); // 2ですね
  // actionはexplodeとburnfireの2つだけなんですね
  // 見ての通りburnfireの方は
  // それを作るBuilderが何にもactionListを持っていないので
  // 何にもしないで消えるんですが
  // explodeの方は
  // それを作るビルダーがactionListを持ってるんですね
  // flashですね
  // つまり
  // flashを出しながら消える
  // そのflashActorの寿命も決められてる
  // flashを作るBuilderのActionListは空なので
  // これにより発生するActorは寿命が来たらそのまま消えるだけ
  // というかすべてのActorは寿命が来たら消えるだけなんですが
  // Actionを持つ場合はそのActionがもつBuilderの内容に従って
  // 新しいActorを発生させるってわけです。
  // わかりましたね！

}
// まずここでShrinkのdisplayerを用意してるので最初にふよふよしてるのはこれではないかと
// じゃあ何で18とかになるの？？隠れてる？
// actionListの中身は毎フレーム実行されるが・・。

// ここは最終的にポイントスプライトに落とせるなら不要になる
// 処理が重いのは主にここが一番の原因
// Eddyさんがrectのtextureで描画してたけど実質的にやってることは同じです
// 重い
// 上記のdefineActorTypesにこれが山ほど出てくるでしょ
// p5.Imageの描画用のイメージデータを複製して渡してる、んでimage()で全部ひとつひとつ
// 重い
// 重いんです
// 内容ですが、要するにグロー球。ただ若干複雑なことしてて...これは拡大しないと分かんないと思うけどまあおそらく
// shaderで描けるレベル。

// ......

// これ9回しか作ってないので、負荷関係ないですね。ちゃんとコード読めや。
// まあGLSLでも同じことはできるのだけどね...shader書かない分ウケはいいと思う。
// GLSLで書けば毎フレームでも可能になることで柔軟性が...まあいいや。
// 少なくともこのコードでは不要だろ
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
  // 多分ピクセル処理でグローサークルのようなものを生成している
  return newImage;
}

// じゃあActorSystemってなに


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
		// 動かしてるのはここ

    // actorのupdate
    // 分裂に関してはここで
    this.updateActorList();
    // actorのdisplay
    this.display();
  }
  display(){
		// 描画してるのはここ
    this.liveActorList.loop("act");
  }
  updateActorList(){
    // 要するにざっくりいうと
    // deadActorListと重複するliveActorListのActorを排除して
    // deadActorListをクリアする
    // newActorListの内容をliveActorListにぶちこんで
    // newActorListをクリアする
    // おそらくタイミングを合わせるためにだろ
    // ループの最後にやってるから


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

    // つまりここでactorを増やしてないんだね
    // じゃあどこで？
  }
}






// ああ
// Builderって継承なしか
// つまりこれ一本しかなくって
// 内容で分けてるだけだな
// グローバルなのはひとつだけで
// それ以外は

// なんでビルダーが気持ち悪いのかようやくわかった
// actionListが最重要なのにもかかわらず
// actionListにactionを登録するメソッドが

// ない！！！！！！！！

// そりゃもちろんダイレクトアクセスできるんですけど
// なんのためにクラスで書いてるんだ？？？？

class ActorBuilder{
  constructor(){
    this.displayer = null;

    // ここにあった
    // actionListってなんだ？
    this.actionList = new SimpleCrossReferenceArray();
    // actionListにはactionが放り込まれていくんですが
    // actionもBuilderを持ってるんですね
    // わかりづらいですね

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

    // これはクローンを作ってるだけ

    // こっちのactionListはどっちも同じ階層ですね
    // BuilderのactionListをBuilderのactionListにしてる

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


    // ここでアロケートしていますね
    // つまりnewActorは「Actor」です
    let newActor = this.pool.allocate();

    newActor.displayer = this.displayer;

    // これは...
    // this.actionListは「Builderの」actionList
    // newActor.actionListは「Actorの」actionList
    // つまりactionListをコピーしてる
    for(let currentObject of this.actionList){
      newActor.actionList.add(currentObject);
    }
    newActor.component = this.component;
    newActor.lifetimeFrameCount = this.lifetimeFrameCount;

    // 位置と速度は全部同じものをコピーしてるだけですね

    newActor.xPosition = x;
    newActor.yPosition = y;
    newActor.xVelocity = vx;
    newActor.yVelocity = vy;



    return newActor;
  }
  /*
  addAction(newAction){
    // actionを追加する
  }
  */
}

// ------------------------------------------------------------------------------------------
// Builderは1つのActionにつき1つだけです
// 主に3つだけです
// 分かりづらさの原因はどこにあるのかというとですね...
// BuilderひとつからActionひとつができるんですけど
// 逆にBuilderもActionListを持ってるんですよね
// つまりBuilderからActionを作る、ActionからBuilderを作る、
// 相互に絡まっちゃってるってわけです
// これがスパゲティの本質なのです。
// 整理しないと分かりにくくて仕方ない
// アホ過ぎる
// もういっそ統一するべき？
// Builderが単純すぎるんだろう。

// Actionこっちの方がいいだろ

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

// これ以降のactionはすべてBuilderをコンストラクタで受け取るんですよね
// スパゲティの核がここにあるんだろう

class BurnFireAction extends FireAction{
  constructor(b) {
    super(b);
    this.burningTimeRatio = 0.6;// 0.6???
  }

  execute(parentActor) {
    // つまり寿命の6割までの間なんか起こすわけね。6割まで限定で。
    // explodeとは別にこれをやってる、最初の1個がなんか途中で分裂してるように感じるのはこれか、途中でカウンターが止まるのは
    // 寿命の6割を超えたからだろう。そして・・・


    // 0.6までの間、です。

    if(parentActor.getProgressRatio() > this.burningTimeRatio){ return; }
    // 0.6に近づくほど小さい値。

    // 何をしてるかというとこの0～1は最初ほど大きな値


    let burnRatio = (this.burningTimeRatio - parentActor.getProgressRatio()) / this.burningTimeRatio;
    // ・・・を、frameCount...これあれですね。frameCountですね・・いいのか？
    // で、まあ-3～3の分布ってとこだろ。それをburnRatioに掛けてxOffというかこれx方向のオフセットか。はい。なるほど。
    // で？？

    // だからxOffは最初の方ほど大きい、んでこれsin(3theta)ですね。

    let xOff = 3 * sin(3 * frameCount * TWO_PI / IDEAL_FRAME_RATE) * burnRatio;
    // 自分のxOffだけ隣に速度は逆方向、んー。位置と速度で同じ値使ってるんだが・・いいのこれ？
    // まあとにかく位置はそういう感じか。問題はactionListなんだけど。


    // 位置と速度に水平方向に互逆の摂動を加えることで...わからん。

    let newActor = this.builder.build(parentActor.xPosition + xOff, parentActor.yPosition, parentActor.xVelocity - xOff, parentActor.yVelocity);
    // ああ、builderがactionList持っててそれコピーするのね。ということは・・FireActionが持ってるbuilderだね。で・・
    // burningGunpowderBuilderを持っていますね。じゃあこれのactionListということ・・
    // もしかして、ない？？
    // ああでもまあ、無いってしないと際限なく分裂しちゃうからさもありなんやね
    // じゃあなんかやるのはexplodeの方か。

    // burnRatioはここでも使ってて、つまり上の方ほど小さめのあれを出すのね。

    newActor.scaleFactor = burnRatio; // 大きさもburnRatioが決めているようですね
    parentActor.belongingActorSystem.registerNewActor(newActor);
  }
}

class ExplodeFireAction extends FireAction{
  constructor(b) {
    super(b);
    this.displayerCandidateList = new SimpleCrossReferenceArray();
  }
  execute(parentActor){
    // なるほど
    // 臨界点とその直前とで2回爆発させることであのように2色になったりするわけだ
    // 3色とかも改造すればいけるわね・・・
    // それまでは何もしないので何も起こらないわけだ

    // このように速度は2種類しかない
    // 2次元だったら二重の円弧になるはずだが、
    // そうならないのは後述するように球面上への放射を横から見たような内容に
    // なってるからだろう

    if(parentActor.properFrameCount == floor(parentActor.lifetimeFrameCount * 0.99)){
      this.explode(parentActor, 400 / IDEAL_FRAME_RATE); // より遠くまで飛ぶ
    }
    if(parentActor.properFrameCount == parentActor.lifetimeFrameCount){
      this.explode(parentActor, 150 / IDEAL_FRAME_RATE); // 近くまで飛ぶ
    }
  }
  explode(parentActor, initialSpeed){
    // Set the displayer of the child (GunpowderBall) randomly for the purpose of color variation
    // 登録されているdisplayerのうちどれかをランダム抽出する感じですかね・・。

// だからぁ！！！！！！
// ああもう！
// get～floor～randomじゃないんだよ
// randomChoiceとかなんか作れよ
// まあいいや


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
        // -1～1に対して方向・・なんだけど、これphiも0～2PIで動いてるのよね・・
        // 個人的には、要するに2パラメータで速度分布でしょ？つまり円盤の上の1点・・単位円盤の上の1点を指定してるわけね。
        // それが225個あるわけでそのうちのどれかを。だったら単位円盤の上の点を素直にランダムに取れば良さそうなのよね。
        // たとえば方向はランダムで距離はランダムのsqrtにするとかね。ハナビィのnokoyamaさんが・・まあいろんな人がやってるけど。
        // 見た目的にいい感じならいいんだけど
        // ていうかこれあれでしょ、255にしぼってるの、単に描画能力が限界だから・・
        // っていうのもありつつ、仮に大きくできたとしても限界はありそうではあるわね。どうだったっけあっちは。640個？640だって。
        // あれ見栄えしないの多分あれ、動きが単調すぎるんだと思う。単調すぎる。ぽ～～～ん、って直線的に動いて終わり、的な？うん。
        // ていうか
        // 放物軌道描いてないんだよね。だから物理ベースのリアルな挙動に勝てないんだろう。
        // 仕方ないよね物理ベースやろうと思ったらGPGPU使うしかないんだから。あの個数で高速っていうんなら。
        // たとえばさっきちらっとやったけどこの花火を1つあたり2500でやるんだったら・・？
        // ああそうか225だけ出してからまたなんかあるんだっけ。続きを調べますかね。
        newActor.xVelocity = initialSpeed * cos(theta) * cos(phi);
        newActor.yVelocity = initialSpeed * cos(theta) * sin(phi);

        // belongingActorSystemっていうのはこのexplodeを実行するactorの親システムってことね。
        // そのシステムに新しくこのnewActorを入れる。そうなるとそのactorはどんな挙動をするのか？？？
        parentActor.belongingActorSystem.registerNewActor(newActor);
        // explodeの方はgunpowderBallBuilderから生成されてて
        // このgunpowderBallBuilderのactionListにはnew LeaveGunpowderFireAction(flashingGunpowderBuilder)...
        // ということはexplodeで発生するactorはこのLeaveなんちゃらを実行するわけだ。
      }
    }
  }
}

// explodeで放出されたActorが
// これを実行することで
// チカチカ表現を実現しているんでしょう
// そういうことかと思われます

class LeaveGunpowderFireAction extends FireAction{
  constructor(b){
    super(b);
  }
  execute(parentActor) {

    if (random(1) < this.calculateFireProbability(parentActor)) {
      // 一定の確率で・・・全く同じ位置に
      // leaveってくらいだから残すんじゃない？その場所に。
      let newActor = this.builder.build(parentActor.xPosition, parentActor.yPosition, parentActor.xVelocity, parentActor.yVelocity);
      newActor.displayer = parentActor.displayer; // displayerはおさがり

      // ここで生成していますね
      parentActor.belongingActorSystem.registerNewActor(newActor);
      // 早い話が糞・・言い方
      // その場に置いていくって感じですかね。速度は？同じ？？

      // flashingGunpowderBuilder
      // これですね。で、これがactionListを持たないので、残していったあれについてはちかちかするだけということでしょう。
      // ちかちかして、消える。そういうことみたいです。なるほど。
      // んー。
      // 同じ速度、同じ位置なら挙動も同じはずだけど・・となると見えているのは結局225個？ってこと？

      // あとあれ、昇ってくときに18個になって1に戻るのが気になる。
    }
  }
  calculateFireProbability(parentActor) {
    // FadeRatioは1-Progressですね
    // 2割まではその0.5倍・・つまり0.0～0.1って感じで
    // それ以降は0.08～0.0とか？
    if (parentActor.getProgressRatio() < 0.2){ return 0.1 * parentActor.getProgressRatio() * 5; }
    return 0.1 * parentActor.getFadeRatio();
  }
}

// -------------------------------------------------------------------
// Displayerまとめようよ

// んー

// 基本はimage()で描いてるだけなんですが
// 継承で上書きしていますね.....
// どれが使われてるの？？？？

class ActorDisplayer{
  constructor(img) {
    this.actorImage = img;
  }
  display(parentActor) {
		// imageModeのCENTERでこれ使って描画してるんです。重い。
    // this.actorImageって書かないと...まあthis勝手に補われるけどね。
    image(this.actorImage, parentActor.xPosition, parentActor.yPosition);
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
      // こっちの方がいいですね....
      super.display(parentActor);
      //image(this.actorImage, parentActor.xPosition, parentActor.yPosition);
    }

  }
  calculateDisplayProbability(parentActor) {

    // getFadeRatioはいっちばんさいごのところにありますね
    // 単に1から引いてるだけ
    // この程度の処理なら普通に1から引いた方が分かりやすい気もするけどね
    // 徐々に大きくなっていって0.5以降は常に0.9
    // 線形ですね
    // 最初の方チカチカする感じを演出

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

    // 0.8までの間徐々に小さくなりながらっていうやつね

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
// 使ってないので切った






// -----------------------------------------------------------------------

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

// ---------------------------------------------------------------------------

// ここからPhysicsBodyの定義

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


// body,joint, forceFieldは外部に存在するみたい。
// addとremoveで付けたり外したりするみたいですね
// つまり実態はこの3つか
// 相互の関連がいまいちよく分かんないが.....

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

// 使ってるのはこれだけ。これ以外は、単にあるだけ。使ってない。
// 内容的には上と下の色を補間してるだけ。lerpColorなのでRGB補間とは限らない。
// よく知られているようにHSB補間の場合赤と青の間に緑が入る...など。
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

class FogBackground extends PreRenderedBackground{
  constructor(x, y, h = 0, s = 0, b = 0, baseBrightness = 70, noiseBrightness = 30, noiseIncrement = 0.01) {
    if(x === undefined){ x = width; }
    if(y === undefined){ y = height; }
    super(x, y);
    this.createFog(x, y, color(h, s, b), baseBrightness, noiseBrightness, noiseIncrement);
  }
  createFog(x, y, baseColor, baseBrightness, noiseBrightness, noiseIncrement) {
    this.graphics.loadPixels();
    let xoff = 0.0;
    for(let xp = 0; xp < x; xp++){
      xoff += noiseIncrement;
      let yoff = 0.0;
      for(let yp = 0; yp < y; yp++){
        yoff += noiseIncrement;
        let bright = constrain(baseBrightness + noise(xoff, yoff) * noiseBrightness, 0, 100);
        this.graphics.set(xp, yp, this.getPixelColor(baseColor, bright));
      }
    }
    this.graphics.updatePixels();
  }
  getPixelColor(baseColor, bright){};
}

class OpaqueFogBackground extends FogBackground {
  constructor(x, y, h = 0, s = 0, b = 0, baseBrightness = 70, noiseBrightness = 30, noiseIncrement = 0.01) {
    super(x, y, h, s, b, baseBrightness, noiseBrightness, noiseIncrement);
  }
  getPixelColor(baseColor, bright){
    return color(hue(baseColor), saturation(baseColor), bright);
  }
}

class AlphaFogBackground extends FogBackground {
  constructor(x, y, h = 0, s = 0, b = 100, baseBrightness = 70, noiseBrightness = 30, noiseIncrement = 0.01) {
    super(x, y, h, s, b, baseBrightness, noiseBrightness, noiseIncrement);
  }
  getPixelColor(baseColor, bright){
    return color(hue(baseColor), saturation(baseColor), brightness(baseColor), bright);
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

// Actorのactはここに記述があります
class Actor extends PhysicsBody{
  constructor(x = 0, y = 0){
    super(x, y);
    this.displayer;

    // actionListこっちにもあるんだけど？？？

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

    // actionListを実行してるのはここですね。
    // executeにthisを渡すことで実行する
    // 確かこの辺自分のあれでも参考にしたはず...？

    // 見ればわかるけど順繰りに実行していくって感じではなくて
    // 毎フレームすべてのアクションを走査していますね
    // クロレファなので終わったアクションは自分から退出できる仕組みですね

    // ActorのactionListを用意しているのはどこだろう？

    for(let currentObject of this.actionList){
      currentObject.execute(this);
    }


    this.properFrameCount++;
		// 寿命が尽きたら鬼籍に入れる
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
