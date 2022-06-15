function  param1()
  return   "interval" , 10 , 100 , 50
end

function  set_heart( w )
 bs_bezier_begin( 0 , 0  )
 bs_bezier_c( - 1 , - 1 , - 0.5 , - 2 , 0 , - 1.3  )
 bs_bezier_c( 0.5 , - 2 , 1 , - 1 , 0 , 0  )
 bs_bezier_mul( w, w* 0.7  )
 bs_bezier_move_center()
end

function  main( x, y, p )

  local  w = bs_width_max()
  if  w < 5   then
   w = 5
  end

  if   not  firstDraw then
    local  distance = bs_distance( lastDrawX - x, lastDrawY - y )
    if  distance < w* 2.0  * bs_param1()/ 100   then
      return   0
    end
  end

  local  dx,dy = bs_dir()
  local  nx,ny = bs_normal()
  local  r,g,b = bs_forebg( p )

 set_heart( w )
 bs_bezier_rotate( bs_atan( dx, dy ) )
 bs_bezier_move( x, y )
 bs_fill( r,g,b, 255  )

 lastDrawX = x
 lastDrawY = y
 firstDraw = false

  return   1
end

lastDrawX = 0
lastDrawY = 0
firstDraw = true
