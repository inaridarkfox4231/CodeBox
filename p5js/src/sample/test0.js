// describe()

function setup(){
  createCanvas(100, 100);
  background(128, 255, 128);
  describe("この文章は表示されません", FALLBACK);
  describe("こっちは表示されます", LABEL);
  describe("どうなる？？", FALLBACK);
  //describe("どういうこと？", LABEL);
}
/*
function draw(){
  background(0);
  describe("フレームレート: " + frameRate().toFixed(3), LABEL);
}
*/
// これはバグですかね...
// describeでFALLBACKのあとLABELやるとdescribeの内容が上書きされる
// LABELのあとFALLBACKなら問題なし
// LABELだけやるとLABELに加えてFALLBACKのあれも作成されるのか
// あー、バグじゃないわ。これ上書きしてるだけだ。
// FALLBACKのあとLABELやるとFALLBACKで作ったタグの内容がLABELのtextで上書きされるわけだ。
// バグじゃないけど分かりづらいね...

// stringじゃない場合はreturnです。注意。
// draw内で使うとフレームレートの表示とかできる。まじか！
// textを画面内に挿入する必要、もうないね...
// 全画面の場合は別だけどね！！
// ただまあ邪道なので普通にlabelを使いましょう

/*
function setup(){
  createCanvas(400, 400);
  describe("これ何に使うの？");
  // area-label属性を付与することで表示されないようにできる
  // それを使ってscreen-readerの対象にしやすくなるとかそういうことみたいです
  textOutput();
  background(0);
  fill("aquamarine");
  circle(200, 200, 80);
  // aquamarineやったらturquoiseなったおもろい
  // aquamarineとturquoiseの区別が付かないらしい
}

*/
