--4分休符
function setQuarterRest()
  bs_bezier_begin(0,0)
  bs_bezier_y(-0.2,-1.0,0.5,-0.7)
  bs_bezier_y(-0.5,-1.8,0.5,-2.2)
  bs_bezier_l(0,-3.05)
  bs_bezier_l(-0.05,-3.0)
  bs_bezier_y(0.3,-2.0,-0.5,-1.8)
  bs_bezier_l(0,-1)
  bs_bezier_v(-1.0,-1.0,0,0)
  bs_bezier_move_center()
  bs_bezier_move(0,-0.2)
end

function main( x, y, p )
  local w = bs_width()/40 -- あー、だからwは標準で1なのね。
  local dx,dy = bs_dir()
  local nx,ny = bs_normal()

  if not firstDraw then
    local distance = bs_distance( px - x, py - y )
    if distance < w*2 then
      return 0
    end
  else
    px = x
    py = y
    pdx = dx
    pdy = dy
    pnx = nx
    pny = ny
    pw = w
    firstDraw = false
    return 0
  end

  local r,g,b = bs_fore()
  local a = bs_opaque()*255
  local space = w*10 -- そしてspaceは標準で10, 五線譜の間隔。間隔だからspaceなのか...わかってきたぞ。
  local pspace = pw*10

  --五線描画
  for i=-2, 2, 1 do --なおこれは-2から2まで両端を含み5つ全部
    bs_polygon(x+space*nx*i+nx*w/2 ,y+space*ny*i+ny*w/2)
    bs_polygon(x+space*nx*i-nx*w/2 ,y+space*ny*i-ny*w/2)
    bs_polygon(px+pspace*pnx*i-pnx*w/2 ,py+pspace*pny*i-pny*pw/2)
    bs_polygon(px+pspace*pnx*i+pnx*w/2 ,py+pspace*pny*i+pny*pw/2)
    bs_fill(r,g,b,a)
  end

  --小節終わり
  if (barProg>165) then
    barProg = 0
    bs_polygon(x+space*nx*2+dx*w/2 ,y+space*ny*2+dy*w/2)
    bs_polygon(x+space*nx*2-dx*w/2 ,y+space*ny*2-dy*w/2)
    bs_polygon(x-space*nx*2-dx*w/2 ,y-space*ny*2-dy*w/2)
    bs_polygon(x-space*nx*2+dx*w/2 ,y-space*ny*2+dy*w/2)
    bs_fill(r,g,b,a)
  else
    barProg = barProg+2
  end

  --拍頭でリズムを決める
  if (barProg%40 == 0) then
    rhythm = math.random(0,2)
  end

  --4分音符描画
  if (rhythm==0 and barProg%40 == 26) then
    tone = math.random(-4,4) ---4,-3,-2,-1,0,1,2,3,4. つまり五線譜上のどこか。
    --space/2はスペースの半分、つまり音符の刻み幅。
    --nx,nyは法線方向ですから...で、楕円の横は1.1倍で縦が0.8倍、ちょっと小さめの楕円を、
    --法線方向から1ラジアンだけ回したものをつかっているみたいです。要検証。

    --どうでもいいけど変数同じの使いすぎ...まあいいんだけど。
    --絵、上手くなりたいね...
    --線は同じ高さから出てるみたい。dxとdyは進行方向だから音符の中心からずらしてるわね。
    --wは音符の旗の太さ、要するに五線譜と同じ太さ、標準で1ということのようですね。背の高さは見ての通り3.5倍ですねぇ。
    --そして真ん中かそれより下の場合は上に伸ばして真ん中より上なら下に伸ばしますね。
    --下に伸ばす場合は反対側なので反対側になってる感じか...

    --調べたけど反対側の伸ばし棒は1だけ下にずらすのがいいみたい
    --さらに調べたけど2の方がいいみたい？2だとそれっぽいのよ。
    --つまり間隔の半分だけ横にずれてから間隔の1/5だけ上下に動いてそこから間隔の3.5倍だけ線を伸ばすと。
    bs_ellipse(x+nx*space/2*sttone,y+ny*space/2*sttone,space*1.1,space*0.8,1.0+math.atan2(ny,nx),r,g,b,a)
    if (sttone<=0) then
      bs_polygon(x+nx*space/2*sttone-dx*space/2                   ,y+ny*space/2*sttone-dy*space/2)
      bs_polygon(x+nx*space/2*sttone-dx*space/2+dx*w              ,y+ny*space/2*sttone-dy*space/2+dy*w)
      bs_polygon(x+nx*space/2*sttone-dx*space/2+dx*w+nx*space*3.5 ,y+ny*space/2*sttone-dy*space/2+dy*w+ny*space*3.5)
      bs_polygon(x+nx*space/2*sttone-dx*space/2+nx*space*3.5      ,y+ny*space/2*sttone-dy*space/2+ny*space*3.5)
    else
      bs_polygon(x+nx*space/2*sttone+dx*space/2-dx*w-nx*space*3.5 ,y+ny*space/2*sttone+dy*space/2-dy*w-ny*space*3.5)
      bs_polygon(x+nx*space/2*sttone+dx*space/2-nx*space*3.5      ,y+ny*space/2*sttone+dy*space/2-ny*space*3.5)
      bs_polygon(x+nx*space/2*sttone+dx*space/2                   ,y+ny*space/2*sttone+dy*space/2)
      bs_polygon(x+nx*space/2*sttone+dx*space/2-dx*w              ,y+ny*space/2*sttone+dy*space/2-dy*w)
    end
    bs_fill(r,g,b,a)
  end

  --8分音符描画（2連続表）
  --2連続で描画するやつの前半部分
  -- if-elseで分けてるのは上か下かってのを判断しているのだろう
  --見た感じw（標準で40）が音符の長さになってるっぽい？
  -- これも途中まで普通の四分音符だから割と無駄遣いしてるんだよな...まあいいけど。

  --なるほど
  --上に伸びる場合は通常の
  --こっちも同様で3.5と2.8はフラッグの長さだと思う
  if (rhythm==1 and barProg%40 == 16) then
    sttone = math.random(-4,4)
    bs_ellipse(x+nx*space/2*sttone,y+ny*space/2*sttone,space*1.1,space*0.8,1.0+math.atan2(ny,nx),r,g,b,a)
    if (sttone<=0) then
      bs_polygon(x+nx*space/2*sttone-dx*space/2                   ,y+ny*space/2*sttone-dy*space/2)
      bs_polygon(x+nx*space/2*sttone-dx*space/2+dx*w              ,y+ny*space/2*sttone-dy*space/2+dy*w)
      bs_polygon(x+nx*space/2*sttone-dx*space/2+dx*w+nx*space*3.2 ,y+ny*space/2*sttone-dy*space/2+dy*w+ny*space*3.2)
      bs_polygon(x+nx*space/2*sttone-dx*space/2+nx*space*3.2      ,y+ny*space/2*sttone-dy*space/2+ny*space*3.2)
      st8ax = x+nx*space/2*sttone-dx*space/2+nx*space*3.5
      st8ay = y+ny*space/2*sttone-dy*space/2+ny*space*3.5
      st8bx = x+nx*space/2*sttone-dx*space/2+nx*space*2.8
      st8by = y+ny*space/2*sttone-dy*space/2+ny*space*2.8
    else
      bs_polygon(x+nx*space/2*sttone+dx*space/2-dx*w-nx*space*3.2 ,y+ny*space/2*sttone+dy*space/2-dy*w-ny*space*3.2)
      bs_polygon(x+nx*space/2*sttone+dx*space/2-nx*space*3.2      ,y+ny*space/2*sttone+dy*space/2-ny*space*3.2)
      bs_polygon(x+nx*space/2*sttone+dx*space/2                   ,y+ny*space/2*sttone+dy*space/2)
      bs_polygon(x+nx*space/2*sttone+dx*space/2-dx*w              ,y+ny*space/2*sttone+dy*space/2-dy*w)
      st8ax = x+nx*space/2*sttone+dx*space/2-dx*w-nx*space*3.5
      st8ay = y+ny*space/2*sttone+dy*space/2-dy*w-ny*space*3.5
      st8bx = x+nx*space/2*sttone+dx*space/2-dx*w-nx*space*2.8
      st8by = y+ny*space/2*sttone+dy*space/2-dy*w-ny*space*2.8
    end
    bs_fill(r,g,b,a)
  end

  --8分音符描画（2連続裏）
  --2連続で描画するやつの後半部分

  --先ほど記録した2点とこちらで用意する2点でひし形を作りその中を塗りつぶすことで
  --2連符を表現しているみたいです
  --なので五線譜が乱れると激しく影響を受ける...できるだけ滑らかに線を流しましょう。
  -- そしてそれをなんか165くらいの長さの周期でやってるみたい。
  if (rhythm==1 and barProg%40 == 36) then
    local tone=math.random(-4,4)
    bs_ellipse(x+nx*space/2*tone,y+ny*space/2*tone,space*1.1,space*0.8,1.0+math.atan2(ny,nx),r,g,b,a)
    if (sttone<=0) then
      bs_polygon(x+nx*space/2*tone-dx*space/2                   ,y+ny*space/2*tone-dy*space/2)
      bs_polygon(x+nx*space/2*tone-dx*space/2+dx*w              ,y+ny*space/2*tone-dy*space/2+dy*w)
      bs_polygon(x+nx*space/2*tone-dx*space/2+dx*w+nx*space*3.5 ,y+ny*space/2*tone-dy*space/2+dy*w+ny*space*3.5)
      bs_polygon(x+nx*space/2*tone-dx*space/2+nx*space*3.5      ,y+ny*space/2*tone-dy*space/2+ny*space*3.5)
      bs_polygon(st8ax,st8ay)
      bs_polygon(st8bx,st8by)
      bs_polygon(x+nx*space/2*tone-dx*space/2+nx*space*2.8      ,y+ny*space/2*tone-dy*space/2+ny*space*2.8)
    else
      bs_polygon(x+nx*space/2*tone+dx*space/2-nx*space*3.5      ,y+ny*space/2*tone+dy*space/2-ny*space*3.5)
      bs_polygon(x+nx*space/2*tone+dx*space/2-dx*w-nx*space*3.5 ,y+ny*space/2*tone+dy*space/2-dy*w-ny*space*3.5)
      bs_polygon(st8ax,st8ay)
      bs_polygon(st8bx,st8by)
      bs_polygon(x+nx*space/2*tone+dx*space/2-dx*w-nx*space*2.8 ,y+ny*space/2*tone+dy*space/2-dy*w-ny*space*2.8)
      bs_polygon(x+nx*space/2*tone+dx*space/2-dx*w              ,y+ny*space/2*tone+dy*space/2-dy*w)
      bs_polygon(x+nx*space/2*tone+dx*space/2                   ,y+ny*space/2*tone+dy*space/2)
    end
    bs_fill(r,g,b,a)
  end

  --4分休符描画
  if (rhythm==2 and barProg%40 == 26) then
    setQuarterRest()
    bs_bezier_mul(space,space)
    bs_bezier_rotate(math.atan2(ny,nx)+math.pi/2)
    bs_bezier_move(x,y)
    bs_fill(r,g,b,a)
  end

  px = x
  py = y
  pdx = dx
  pdy = dy
  pnx = nx
  pny = ny
  pw = w

  return 1
end

--透明度を設定したとき綺麗になるように設定
bs_setmode(1)

px = 0
py = 0
pdx = 0
pdy = 0
pnx = 0
pny = 0
pw = 0
rhythm = 0--1拍の使い方
sttone = 0 --初回の音の高さ
st8ax = 0 --8分音符の線の始点
st8ay = 0
st8bx = 0
st8by = 0

barProg = 0
firstDraw = true
