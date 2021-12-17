// ステージと武器のデータ。
// 武器のグレードアップどうするか思案中。。

// ---------------------------------------------- //
// weaponSeeds.

// 武器データとなるオブジェクトを渡す

function getWeaponSeeds(){
  let seeds = [];
  let weaponCapacity = 0;

  // プレイヤーの攻撃パターン作成
  // デフォルト。黒い弾丸をいっぱい。
  seeds[weaponCapacity++] = {
    action:{
      main:[{shotDistance:["set", 25]}, {shotAction:"go"}, {catch:"a"}, {nway:{count:4, interval:40}},
            {wait:4}, {loop:INF, back:"a"}],
      go:[{direction:["set", -90]}]
    }
  };

  // 武器を追加するならこの辺になんか書く
  // fire命令がスペースキーを押している間だけ次の命令に進むようになっている仕組み。

  // 鞭
  seeds[weaponCapacity++] = {
    color:"blue",
    action:{
      main:[{deco:{color:"blue", shape:"rectSmall"}}, {catch:"a"}, {radial:{count:6}},
            {wait:3}, {shotDirection:["add", [-15, 15]]}, {loop:INF, back:"a"}]
    }
  }

  // ばらばらショット
  seeds[weaponCapacity++] = {
    color:"green",
    action:{
      main:[{deco:{color:"green", shape:"starSmall"}}, {catch:"a"}, {fire:""},
            {shotDirection:["set", [0, 360]]}, {wait:1}, {loop:INF, back:"a"}]
    }
  }

  return seeds;
}

// ---------------------------------------------- //
// patternSeeds.

function getPatternSeeds(){
  let seeds = [];

  // 新しいcircularの実験中。FALさんの4を書き直し。
  // shotDirectionの初期設定は撃ちだした瞬間の進行方向。
  seeds.push({
    x:0.5, y:0.3, shotSpeed:10, collisionFlag:ENEMY, bgId:0, color:"green",
    action:{
      main:[{shotAction:"sweeping"}, {deco:{color:"black", shape:"rectSmall"}}, {radial:{count:4}}],
      sweeping:[{speed:["set", 0.001, 30]}, {move:"circular", bearing:-3},
                {bind:true}, {shotDirection:["rel", 0]},
                {shotSpeed:["set", 4]}, {deco:{color:"red", shape:"rectSmall"}},
                {catch:"a"}, {fire:""}, {wait:1}, {shotDirection:["add", 12]}, {loop:INF, back:"a"}]
    }
  });

  // とりあえず水増し

  seeds.push({
    x:0.5, y:0.3, shotSpeed:10, collisionFlag:ENEMY, bgId:1, color:"green",
    action:{
      main:[{shotAction:"sweeping"}, {deco:{color:"black", shape:"rectSmall"}}, {radial:{count:4}}],
      sweeping:[{speed:["set", 0.001, 30]}, {move:"circular", bearing:-3},
                {bind:true}, {shotDirection:["rel", 0]},
                {shotSpeed:["set", 4]}, {deco:{color:"red", shape:"rectSmall"}},
                {catch:"a"}, {fire:""}, {wait:1}, {shotDirection:["add", 12]}, {loop:INF, back:"a"}]
    }
  });

  seeds.push({
    x:0.5, y:0.3, shotSpeed:10, collisionFlag:ENEMY, bgId:2, color:"green",
    action:{
      main:[{shotAction:"sweeping"}, {deco:{color:"black", shape:"rectSmall"}}, {radial:{count:4}}],
      sweeping:[{speed:["set", 0.001, 30]}, {move:"circular", bearing:-3},
                {bind:true}, {shotDirection:["rel", 0]},
                {shotSpeed:["set", 4]}, {deco:{color:"red", shape:"rectSmall"}},
                {catch:"a"}, {fire:""}, {wait:1}, {shotDirection:["add", 12]}, {loop:INF, back:"a"}]
    }
  });

  return seeds;
}
