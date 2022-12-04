// 修正テスト

// CENTERとBOTTOMで消えちゃうやつ

/*
62800    for (var i = 0; i < lines.length; i++) {
62801	     this._renderText(p, lines[i], x, y - _offset2, finalMaxHeight, finalMinHeight);
62802	     y += p.textLeading();
62803    }
ここを
62800    for (var i = 0; i < lines.length; i++) {
62801	     this._renderText(p, lines[i], x, y - _offset2, finalMaxHeight, finalMinHeight - _offset2);
62802	     y += p.textLeading();
62803    }
こうする。つまり - _offset2の分だけずらすことで消えないようにするわけ。
*/

function setup() {
	createCanvas(400, 400);
	background(0);
	noStroke();
	fill(255);

	textSize(32);
	textAlign(CENTER, TOP);
	text("七\n福\n神", 80, 200);
	textAlign(CENTER, BASELINE);
	text("七\n福\n神", 160, 200);
	textAlign(CENTER, BOTTOM);
	text("七\n福\n神", 240, 200);
	textAlign(CENTER, CENTER);
	text("七\n福\n神", 320, 200);

	textSize(16);
	text("TOP", 80, 160);
	text("BASELINE", 160, 120);
	text("BOTTOM", 240, 240);
	text("CENTER", 320, 280);
	stroke(255);
	line(0,200,400,200);
}
