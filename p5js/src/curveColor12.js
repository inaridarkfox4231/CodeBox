// curve関係ないけどtriangleの話

function setup(){
  createCanvas(400, 400, WEBGL);
}

function draw(){
  background(0);
  fill(255, 128, 0);
  //directionalLight(255, 255, 255, 0, 0, -1);
  //ambientLight(64);
  const t = frameCount*TAU/240;
  //triangle(0,0,0, 0,100,0, 100*cos(t),100,100*sin(t));
  //noLoop();

  triangle(0, 0, 0, -100, -100, -100);
}

// 'triangle'のところ、引数いじればいけるでしょう。
// 6を9にする
// あるいは、overloads？よくわからんけど、6と9を複数用意してどっちかが引っかかるようにする。
// そうすればおそらく6～9みたいになるのだろう。
// quadが8～14になってましたし。
// optionalを使うとあってもなくてもいい、ってなるっぽいね...それで8～14なのだろうね。
// で、その場合6未満でも9より大きくてもエラーになるので6～9を想定してよく、quadのように、
// 8以下なら0,1,2,3,4,5で引数6つのtriangleを呼び出せばいいし、
// 9であれば0,1,2,...,8を使って引数9つのtriangleを使えばいい。
// だから、あそこのいじり方さえわかればとんとん拍子で進む...はず。

// というわけで、あそこのいじり方、というか引数9つバージョンの増やし方だけまとめといて、それ以外を構築してissue...
// めんどい。やだ。

/*

_main.default.RendererGL.prototype.triangle = function (args) {
  var x1, y1, z1, x2, y2, z2, x3, y3, z3;
  // こういうことがしたいわけね
  if(args.length <= 6){
    x1 = args[0]; y1 = args[1]; z1 = 0;
    x2 = args[2]; y2 = args[3]; z2 = 0;
    x3 = args[4]; y3 = args[5]; z3 = 0;
  }else{
    x1 = args[0]; y1 = args[1]; z1 = args[2];
    x2 = args[3]; y2 = args[4]; z2 = args[5];
    x3 = args[6]; y3 = args[7]; z3 = args[8];
  }
  // しかしあれをいじる方法がわかりませんね...
  var gId = 'tri';
  if (!this.geometryInHash(gId)) {
    var _triangle = function _triangle() {
      var vertices = [
      ];
      vertices.push(new _main.default.Vector(0, 0, 0));
      vertices.push(new _main.default.Vector(0, 1, 0));
      vertices.push(new _main.default.Vector(1, 0, 0));
      this.strokeIndices = [
        [0,
        1],
        [
          1,
          2
        ],
        [
          2,
          0
        ]
      ];
      this.vertices = vertices;
      this.faces = [
        [0,
        1,
        2]
      ];
      this.uvs = [
        0,
        0,
        0,
        1,
        1,
        1
      ];
    };
    var triGeom = new _main.default.Geometry(1, 1, _triangle);
    triGeom._makeTriangleEdges()._edgesToVertices();
    triGeom.computeNormals();
    this.createBuffers(gId, triGeom);
  } // only one triangle is cached, one point is at the origin, and the
  // two adjacent sides are tne unit vectors along the X & Y axes.
  //
  // this matrix multiplication transforms those two unit vectors
  // onto the required vector prior to rendering, and moves the
  // origin appropriately.

  // あー、法線attributeだから動的更新無理だ...んー。あ、いけるわ。
  // uNMatrixをaNormalにかけるでしょ。aNormalが全部(0,0,1)だから、uNMatrixをいじって全部同じ法線になるようにすればいいんだわ。
  // 楽勝。
  // じゃないですね。バリデーションの壁を越えられない。引数9つが許されるような仕様変更が許されないようです。無理～
  // これどこにも書いてないしな...どうすんだろ。issue立てるしかないわね。
  // バリデーションはあれでいいとは思うけど引数関連の処理がこれでいいとは思えないし。まあquadとか参考にすべきかと。
  // uNMatrixはそれでいいと思うけど難しいでしょうね...
  // 今見たらquad, 引数10個と14個あるな？そういうことできるんだ。
  // じゃあこっちも6と9と2つ、overloads? そういう方向性で、できるかも、ね。今日はここまで。
  var uMVMatrix = this.uMVMatrix.copy();
  try {
    var mult = new _main.default.Matrix([x2 - x1,
    y2 - y1,
    z2 - z1,
    0, // the resulting unit X-axis
    x3 - x1,
    y3 - y1,
    z3 - z1,
    0, // the resulting unit Y-axis
    0,
    0,
    1,
    0, // the resulting unit Z-axis (unchanged)
    x1,
    y1,
    z1,
    1 // the resulting origin
    ]).mult(this.uMVMatrix);
    this.uMVMatrix = mult;
    this.drawBuffers(gId);
  } finally {
    this.uMVMatrix = uMVMatrix;
  }
  return this;
};

*/
