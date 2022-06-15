function main( x, y, p )

  local w = bs_width()/10
  local dx,dy = bs_dir()
  local nx,ny = bs_normal()

  if not firstDraw then
    local distance = bs_distance( px - x, py - y )
    if distance < w then
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
  local space = w*10
  local pspace = pw*10

  for i=-2, 2, 1 do
    bs_polygon(x+space*nx*i+nx*w/2 ,y+space*ny*i+ny*w/2)
    bs_polygon(x+space*nx*i-nx*w/2 ,y+space*ny*i-ny*w/2)
    bs_polygon(px+pspace*pnx*i-pnx*w/2 ,py+pspace*pny*i-pny*pw/2)
    bs_polygon(px+pspace*pnx*i+pnx*w/2 ,py+pspace*pny*i+pny*pw/2)
    bs_fill(r,g,b,255)
  end

  if (barProg>100) then
    barProg = 0
    bs_polygon(x+space*nx*2+dx*w/2 ,y+space*ny*2+dy*w/2)
    bs_polygon(x+space*nx*2-dx*w/2 ,y+space*ny*2-dy*w/2)
    bs_polygon(x-space*nx*2-dx*w/2 ,y-space*ny*2-dy*w/2)
    bs_polygon(x-space*nx*2+dx*w/2 ,y-space*ny*2+dy*w/2)
    bs_fill(r,g,b,255)
  else
    barProg = barProg+1
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

px = 0
py = 0
pdx = 0
pdy = 0
pnx = 0
pny = 0
pw = 0
barProg = 0
firstDraw = true
