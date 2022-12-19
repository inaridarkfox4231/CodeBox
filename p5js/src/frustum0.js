// frustumのデフォルトをperspectiveに合わせるにはどうすればいいか
// perspectiveのnearとfarが
// this.defaultCameraNearとthis.defaultCameraFarであればいいね。そして...
// this.defaultCameraFOV = 60 / 180 * Math.PI;
// this.defaultAspectRatio = this._renderer.width / this._renderer.height;
// この2つも使うね
// near*tan(fov/2)*aspectRatioのマイナスとプラス、
// near*tan(fov.2)のマイナスとプラス、でいいと思う。
// もう一つの問題はこれをやるとカリングが逆になるんですよね。困ったね。
// y軸が上向きになるんよ。その...自然に設定すると。
// デフォルトが...というより例がそうなってるのでね。
// それはありなのか？それとも逆にすべきなのか？そういう話。

// orthoは-,+,-,+で設定するとy軸が下向きになる
// frustumは-,+,-,+で設定するとy軸が上向きになる。これは行列を見ると分かる。逆になってるのよ。

// 難しいです。
// 落ち着いて考えればわかること。
// 個人的にはどちらも-,+,-,+で設定した場合にy軸が下向きになるような設定で行くべきだと思ってる。
// 理由は簡単で今更プリミティブのカリング方向を直すのが事実上不可能だから。
// だからfrustumに犠牲になってもらう。これの、まずデフォルトをperspectiveに合わせたうえで、
// 行列のyをいじって-,+,-,+でy軸が下を向くようにするってわけ。それでいいと思う。

function setup(){
  createCanvas(600, 400, WEBGL);
  perspective();
  frustum();
}

function draw(){
  background(0);
  fill(255, 0, 0);
  sphere(80);
}
