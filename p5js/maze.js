// 迷路の生成の仕方をまとめます
// えーと。
// 頂点と辺のデータを与えるとスタートとゴールの情報を
// インデックスで保持したあれができる・・
// クラス1:グラフ。頂点と辺の組み合わせ。
// 頂点と辺もクラスにする・・？
// 辺は両端の頂点の情報を保持していて通れるかどうかの情報持つ。
// 頂点は辺の情報を保持している。通れるかどうかのboolは辺が持ってる。

// 20211010
// テストします。

// テスト成功しました。疲れた。離脱。

// クリックで頂点と辺作って迷路ができる！ってのやりたい
// かってにオブジェクトが配置されて徘徊する
// 頂点が動いて辺もそれにつられる感じ

// 最終的には2つのあれを作る
// ひとつはクリックでグラフ作って勝手に木というか迷路生成
// もうひとつは・・
// 迷路の再生成noLoop()してましたごめんなさい

// あとはあれ
// 迷路に対して外周を作る感じのやつ
// それをpythonに落としてあっちで迷路作れるようにしたい感じ・・
// 壁の厚さとか0～1で操作して・・点のデータまとめていじれるように。
// イメージ
// まず各々の頂点の4隅に頂点を配置（頂点数の4倍の頂点が置かれる感じ）
// それらをつなぐ。つなぎ方は、同じマス内の頂点の場合は、
// それらを結ぶ辺が通れる辺を横切らないように。
// で、隣同士の場合は、それらの頂点がつながっていないこと。
// こうして生成した頂点族と、そのインデックスに基づいて
// 辺のデータができたら、あとは一筆書きを作るだけ。その順番に
// x座標とy座標を並べれば完成。なんだけど、そのあとで適切にいじりたい
// ので、その順にインデックスを並べて、幅が適切に変えられるようにする。
// インデックスからそれが存在するマスがグリッドで求められるように
// なってるからそれをもとにしていじれる、たとえば(2,3)だったら
// (2.5, 3.5) + (±0.5r, ±0.5r)とかする感じ。r:0～1で。
// たとえば4x3の迷路なら辺の長さが4mx3mになる感じね。小さい方がよさそう
// な気もするけどスケール変換で・・

// これのバリエーションを2つ作る感じね

// 1つ目
// クリックで自由に迷路を作る。できたあとで迷路にしたりする
// なんか、もういい、やめよ・・
// 3Dに落とす準備だけよろしく
// ていうか本格的にblenderにのめりこみたいのでもういいです。おわり！

let myGraph;
let myMaze;

// スタートとゴールとそれ以外
const ORDINARY = 0;
const START = 1;
const GOAL = 2;

// ゴールサーチ用
const UNCHECKED = 0;
const CHECKED = 1;

// 頂点のstateの種類。
const UNREACHED = 0; // 未到達
const ARRIVED = 1; // 到達済み

// 辺のstateの種類。
const UNDETERMINED = 0; // 未到達
const IS_PASSABLE = 1; // 通過可能
const IS_NOT_PASSABLE = 2; // 通過不能

const FORWARD = 0; // 次の頂点が見つかりました。次のステップは新しい頂点から始まります。
const AVOID = 1;   // 頂点は到達済みでした。別の頂点を探します。
const BACK = 2;    // 次の頂点が見つからないので引き返します。
const FINISH = 3;  // 木の作成が完了しました。

function setup() {
  createCanvas(600, 600);

  myGraph = new Graph();
  createGraph();
  myMaze = new VisualMaze();
  myMaze.setBone(myGraph);
  myMaze.createMaze();

  noFill();
  stroke(255);
}

function draw() {
  background(0);
  myMaze.draw();
}

// 適当に継承して使う・・（はず）
class GraphVertice{
  constructor(i){
    this.index = i;
    this.connectedEdges = [];
    this.state = UNREACHED;
    this.type = ORDINARY;
    this.value = 0;
    this.onRoute = false;
  }
  setIndex(i){
    // 迷路作成前の頂点の番号の付け直しに使う感じ
    this.index = i;
  }
  getIndex(){
    return this.index;
  }
  reset(){
    this.state = UNREACHED;
    this.type = ORDINARY;
    this.value = 0;
    this.onRoute = false;
  }
  registEdge(e){
    this.connectedEdges.push(e);
  }
  setState(newState){
    this.state = newState;
  }
  getState(){
    return this.state;
  }
  setValue(value){
    this.value = value;
  }
  getValue(){
    return this.value;
  }
  setType(newType){
    this.type = newType;
  }
  getType(){
    return this.type;
  }
  setOnRoute(){
    this.onRoute = true;
  }
}

class VisualVertice extends GraphVertice{
  constructor(i, x, y){
    super(i, x, y);
    this.position = createVector(x, y);
  }
  getPosition(){
    return this.position;
  }
  setPosition(x, y){
    this.position.set(x, y);
  }
  draw(){
    const radius = (this.onRoute ? 12 : 6);
    circle(this.position.x, this.position.y, radius);
  }
}

// 適当に継承して使う・・？
class GraphEdge{
  constructor(i){
    this.index = i;
    this.connectedVertices = [];
    this.passable = false; // 通れるかどうか
    this.state = UNDETERMINED;
    this.flag = UNCHECKED; // ゴールサーチ用
  }
  setIndex(i){
    // 迷路作成前の頂点の番号の付け直しに使う感じ
    this.index = i;
  }
  getIndex(){
    return this.index;
  }
  reset(){
    this.passable = false;
    this.state = UNDETERMINED;
    this.flag = UNCHECKED;
  }
  registVertice(v){
    this.connectedVertices.push(v);
  }
  setState(newState){
    this.state = newState;
    if(newState === IS_PASSABLE){
      this.passable = true;
    }
  }
  getState(){
    return this.state;
  }
  setFlag(newFlag){
    this.flag = newFlag;
  }
  getFlag(){
    return this.flag;
  }
  getOtherVertice(v){
    // あっ逆だ
    // わぁ・・・・馬鹿だね。。
    const cV = this.connectedVertices;
    if(v.getIndex() === cV[0].getIndex()){
      return cV[1];
    }
    return cV[0];
  }
}

class VisualEdge extends GraphEdge{
  constructor(i){
    super(i);
  }
  draw(){
    const p1 = this.connectedVertices[0].getPosition();
    const p2 = this.connectedVertices[1].getPosition();
    line(p1.x, p1.y, p2.x, p2.y);
  }
}

class Graph{
  constructor(){
    this.vertices = [];
    this.edges = [];
  }
  reset(){
    this.vertices = [];
    this.edges = [];
  }
  showVerticeInfo(){
    for(let v of this.vertices){ console.log(v.connectedEdges); }
  }
  showEdgeInfo(){
    for(let e of this.edges){ console.log(e.connectedVertices); }
  }
  dataReset(){
    // 頂点や辺の配列は保持したまま
    // それらの内部情報のみリセットする感じ
    for(let v of this.vertices){ v.reset(); }
    for(let e of this.edges){ e.reset(); }
  }
  createGraph(vArray, eArray, data){
    this.vertices.push(...vArray);
    this.edges.push(...eArray);

    // dataには{v1:a,v2:b,e:c}という形で
    // インデックス表記で接続情報が入ってるのでそれを元に
    // 接続を構成する感じね。
    for(let datum of data){
      const v1 = this.vertices[datum.v1Index];
      const v2 = this.vertices[datum.v2Index];
      const e = this.edges[datum.eIndex];
      this.connect(v1, v2, e);
    }
  }
  connect(v1, v2, e){
    v1.registEdge(e);
    v2.registEdge(e);
    e.registVertice(v1);
    e.registVertice(v2);
  }
}

// 迷路クラス
// Graphはほかにも用途があると思うので
// Graphと迷路データのコンポジットとしてMazeクラスを用意する
// 具体的にはグラフをセットしたうえで
// そのグラフに対して付加構造を提供する感じね

// グラフを迷路化して、付加構造の内容をdataに格納する
// 1.各頂点のedge配列をシャッフル
// 2.勝手に頂点を選ぶ。
// 3.木構造を作り、暫定的なスタートを設定
// 　スタートは勝手に取った頂点から最も遠いところ
// 4.そのスタートから最も遠い頂点がゴールになるのでそれを計算
// 　と同時に各頂点についてそれが次の頂点になる場合の
// 　そこに至る頂点のインデックスを記録しておく
// 5.さきほど記録したインデックスに従ってゴールからさかのぼる
// 　ことで経路上の頂点にフラグを立てられるので
// 　それらのvalueや、経路から外れた場合も何回戻ったら
// 　フラグが立つのか調べることで外れる長さを求められる。
// 　そこまでやる必要あるのかって感じだけど。
// 6.最後に経路から最も外れている頂点のインデックスの計算。
// 　そこに宝とか置いたりできそうな。あるいは
// 　迷路作ってから手を加えてもいいかも。
// 　辺の長さを設けてそれで評価しても面白そうね・・
class Maze{
  constructor(){
    this.bone = undefined;
    this.vertices = [];
    this.edges = [];
    this.data = {};
    this.currentVertice = undefined;
    this.start = undefined;
    this.goal = undefined;
    this.edgeStack = [];
  }
  setBone(bone){
    // メソッドをsetBoneと分けることで、別のグラフをセットして
    // 別の迷路を作ったりできる。
    this.bone = bone;
    this.vertices = [];
    this.vertices.push(...bone.vertices);
    this.edges = [];
    this.edges.push(...bone.edges);
  }
  initialize(seed = -1){
    if(seed >= 0){ randomSeed(seed); }
    this.bone.dataReset();
    this.currentVertice = random(this.vertices);
    this.currentVertice.setState(ARRIVED);
    this.start = this.currentVertice;
    this.edgeStack = [];
  }
  createMaze(seed = -1){
    // 初期化
    this.initialize(seed);

    // 暫定的にスタートを決める（無限ループ怖いのでdebugでガード）
    let debug = 999999;
    while(debug--){
      const state = this.step();
      if(state === FINISH){ break; }
    }

    // この時点で暫定的に選んだスタートが確定している感じですね
    this.start.setType(START);
    // とりあえずゴールを探す
    // 同時にいろいろやる
    this.searchGoal();
    // ゴールを設定。おつかれさま！
    //this.goal.setType(GOAL);
  }
  step(){
    // 現在の頂点から伸びている未確定の辺があれば取得
    const undeterminedEdges = this.currentVertice.connectedEdges.filter((e) => { return e.getState() === UNDETERMINED; })
    // 未確定の辺がなくstuckが空なら終了
    if(undeterminedEdges.length + this.edgeStack.length === 0){ return FINISH; }
    if(undeterminedEdges.length > 0){
      // 未確定の辺が伸びている場合
      let connectedEdge = random(undeterminedEdges);
      let nextVertice = connectedEdge.getOtherVertice(this.currentVertice);
      if(nextVertice.getState() === UNREACHED){
        // 辺の先の頂点が未到達の場合
        nextVertice.setState(ARRIVED);
        connectedEdge.setState(IS_PASSABLE);
        // valueを更新、より大きければstartも更新
        const v = this.currentVertice.getValue();
        nextVertice.setValue(v + 1);
        if(this.start.getValue() < v + 1){ this.start = nextVertice; }
        // currentVerticeを更新, 通った道をstackに格納
        this.currentVertice = nextVertice;
        this.edgeStack.push(connectedEdge);
        return FORWARD;
      }else{
        // すでに到達済み
        connectedEdge.setState(IS_NOT_PASSABLE);
      }
      return AVOID;
    }
    // 伸びているすべての辺が確定済みの場合
    // 最後にスタックに入れた辺を伝って戻る
    const backEdge = this.edgeStack.pop();
    const backVertice = backEdge.getOtherVertice(this.currentVertice);
    this.currentVertice = backVertice;
    return BACK;
  }
  searchGoal(){
    // スタートからたどっていく
    // 各頂点のインデックスにそこに到達するのに使った頂点のインデックス
    // を紐付けして辿れるようにしておく
    let indexArray = new Array(this.vertices.length);
    // valueを初期化。edgeStackは[]になってるので操作は不要。
    for(let v of this.vertices){ v.setValue(0); }
    // goalはstartから始めてよりvalueの大きい頂点で置き換えていく
    this.goal = this.start;
    // 捜索用のcurrentVerticeもstartから始める
    this.currentVertice = this.start;
    let debug = 999999;
    while(debug--){
      const uncheckedEdges = this.currentVertice.connectedEdges.filter((e) => { return e.getState() === IS_PASSABLE && e.getFlag() === UNCHECKED; })
      if(uncheckedEdges.length + this.edgeStack.length === 0){ break; }
      // すべての辺がチェック済みの場合
      if(uncheckedEdges.length === 0){
        const backEdge = this.edgeStack.pop();
        const backVertice = backEdge.getOtherVertice(this.currentVertice);
        this.currentVertice = backVertice;
        continue;
      }
      // チェックしてない頂点がある場合
      const connectedEdge = random(uncheckedEdges);
      const nextVertice = connectedEdge.getOtherVertice(this.currentVertice);
      connectedEdge.setFlag(CHECKED);
      const v = this.currentVertice.getValue();
      // 新しい頂点のvalue, goalのvalueを更新
      nextVertice.setValue(v + 1);
      if(this.goal.getValue() < v + 1){ this.goal = nextVertice; }
      // 「nextVerticeのindex」番に「currentVerticeのindex」を入れる
      indexArray[nextVertice.getIndex()] = this.currentVertice.getIndex();
      // 次の頂点を設定
      this.currentVertice = nextVertice;
      this.edgeStack.push(connectedEdge);
    }
    // この時点でgoalは確定済み
    this.goal.setType(GOAL);
    // goalからさかのぼっていく
    this.goal.setOnRoute();
    const startIndex = this.start.getIndex();
    this.currentVertice = this.goal;
    debug = 999999;
    while(debug--){
      const currentIndex = this.currentVertice.getIndex();
      const destination = this.vertices[indexArray[currentIndex]]
      destination.setOnRoute();
      this.currentVertice = destination;
      if(destination.getIndex() === startIndex){ break; }
    }
    // これでonRouteを振り終わったはず。
  }
}

// 迷路の可視化・・まあ、いろいろと。
// 頂点や辺は個別にstrokeとか指定してもいいかも。
class VisualMaze extends Maze{
  constructor(){
    super();
  }
  draw(){
    // 通れる辺は暗い色で。
    for(let e of this.edges){
      if(e.passable){ stroke(255); }else{ stroke(64); }
      e.draw();
    }
    for(let v of this.vertices){
      if(v.type === ORDINARY){ stroke(255);
      }else if(v.type === START){ stroke(255, 128, 0); }
      else if(v.type === GOAL){ stroke(0, 128, 255); }
      v.draw();
    }
  }
}

function createGraph(){
  let vArray = [];
  let eArray = [];
  let index = 0;
  for(let i = 0; i < 6; i++){
    for(let k = 0; k < 6; k++){
      vArray.push(new VisualVertice(index, 50 + 100 * i, 50 + 100 * k));
      index++;
    }
  }
  for(let i = 0; i < 60; i++){ eArray.push(new VisualEdge(i)); }
  // 縦の辺。0～3, 4～7, 8～11, 12～15.
  let vInd1, vInd2, eInd;
  let data = [];
  for(let i = 0; i < 6; i++){
    for(let k = 0; k < 5; k++){
      vInd1 = i * 6 + k;
      vInd2 = i * 6 + k + 1;
      eInd = i * 5 + k;
      data.push({v1Index:vInd1, v2Index:vInd2, eIndex:eInd});
    }
  }
  for(let k = 0; k < 6; k++){
    for(let i = 0; i < 5; i++){
      vInd1 = k + i * 6;
      vInd2 = k + (i + 1) * 6;
      eInd = 30 + k * 5 + i;
      data.push({v1Index:vInd1, v2Index:vInd2, eIndex:eInd});
    }
  }
  myGraph.createGraph(vArray, eArray, data);
}

function mouseClicked(){
  myMaze.createMaze(Math.random() * 99999);
}

// 迷路を作るっていうのは
// 辺に通れるかどうかの情報（true/false）を与えたうえで
// 頂点にはスタートとゴールの情報を与えて
// さらにスタートから一番遠い頂点がゴールになるけど
// そこからの割合、経路上かどうか、そういった情報も・・
// 与えます。

// onRouteだけでいいよもう。つかれた。
// 辺の方に持たせる。頂点だとたどれないので。
// valueは使うのでね。
