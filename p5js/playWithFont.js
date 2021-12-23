// テキストcontourで遊ぶ
// とはいえ2次元データでだけどね

// サンセリフ取得できないからフリーフォント見つけた
// これでいけるねいぇーい

// んんーーーなるほど
// textAlignは不完全なのね・・

// ああああああてごわい！！！

// できた。しかしどういうことだ・・

let font1,font2;
let ctrs;

function preload(){
  font1 = loadFont("https://inaridarkfox4231.github.io/assets/HuiFont29.ttf");
  font2=loadFont("https://inaridarkfox4231.github.io/assets/Mplus1-Regular.ttf");
}

function setup() {
  createCanvas(400, 400);
  //textAlign(LEFT, CENTER);
  textFont(font1, 20);
  fill(50);
  stroke(100);
  ctrs = getContours(font1, "龍", 300, 4, CENTER, CENTER);
}

function draw() {
  /*
  const bd = font2.textBounds("桜", 200, 200, 200);
  // このときのx,y,w,hっていうのは、
  // text("桜",200,200)ってやったときのデフォルトでの
  // 左上の座標と横幅と縦幅。
  // これがleftになるためには結局、textってやるときに左が
  // xになってて、200になってないから、200にするために
  // 200-xを足すと。200に200-xを足すから400-xになる。そして、
  // yについてもたとえば200が中心になるには200-hにしないといけないのに
  // デフォでは200ってかいたのにyになってるから、まずyを引いて0に
  // したうえで200を足して200としそこからh*0.5をさらに引く。結局
  // 200-y-h*0.5を足すので400-y-h*0.5に。そこら辺の関数作りたいのが
  // ひとつ。不便なので。
  // 中心にしたいなら・・以下略。
  // textAlign使わない方向で。
  // で、もうひとつは・・・
  console.log(bd);
  noFill();
  rect(200, 200 - bd.h * 0.5, bd.w, bd.h);
  //rect(bd.x, bd.y, bd.w, bd.h);
  fill(50);
  text("桜", 400 - bd.x, 400 - bd.h * 0.5 - bd.y);
  //text("桜", 200, 200);
  line(200,0,200,400);line(0,200,400,200);
  // たとえばLEFT
  // ここのxとyわかった
  // textでLEFTやらCENTERやらで定めたときのxとyと同じものを設定
  // すると、そのときに設定した左上が基準となって、
  // そのうえでのそれを左上とした場合のpathが得られるんだ。
  // ????
  // 200,200が今基準だからこれの代わりに0,0をとる、
  // ああなるほど、やっぱりsayoさんは正しい、と。
  // で、たとえばCENTER,CENTERにすればx,yを足したときに
  // 全部中央にくるわけね。
  const data = font2.font.getPath("桜", 400 - bd.x, 400-bd.y-bd.h*0.5, 200).commands;
  stroke(0,128,255);
  for(let i = 0; i < data.length; i++){
    if(data[i].x !== undefined){
      circle(data[i].x, data[i].y, 2);
    }
  }
  */
  let start = millis();
  background(255);
  line(200,0,200,400);line(0,200,400,200);
  const bd = font1.textBounds("龍", 0, 0, 300);
  textSize(300);
  text("龍", -bd.x+200-bd.w*0.5,-bd.y+200-bd.h*0.5);
  //let contours = getContours(font2, "桜", 300, 4, CENTER, CENTER);
  // こういうこと。
  // だから、データ的には任意の位置に表示させられるってわけね。
  // これでも充分だけれど、やっぱね、・・うん。
  stroke(0,128,255);
  const t = 0.0;
  for(const contour of ctrs){
    const L = contour.length;
    for(let i = 0; i < L; i++){
      circle(200 + contour[i].x * (1 - t) + contour[(i + 1) % L].x * t, 200 + contour[i].y * (1 - t) + contour[(i + 1) % L].y * t, 4);
    }
  }
  noLoop();
}

// 最終的に出力されるのは
// sizeに基づいた
// 文字のrectの
// 左上を基準とした・・
// ちょっと修正したいですかね
// xとyを引数に加えたうえで
// たとえばLEFTでTOPならそのx,yがLEFTでTOPにくるような、とか・・
// んーーーー
function getContours(ft, txt, size, detail, h_align, v_align){
  const bounds = ft.textBounds(txt, 0, 0, size);
  let x, y;
  switch(h_align){
    case LEFT:
      x = -bounds.x; break;
    case CENTER:
      x = -bounds.x - bounds.w * 0.5; break;
    case RIGHT:
      x = -bounds.x - bounds.w; break;
  }
  switch(v_align){
    case TOP:
      y = -bounds.y; break;
    case CENTER:
      y = -bounds.y - bounds.h * 0.5; break;
    case BOTTOM:
      y = -bounds.y - bounds.h; break;
  }
  let contours = [];
  let contour = [];
  let currentPos = createVector();
  const data = ft.font.getPath(txt, x, y, size).commands;

  for(let i = 0; i < data.length; i++){
    const cmd = data[i];
    switch(cmd.type){
      case "M":
        contour = [];
        currentPos.set(cmd.x, cmd.y);
        contour.push(currentPos.copy()); break;
      case "L":
        if(currentPos.x == cmd.x && currentPos.y == cmd.y) continue; // ここの処理オリジナルでは無いけどなんで用意したのか
        currentPos.set(cmd.x, cmd.y);
        contour.push(currentPos.copy()); break;
      case "C":
        for(let k = 0; k < detail; k++){
          contour.push(new p5.Vector(bezierPoint(currentPos.x, cmd.x1, cmd.x2, cmd.x, k / detail), bezierPoint(currentPos.y, cmd.y1, cmd.y2, cmd.y, k / detail)));
        }
        currentPos.set(cmd.x, cmd.y);
        contour.push(currentPos.copy()); break;
      case "Q":
        for(let k = 0; k < detail; k++){
          contour.push(new p5.Vector(bezierPoint(currentPos.x, cmd.x1, cmd.x1, cmd.x, k / detail), bezierPoint(currentPos.y, cmd.y1, cmd.y1, cmd.y, k / detail)));
        }
        currentPos.set(cmd.x, cmd.y);
        contour.push(currentPos.copy()); break;
      case "Z":
        contour.pop();
        contours.push(contour);
    }
  }
  return contours;
}
