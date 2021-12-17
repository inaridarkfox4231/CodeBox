// 部品。とりあえずボタンですね。

// ボタンの反応エリアがあって
// ボタンセットのどこに配置するかを決めるわけで
// 最終的にはボタンセットを納品する関数を書かないといけないですね・・クラスだけだと準備をあっちに書かないと
// いけなくなってしまうのでまずいですから。
// ボタンセットは背景のグラフィックがあってその上にボタンを毎フレーム描画します。毎フレーム背景、ボタンの順に描画。
// ボタン側の描画関数でたとえばサイズの拡大縮小などしてマウスオーバーの時にね。そんな感じですかね。

// タイトル側でマウス位置をbuttonSetに放り込むとbuttonSetのoffsetに基づいてbuttonSet内におけるマウス位置の情報が、
// それに基づいてどれかのボタンの上にいるのか、もしくはどのボタンの上にもいないのか、が判定される、
// どれかのボタンの上にいる場合、ボタン側でタイマーがオンになり、カウンターが開始し、30フレームくらいでちょっと大きくなる
// そのあとは大きくなったままになる、マウスが離れる場合は大きくなっているならそのまま小さくなり始めて元の大きさに戻る、
// いわゆるホバーを実装するわけ。
// で、ボタンセットはマウス位置に対してそれを返す、と。ここでキーアクション。エンターキーを押したときにマウスが
// 然るべきボタンの上にいるならその情報が送られてそれに基づいてステージのパターンが決まる、ってところまで
// 行きたいわね。

// 今気づいたけど十字キーやカーソルで動かすんじゃなかったっけ・・・
// マウスじゃなくて。
// だからデフォルトを0にして矢印で・・んー。
// というわけでmouseX, mouseYの代わりにinputXとinputYにしました。十字キーの場合はここに代入する値が変化する
// ことになりそうです。一安心！
// マウスでやりたい場合はmouseX, mouseYを代入してお使いください。

// マウスはマウスで利用価値があるので仕様はなくさなくていいよ

// ---------------------------------------------- //
// buttonSet.

let buttonIndex = 0;

class ButtonSet{
  constructor(x, y, w, h){
    this.offset = createVector(x, y); // 与えられたgrに貼り付ける際のオフセットの座標（左上）
    this.w = w;
    this.h = h;
    this.gr = createGraphics(w, h);
    // 単色やグラデでもいいけどなんかおしゃれなチェック模様背景とかでもいいわね
    this.buttons = [];

    // 暫定処理
    this.bg = createGraphics(w, h);
    this.bg.noStroke();
    this.bg.colorMode(HSB, 100);
    for(let y = 0; y < 200; y++){
      this.bg.fill(55, 100 - y * 0.5, 100);
      this.bg.rect(0, y * this.h / 200, this.w, this.h / 200);
    }
  }
  reset(){
    for(let btn of this.buttons){
      btn.reset();
    }
  }
  registButton(btn){
    this.buttons.push(btn);
  }
  getButtonIndex(data){
    let btnId = -1;
    if(data.hasOwnProperty("pos")){
      // マウス位置などで指定するモード
      // mx, myはこのセット上におけるマウス位置の座標。オフセットは考慮・・ん？こっちで計算できるか。んー・・
      let mx = data.pos.x - this.offset.x;
      let my = data.pos.y - this.offset.y;
      // エリア外で-1で抜けちゃうとエリア外に離れたときにボタンの大きさが元に戻らないバグが出ちゃう
      for(let btn of this.buttons){
        // btnに(mx, my)を渡す。あとはオフセットに基づいてhoverかどうかが判定され、拡縮。
        // btnはisHoverを返す。trueならbtnからidを取得して最後にそれを返す。
        // なおボタンは位置が重ならないことが想定されているのでidの重複は起こらないものとする。
        const _isHover = btn.getIsHover(mx, my);
        btn.calcScaleCount(_isHover);
        if(_isHover){ btnId = btn.getIndex(); }
      }
    }else if(data.hasOwnProperty("id")){
      // idで直接指定するモード（戻り値に意味はない）
      for(let btn of this.buttons){
        const currentIndex = btn.getIndex();
        const _isHover = (currentIndex === data.id);
        btn.calcScaleCount(_isHover);
        if(_isHover){ btnId = currentIndex; }
      }
    }
    return btnId;
  }
  draw(base){
    // 背景を用意
    this.gr.image(this.bg, 0, 0);
    // ボタンを自グラフィックに描画
    for(let btn of this.buttons){ btn.draw(this.gr); }
    // 自グラフィックをbaseに描画
    base.image(this.gr, this.offset.x, this.offset.y);
  }
}

/*
  hoverの仕組みは単純。hover==trueのときはscaleCountが30上限で増え続ける。hover==falseのときはscaleCountが0下限で減り続ける。終わり。
  hoverで変数用意する必要ないな？？
*/

class Button{
  constructor(x, y, w, h){
    this.offset = createVector(x, y); // buttonSet内でのオフセットの座標（左上）
    this.w = w;
    this.h = h;
    this.gr = createGraphics(w, h);
    this.index = buttonIndex++;
    this.scaleCount = 0; // 0～30まで動く、この値に基づいて描画の際の大きさが変わる（0で通常の大きさ）

    // 暫定処理
    this.gr.background(0);
    this.gr.textAlign(CENTER, CENTER);
    this.gr.textSize(min(w, h) * 0.5);
    this.gr.fill(255);
    this.gr.text(this.index, this.w * 0.5, this.h * 0.5);
  }
  reset(){
    this.resetScaleCount();
  }
  getIndex(){
    return this.index;
  }
  getIsHover(mx, my){
    // mx,myはbuttonSetにおける位置。これとこっちのオフセットから・・まあ、わかるよね。
    // hoverかどうかのtrueとfalseを返す。
    let _mx = mx - this.offset.x;
    let _my = my - this.offset.y;
    if(_mx < 0 || _mx > this.w || _my < 0 || _my > this.h){ return false; }
    return true;
  }
  resetScaleCount(){
    this.scaleCount = 0;
  }
  calcScaleCount(_isHover){
    // hoverがtrueであれば30上限でカウント増やす、falseなら0下限でカウント減らす。
    if(_isHover){ this.scaleCount = Math.min(this.scaleCount + 1, BUTTON_EXPAND_DURATION); }
    else{ this.scaleCount = Math.max(this.scaleCount - 1, 0); }
  }
  draw(btnSetGr){
    const diff = (BUTTON_EXPAND_RATIO - 1.0) * (this.scaleCount / BUTTON_EXPAND_DURATION);
    btnSetGr.image(this.gr, this.offset.x - this.w * diff, this.offset.y - this.h * diff,
                            this.w * (1.0 + diff * 2.0), this.h * (1.0 + diff * 2.0),
                            0, 0, this.w, this.h);
  }
}
