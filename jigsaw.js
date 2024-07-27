let svg;
let jsr = 0x5EED;
function rand(){
  jsr^=(jsr<<17);
  jsr^=(jsr>>13);
  jsr^=(jsr<<5);
  return (jsr>>>0)/4294967295;
}

const fs = require('fs');
let cw = 64;
let jw = 6;
let jh = 14;
let jk = 14;
let jg = 2;

let nc = 9;
let nr = 13;

let dat = new Array(nc*nr).fill(0).map(_=>({
  x:(rand()-0.5)*0.25*cw,
  y:(rand()-0.5)*0.25*cw,
  jl:(rand()>0.5)?1:-1,
  jt:(rand()>0.5)?1:-1,
}))

function ratbez (p0, p1, p2, w, t){
  if (w == undefined) {w = 2};
  var u = (Math.pow (1 - t, 2) + 2 * t * (1 - t) * w + t * t);
  return [
    (Math.pow(1-t,2)*p0[0]+2*t*(1-t)*p1[0]*w+t*t*p2[0])/u,
    (Math.pow(1-t,2)*p0[1]+2*t*(1-t)*p1[1]*w+t*t*p2[1])/u,
  ];
}

function organ(ps,ws){
  let o = [ps[0].slice()];
  let n = 5;
  for (let i = 1; i < ps.length-1; i++){
    let p0 = ps[i-1];
    let p1 = ps[i];
    let p2 = ps[i+1];
    let q0 = [p0[0]*0.5+p1[0]*0.5, p0[1]*0.5+p1[1]*0.5];
    let q1 = [p2[0]*0.5+p1[0]*0.5, p2[1]*0.5+p1[1]*0.5];
    for (let j = 0; j < n; j++){
      let q = ratbez(q0,p1,q1,ws[i],j/(n-1));
      o.push(q);
    }
  }
  o.push(ps.at(-1).slice());
  return o;
}

let ps = [];
for (let i = 1; i < nr; i++){
  let p = [];
  for (let j = 0; j < nc; j++){
    let x0 = j*cw;
    let y0 = i*cw;
    let {x,y,l,t,jl,jt} = dat[i*nc+j];
    p.push([x0+(j==0?0:x),y0+y]);
    p.push([x0+cw/2-jw,y0]);
    p.push([x0+cw/2-jk,y0+jh*jt]);
    p.push([x0+cw/2,y0+(jh+jg)*jt]);
    p.push([x0+cw/2+jk,y0+jh*jt]);
    p.push([x0+cw/2+jw,y0]);
    if (j == nc-1){
      p.push([x0+cw,y0+dat[i*nc].x]);
    }
  }
  // ps.push(p);
  ps.push(organ(p,p.map(x=>2)))
}

for (let j = 1; j < nc; j++){
  let p = [];
  for (let i = 0; i < nr; i++){
    let x0 = j*cw;
    let y0 = i*cw;
    let {x,y,l,t,jl,jt} = dat[i*nc+j];
    p.push([x0+x,y0+(i==0?0:y)]);
    p.push([x0,y0+cw/2-jw]);
    p.push([x0+jh*jt,y0+cw/2-jk]);
    p.push([x0+(jh+jg)*jt,y0+cw/2]);
    p.push([x0+jh*jt,y0+cw/2+jk]);
    p.push([x0,y0+cw/2+jw]);
    if (i == nr-1){
      p.push([x0+dat[j].y,y0+cw]);
    }
  }
  // ps.push(p);
  ps.push(organ(p,p.map(x=>2)))
}

function draw_svg(polys,w,h,scale){
  let o = `<svg xmlns="http://www.w3.org/2000/svg" width="${w*scale}" height="${h*scale}">`
  o += `<rect x="0" y="0" width="${w*scale}" height="${h*scale}" fill="none" stroke-width="1" stroke="black"/>`
  o += `<path stroke="#000" fill="none" d="`;
  for (let i = 0; i < polys.length; i++){
    o += " M "
    for (let j = 0; j < polys[i].length; j++){
      let [x,y] = polys[i][j];
      o += `${(~~((x*scale)*100)) /100} ${(~~((y*scale)*100)) /100} `;
    }
  }
  o += `" />\n`;
  o += `</svg>`
  return o;
}

svg = draw_svg(ps,nc*cw,nr*cw,1);

fs.writeFileSync("out/jigsaw.svg",svg);



let dpi = 72;
let thk = 72*3/32;
let tol = 0.2/25.4*72

function make_brd(w,h,na,za,nb,zb,nc,zc,nd,zd){
  let ta = w/na;
  let tb = h/nb;
  let tc = w/nc;
  let td = h/nd;
  let o = [];
  for (let i = 0; i < na; i++){
    if (za == -1){
      o.push([i*ta,-(i%2?0:thk)]);
      o.push([(i+1)*ta,-(i%2?0:thk)]);
    }else if (za == 1){
      o.push([i*ta,-(i%2?thk:0)]);
      o.push([(i+1)*ta,-(i%2?thk:0)]);
    }else{
      // o.push([i*ta,0]);
    }
  }
  if (za==-1 && zb == -1){
    o.push([w+thk,-thk]);
  }
  for (let i = 0; i < nb; i++){
    if (zb == -1){
      o.push([w+(i%2?0:thk),i*tb]);
      o.push([w+(i%2?0:thk),(i+1)*tb]);
    }else if (zb == 1){

      o.push([w+(i%2?thk:0),i*tb]);
      o.push([w+(i%2?thk:0),(i+1)*tb]);
    }else{
      // o.push([w,i*tb]);
    }
  }
  if (zb==-1 && zc == -1){
    o.push([w+thk,h+thk]);
  }
  for (let i = 0; i < nc; i++){
    if (zc == -1){
      o.push([w-(i*tc),h+(i%2?0:thk)]);
      o.push([w-(i+1)*tc,h+(i%2?0:thk)]);
    }else if (zc == 1){
      o.push([w-(i*tc),h+(i%2?thk:0)]);
      o.push([w-(i+1)*tc,h+(i%2?thk:0)]);
    }else{
      // o.push([w-i*tc,h]);
    }
  }
  if (zc==-1 && zd == -1){
    o.push([-thk,h+thk]);
  }
  for (let i = 0; i < nd; i++){
    if (zd == -1){
      o.push([-(i%2?0:thk),h-i*td]);
      o.push([-(i%2?0:thk),h-(i+1)*td]);
    }else if (zd == 1){

      o.push([-(i%2?thk:0),h-i*td]);
      o.push([-(i%2?thk:0),h-(i+1)*td]);
    }else{
      // o.push([0,h-i*td]);
    }
  }
  if (zd==-1 && za == -1){
    o.push([-thk,-thk]);
  }
  
  let o2 = [o[0]];
  for (let i = 1; i < o.length; i++){
    let [x,y] = o2.at(-1);
    if (Math.abs(x-o[i][0])<0.1 && Math.abs(y-o[i][1])<0.1){
      continue;
    }
    o2.push(o[i])
  }
  // o2.push(o2.at(0).slice());
  return o2;
}


function trsl_poly(poly,x,y){
  return poly.map(xy=>[xy[0]+x,xy[1]+y]);
}
function scl_poly(poly,sx,sy){
  if (sy === undefined) sy = sx;
  return poly.map(xy=>[xy[0]*sx,xy[1]*sy]);
}
function shr_poly(poly,sx){
  return poly.map(xy=>[xy[0]+xy[1]*sx,xy[1]]);
}
function rot_poly(poly,th){
  let qoly = [];
  let costh = Math.cos(th);
  let sinth = Math.sin(th);
  for (let i = 0; i < poly.length; i++){
    let [x0,y0] = poly[i]
    let x = x0* costh-y0*sinth;
    let y = x0* sinth+y0*costh;
    qoly.push([x,y]);
  }
  return qoly;
}

function draw_svgz(polys,w,h,scale){
  let o = `<svg xmlns="http://www.w3.org/2000/svg" width="${w*scale}" height="${h*scale}">`
  o += `<rect x="0" y="0" width="${w*scale}" height="${h*scale}" fill="white" stroke-width="1" stroke="black"/>`
  o += `<path stroke="#000" fill="none" d="`;
  for (let i = 0; i < polys.length; i++){
    o += " M "
    for (let j = 0; j < polys[i].length; j++){
      let [x,y] = polys[i][j];
      o += `${(~~((x*scale)*100)) /100} ${(~~((y*scale)*100)) /100} `;
    }
    o += ' z '
  }
  o += `" />\n`;
  o += `</svg>`
  return o;
}

let o = []//[[[0,0],[10,0],[10,10],[0,10]]];

let W = 2.9;
let H = 5;
let D = 1.7;

o.push(trsl_poly(make_brd(
  W*dpi,H*dpi,
  7,1,13,1,
  7,1,13,1,),30,40
));

o.push(trsl_poly(make_brd(
  D*dpi,H*dpi,
  5,-1,13,0,
  5,-1,13,-1,),260,40
));

o.push(trsl_poly(make_brd(
  W*dpi,D*dpi,
  7,0,5,1,
  7,-1,5,1,),400,40
));

o.push(trsl_poly(rot_poly(make_brd(
  W*dpi,D*dpi,
  7,0,5,1,
  7,-1,5,1,),Math.PI/2),1700,170
));

o.push(trsl_poly(make_brd(
  W*dpi+thk*2+tol*2,D*dpi+thk+tol*2,
  7,1,5,1,
  7,-1,5,1,),400,200
));

o.push(trsl_poly(make_brd(
  D*dpi,H*dpi,
  5,-1,13,0,
  5,-1,13,-1,),645,40
));


o.push(trsl_poly(make_brd(
  W*dpi+thk*2+tol*2,H*dpi+thk,
  7,0,13,1,
  7,1,13,1,),780,35
));

o.push(trsl_poly(make_brd(
  D*dpi+thk*1+tol*2,H*dpi+thk,
  5,0,13,-1,
  5,-1,13,-1,),1030,35
));


o.push(trsl_poly(make_brd(
  W*dpi+thk*2+tol*2,H*dpi+thk,
  7,0,13,1,
  7,-1,13,1,),1185,35
));

o.push(trsl_poly(make_brd(
  D*dpi+thk*1+tol*2,H*dpi+thk,
  5,0,13,-1,
  5,-1,13,-1,),1430,35
));


// console.log(JSON.stringify(o));

svg = draw_svgz(o,24*dpi,6*dpi,1);
fs.writeFileSync("out/box.svg",svg);