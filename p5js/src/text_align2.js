// 修正案その2
// rectMode(CENTER)でおかしくなるやつについて

/*
62671  if (this._rectMode === constants.CENTER) {
62672    y -= maxHeight / 2;
62673  }
これを
62671  if (this._rectMode === constants.CENTER) {
62672    y -= maxHeight / 2; finalMinHeight -= maxHeight/2;
62673  }
こうする。つまりfinalMinHeightにも補正をかけるということ。これでうまくいくはず。
rectModeがCENTERの場合の処理なので、CENTERでない場合は従来通りです。
*/

function setup() {
	createCanvas(400, 400);
	background(0);
  noStroke();
	fill(255);
	rectMode(CENTER);

	textSize(32);
	textAlign(CENTER, BASELINE);
	text("毘\n沙\n門\n天", 50, 200, 100, 400);
	textAlign(CENTER, TOP);
	text("毘\n沙\n門\n天", 150, 200, 100, 400);
	textAlign(CENTER, CENTER);
	text("毘\n沙\n門\n天", 250, 200, 100, 400);
	textAlign(CENTER, BOTTOM);
	text("毘\n沙\n門\n天", 350, 200, 100, 400);

	noFill();
	stroke(255);
	rect(50, 200, 100, 400);
	rect(150, 200, 100, 400);
	rect(250, 200, 100, 400);
	rect(350, 200, 100, 400);
}
