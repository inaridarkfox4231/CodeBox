--三角形のブラシ
--参考：https://firealpaca.com/bs

function  main( x, y, p )

  local  w = bs_width()
  if  w < 5   then
   w = 5
  end

  if   not  firstDraw then
    local  distance = bs_distance( lastDrawX - x, lastDrawY - y )
    if  distance < w then
      return   0
    end
  end

  local  dx,dy = bs_dir()
  local  nx,ny = bs_normal()

 bs_polygon( x + nx * w/ 3 , y + ny * w/ 3  )
 bs_polygon( x - nx * w/ 3 , y - ny * w/ 3  )
 bs_polygon( x + dx * w, y + dy * w )

  local  r,g,b = bs_fore()
 bs_fill( r,g,b, 255  )

 lastDrawX = x
 lastDrawY = y
 firstDraw = false

  return   1
end

lastDrawX = 0
lastDrawY = 0
firstDraw = true
