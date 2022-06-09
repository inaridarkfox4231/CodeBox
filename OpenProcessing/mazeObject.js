// 迷路。
// wとhを入力すると2w+1x2h+1の配列が生成される
// 0,1,2,3,4
// 0は未定1は通行可能2は壁4は外周3はスタートやゴールという感じ
// だから最初に0と4を並べて
// 適当に1をおいて迷路作成スタート
// 最終的に迷路が出来たらそれはwxhのものになっているイメージで
// 関数としては0~w-1x0~h-1の何か与えたときに
// もうひとつ方向d0,1,2,3を与えたときにそっちにいけるかどうかを
// 返す関数を実装
// あとゴールに着いたかどうかの関数も必要だわね
// 以上
// まあでもさ
// Unityとりあえずそこまで難しくないのひとつ作りたいわね
// プールは後回しでいいからとりあえずインスタンス化？
// それまずやりたいわねってもうやってたっけ？正方形。あれ
// プレハブでしょ。できるならさっさと作ろうよ。

// C#の構造体の知識と、あとpush/popかな必要なのは。
// セルを構造体で生成してそれをpushpopで道を探る感じで

// できました～～～

// あとはたとえば存在位置(x,y)に対して
// (x,y)からdの方向に進めるかどうかをcanMove(x,y,d)で調べて
// 可能ならその方向に進む感じですかね
// それで迷路になる。ビジュアライズは適宜。

// 生成するための関数createが無い...ていうか
// 同じwとhで作り直す関数

// オープロメンテだって。
// 別にいいよこっちで作業するから。てかGitHubに落とそう。

function maze(w, h){
  // step1:(2w+1)x(2h+1)の配列を用意する
  // mはidを格納する。最終的に4は外壁2は内壁、
  // 1と3は通行可能、とはいえ奇数2つの本来のマスのところだけ
  // 1になり3は通路になる...はず。0は未定で最終的に消滅する。
  let m = [];
  // valuesは奇数2つのマスにのみ記録されていく
  // 最終的にはスタートからの最短距離みたいな意味になる
  let values = [];

  // コンストラクト
  for(let y=0; y<2*h+1; y++){
    let r = []; // row...横の行
    let v = []; // value...value用の配列
    for(let x=0; x<2*w+1; x++){
      if(x==0 || y==0 || x==2*w || y==2*h){
        // 外壁はすべて4
        r.push(4);
      }else if(((x%2)==0) && ((y%2)==0)){
        // 外壁以外で内部の偶数マスは2
        r.push(2);
      }else{
        // それ以外は通行可能になる可能性あるので0
        r.push(0);
      }
      v.push(0); // value.
    }
    m.push(r);
    values.push(v);
  }

  // 初期化
  function initialize(){
    for(let y=0; y<2*h+1; y++){
      for(let x=0; x<2*w+1; x++){
        if(x==0 || y==0 || x==2*w || y==2*h){
          m[y][x] = 4;
        }else if(x%2==0 && y%2==0){
          m[y][x] = 2;
        }else{
          m[y][x] = 0;
        }
        values[y][x] = 0;
      }
    }
  }

  // 方向変数
  const dx = [1,0,-1,0];
  const dy = [0,1,0,-1];
  let startX, startY, goalX, goalY;

  function create(){
    // まず初期化する
    initialize();
    // step2:変数の準備

    // カレント（サーチの起点）
    let curX = 2*(Math.floor(Math.random()*w)) + 1;
    let curY = 2*(Math.floor(Math.random()*h)) + 1;
    // 暫定のスタート位置（valueが最大のもので置き換えていく）
    startX = curX;
    startY = curY;
    // curX,curYのidを1にする（最初の処理）
    m[curY][curX] = 1;
    // 進行方向の逆の向きを格納するためのスタックを用意する
    let stuck = [];

    // step3:最初のサーチ
    // 目的はスタート位置の決定と通れるマスに1をふること
    // そして通れないマスに2をふること
    // これが終わるとidが1,2,4で埋まる（はず）
    let guard = 9999;
    while(guard--){
      let dirs = []; // 進める方向のリスト。
      // step3.1:curX,curYから進める方向を割り出す
      for(let i = 0; i < 4; i++){
        let sgn = m[curY + dy[i]][curX + dx[i]];
        // 壁の方向には進めない
        if(sgn==2 || sgn==4){ continue; }
        // 未定なら進める可能性がある
        if(sgn==0){
          // 0のさらに先のマスのidを取得
          const sgn2 = m[curY + 2*dy[i]][curX + 2*dx[i]];
          // そこが1ならそっちへは行けないので
          // 通路を2(壁)で埋めてスルー
          if(sgn2==1){
            m[curY + dy[i]][curX + dx[i]] = 2;
            continue;
          }
          dirs.push(i);
        }
      }
      // step3.2:進める方向がある場合
      if(dirs.length > 0){
        // まずは方向を取得（ランダム）
        const nextDir = dirs[Math.floor(Math.random()*dirs.length)];
        // そっちと、そっちの先の奇数2つのマスのidを1にする
        m[curY + dy[nextDir]][curX + dx[nextDir]] = 1;
        m[curY + 2*dy[nextDir]][curX + 2*dx[nextDir]] = 1;
        // 現在地のvalueを取得
        const currentValue = values[curY][curX];
        // curXとcurYを更新する（向こうのマス）
        curX += 2*dx[nextDir];
        curY += 2*dy[nextDir];
        // valueは進むたびに増やしていくだけ（ラクチン）
        values[curY][curX] = currentValue + 1;
        // 進行方向の逆向きの方向を格納しておく
        stuck.push((nextDir + 2) % 4);
        continue;
      }else if(stuck.length > 0){
        // step3.3:進める方向がないが後退できる場合
        const backDir = stuck.pop();
        curX += 2*dx[backDir];
        curY += 2*dy[backDir];
        continue;
      }
      break;
    }
    // この時点でスタートは確定しているがゴールが定まらない。
    // 何でもいいんだけどまあ一番遠いとこがいいよねって。
    // 実は適当に定めた点から最も遠い点を決めたときに、
    // そこから一番遠い点を決めるとそれらの間の距離が直径になる
    // というトポロジーの定理があるので、
    // それを使ってゴールを決めることにします。

    // ループとかいろいろあった方が面白いかもしれないけど...

    // mについては通れるところはすべて1になっているので
    // 1だけ拾うと迷路の概形が得られる
    // 4は外壁で2は内壁でこれらは確定でこの先変化しません。
    // 0は消滅しました。残っていません。

    // step4:一旦valuesを初期化する。
    for(let y=0; y<2*h+1; y++){
      for(let x=0; x<2*w+1; x++){
        values[y][x] = 0;
      }
    }

    // step5:curをスタートに設定しgoal変数をstartで初期化
    curX = startX;
    curY = startY;
    goalX = curX;
    goalY = curY;
    // stuckも初期化
    stuck = [];

    // step6:先ほどと同じ流れでstartX,startYから最も遠い
    // 点を割り出してgoalとする。
    // ポイント：今現時点で通れるマスがすべて1になっている。
    // これからの作業の過程で辺に相当するマスに3が入っていく。
    // 3は探索済みの印。
    while(guard--){
      let dirs = [];
      for(let i = 0; i < 4; i++){
        let sgn = m[curY+dy[i]][curX+dx[i]];
        if(sgn == 2 || sgn == 3){ continue; }
        if(sgn == 1){ dirs.push(i); break; }
      }
      if(dirs.length > 0){
        const nextDir = dirs[0]; // ランダムである必要がないので。
        m[curY+dy[nextDir]][curX+dx[nextDir]] = 3;
        const currentValue = values[curY][curX];
        curY += 2*dy[nextDir];
        curX += 2*dx[nextDir];
        // valuesの値を更新する
        values[curY][curX] = currentValue + 1;
        // 計算したvaluesの値がより大きければgoalを更新する
        if(values[curY][curX] > values[goalY][goalX]){
          goalY = curY; goalX = curX;
        }
        stuck.push((nextDir + 2) % 4);
        continue;
      }else if(stuck.length > 0){
        const backDir = stuck.pop();
        curY += 2*dy[backDir];
        curX += 2*dx[backDir];
        continue;
      }
      break;
    }
    // goalが決まりました。1と3は...
    // 3をすべて1にしてしまった方が楽かもな。
    for(let y=0; y<2*h+1; y++){
      for(let x=0; x<2*w+1; x++){
        if(m[y][x]==3){m[y][x] = 1}
      }
    }
    // これで1かどうかで進めるかどうか決まる。わかりやすい～。
  }

  // canMove.
  // x,yに相当する(2*x+1,2*y+1)の上下左右に進めるかどうかの話。
  function canMove(x, y, d){
    return m[2*y+1+dy[d]][2*x+1+dx[d]] == 1;
  }
  function isStart(x, y){
    return (startX == 2*x+1) && (startY == 2*y+1);
  }
  function isGoal(x, y){
    return (goalX == 2*x+1) && (goalY == 2*y+1);
  }

  return {m, start:{x:startX, y:startY}, goal:{x:goalX,y:goalY}, initialize, create, canMove, isGoal, isStart};
}

let _maze;

function setup() {
  createCanvas(16*33, 16*25);
  noStroke();
  background(0);
  // 一度テスト
  _maze = maze(16, 12);
  _maze.create();
  visualize(16, 12);
}

function mouseClicked(){
  // これでいい
  // サイズ変えないならそのままcreateすればいいし
  // 変えるならオブジェクトそれ自体をとっかえてしまえばいい。
  // ラクチン！！！！
  const w = 8+Math.floor(Math.random()*8);
  const h = 6+Math.floor(Math.random()*6);
  _maze = maze(w, h);
  _maze.create();
  visualize(w, h);
}

function visualize(w,h){
  clear();
  for(let y=0; y<2*h+1; y++){
    for(let x=0; x<2*w+1; x++){
      const index = _maze.m[y][x];
      if(index==4){fill(64)}
      if(index==2){fill(0,64,128)}
      if(index==1){fill(255)}
      rect(x*16,y*16,16);
    }
  }
}
