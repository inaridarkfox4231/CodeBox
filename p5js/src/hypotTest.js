function setup(){
  createCanvas(400,400);
  let a, t0, t1;
  t0 = millis()/1000;
  for(let i=0; i<20000; i++){ a = dist(2, 4); }
  t1 = millis()/1000;
  console.log((t1-t0).toFixed(6));
}
