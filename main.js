let jsr = 0x5EED;
let {PI,sin,cos} = Math;
function rand(){
  jsr^=(jsr<<17);
  jsr^=(jsr>>13);
  jsr^=(jsr<<5);
  return (jsr>>>0)/4294967295;
}

var PERLIN_YWRAPB = 4; var PERLIN_YWRAP = 1<<PERLIN_YWRAPB;
var PERLIN_ZWRAPB = 8; var PERLIN_ZWRAP = 1<<PERLIN_ZWRAPB;
var PERLIN_SIZE = 4095;
var perlin_octaves = 4;var perlin_amp_falloff = 0.5;
var scaled_cosine = function(i) {return 0.5*(1.0-Math.cos(i*PI));};
var perlin;
let noise = function(x,y,z) {
  y = y || 0; z = z || 0;
  if (perlin == null) {
    perlin = new Array(PERLIN_SIZE + 1);
    for (var i = 0; i < PERLIN_SIZE + 1; i++) {
      perlin[i] = rand();
    }
  }
  if (x<0) { x=-x; } if (y<0) { y=-y; } if (z<0) { z=-z; }
  var xi=Math.floor(x), yi=Math.floor(y), zi=Math.floor(z);
  var xf = x - xi; var yf = y - yi; var zf = z - zi;
  var rxf, ryf;
  var r=0; var ampl=0.5;
  var n1,n2,n3;
  for (var o=0; o<perlin_octaves; o++) {
    var of=xi+(yi<<PERLIN_YWRAPB)+(zi<<PERLIN_ZWRAPB);
    rxf = scaled_cosine(xf); ryf = scaled_cosine(yf);
    n1  = perlin[of&PERLIN_SIZE];
    n1 += rxf*(perlin[(of+1)&PERLIN_SIZE]-n1);
    n2  = perlin[(of+PERLIN_YWRAP)&PERLIN_SIZE];
    n2 += rxf*(perlin[(of+PERLIN_YWRAP+1)&PERLIN_SIZE]-n2);
    n1 += ryf*(n2-n1);
    of += PERLIN_ZWRAP;
    n2  = perlin[of&PERLIN_SIZE];
    n2 += rxf*(perlin[(of+1)&PERLIN_SIZE]-n2);
    n3  = perlin[(of+PERLIN_YWRAP)&PERLIN_SIZE];
    n3 += rxf*(perlin[(of+PERLIN_YWRAP+1)&PERLIN_SIZE]-n3);
    n2 += ryf*(n3-n2);
    n1 += scaled_cosine(zf)*(n2-n1);
    r += n1*ampl;
    ampl *= perlin_amp_falloff;
    xi<<=1; xf*=2; yi<<=1; yf*=2; zi<<=1; zf*=2;
    if (xf>=1.0) { xi++; xf--; }
    if (yf>=1.0) { yi++; yf--; }
    if (zf>=1.0) { zi++; zf--; }
  }
  return r;
};

function draw_svg(polys,w,h,scale){
  let o = `<svg xmlns="http://www.w3.org/2000/svg"\nwidth="${w*scale}" height="${h*scale}"\n>`
  o += `<rect x="0" y="0" width="${w*scale}" height="${h*scale}" fill="floralwhite" stroke-width="1" stroke="black"/>`
  for (let i = 0; i < polys.length; i++){
    if (polys[i].t == 'c'){
      o += `<path stroke="none" fill="floralwhite" d="\nM`;
    }else if (polys[i].t == 'l'){
      o += `<path stroke="black" stroke-width="0.5" fill="none" stroke-linecap="round" stroke-linejoin="round" d="\nM`;
    }
    for (let j = 0; j < polys[i].p.length; j++){
      let [x,y] = polys[i].p[j];
      o += `${(~~((x*scale)*1000)) /1000},${(~~((y*scale)*1000)) /1000} `;
    }
    if (polys[i].t == 'c'){
      o += `z\n"/>`;
    }else if (polys[i].t == 'l'){
      o += `\n"/>`;
    }
  }
  o += `</svg>`
  return o;
}

function branch01(x,y,a,l){
  a = (a + PI*10)%(PI*2);
  let lor = PI/2 < a && a < PI+PI/2;
  let lord = lor?1:-1;
  function leaf(x,y,a,l){
    let o = [];
    o.push({t:'c',p:[
      [x-sin(a),y+cos(a)],
      [x+sin(a),y-cos(a)],
      [x+cos(a)*l,y+sin(a)*l]
    ]});
    o.push({t:'l',p:[[x,y],[x+cos(a)*l,y+sin(a)*l]]});
    return o;
  }
  let o = [];
  if (l < 20){
    let xx = x;
    let yy = y;
    let stp = 3;
    let lo = [];
    for (let i = 0; i < l; i+= stp){
      lo.push([xx,yy]);
      o.push(...leaf(xx,yy,a-0.5,5));
      o.push(...leaf(xx,yy,a+0.5,5));
      xx += cos(a)*stp;
      yy += sin(a)*stp;
      a += rand()*0.8-0.4;
    }
    o.push({t:'l',p:lo})
    // o.push([[x,y],[x+cos(a)*l,y+sin(a)*l]]);
  }else{
    let lo = [];
    let ro = [];
    let xx = x;
    let yy = y;
    let stp = 10
    let start = l > 50 ? l*(0+rand()*0.2) : 0
    for (let i = 0; i < l; i+= stp){
      let w = Math.max(0.5,Math.min((l-i)*0.02,1.5));
      lo.push([
        xx + sin(a)*w,
        yy - cos(a)*w
      ]);
      ro.push([
        xx - sin(a)*w,
        yy + cos(a)*w
      ]);
      if (lor){
        a -= rand()*0.4-0.1;
      }else{
        a += rand()*0.4-0.1;
      }
      if (i > start && i <= l-10){
        o.push(...branch01(xx,yy,a-0.5-lord*0.1+(rand()*0.4-0.2),(l-i)*0.6*(rand()*0.5+0.5)));
        o.push(...branch01(xx,yy,a+0.5-lord*0.1+(rand()*0.4-0.2),(l-i)*0.6*(rand()*0.5+0.5)));
      }
      xx += cos(a)*stp;
      yy += sin(a)*stp;
    }
    let rlo = lo.concat(ro.reverse());
    o.push({t:'c',p:rlo})
    o.push({t:'l',p:rlo})
  }
  return o;
}


function tree01(x,y,a,l){
  let o = [];
  let o2 = [];
  let lo = [];
  let ro = [];
  let xx = x;
  let yy = y;
  let stp = 7;
  for (let i = 0; i < l; i+= stp){
    let w = Math.min((l-i)*0.02,6)+0.5;
    lo.push([
      xx + sin(a)*w,
      yy - cos(a)*w
    ]);
    ro.push([
      xx - sin(a)*w,
      yy + cos(a)*w
    ]);
    for (let j = 0; j < 3; j++){
      let rw = ~~(rand()*w*2-w);
      o2.push({t:'l',p:[
        [xx + sin(a)*rw,yy - cos(a)*rw],
        [cos(a)*stp*rand()+xx + sin(a)*rw,sin(a)*stp*rand()+yy - cos(a)*rw],
      ]});
    }
    if (i > 50 && i <= l-10){
      let nl = Math.min(100,(l-i)*0.4*(rand()*0.5+0.5)+5);
      let rw = rand()*w;
      if (rand()<0.5){
        o2.push(...branch01(
          xx + sin(a)*rw,
          yy - cos(a)*rw,
          a-PI/2+0.3+(rand()*0.8-0.4),nl));
      }else{
        o2.push(...branch01(
          xx - sin(a)*rw,
          yy + cos(a)*rw,
          a+PI/2-0.3+(rand()*0.8-0.4),nl));
      }
    }

    xx += cos(a)*stp;
    yy += sin(a)*stp;
    a += rand()*0.01-0.005;
  }
  let rlo = lo.concat(ro.reverse());
  o.push({t:'c',p:rlo})
  o.push({t:'l',p:rlo})
  o2.forEach(x=>o.push(x));
  return o;
}


function grass01(x,y,a,l){
  function leaf(x,y,a,l){
    let o = [];
    let w = 2;
    o.push({t:'c',p:[
      [x-sin(a)*w,y+cos(a)*w],
      [x+sin(a)*w,y-cos(a)*w],
      [x+cos(a)*l+sin(a)*w,y+sin(a)*l-cos(a)*w],
      [x+cos(a)*l-sin(a)*w,y+sin(a)*l+cos(a)*w],
    ]});
    o.push({t:'l',p:[[x,y],[x+cos(a)*l,y+sin(a)*l]]});
    return o;
  }
  let o = [];
  let o2 = [];
  let lo = [];
  let ro = [];
  let mo = [];
  let xx = x;
  let yy = y;
  let stp = 4;
  let su = (rand()<0.1);
  let da = 0;
  for (let i = 0; i < l; i+= stp){
    let w = 1;
    lo.push([
      xx + sin(a)*w,
      yy - cos(a)*w
    ]);
    ro.push([
      xx - sin(a)*w,
      yy + cos(a)*w
    ]);
    mo.push([
      xx,yy
    ])
    if (su && i > l*0.8){
      let nl = 5;
      let rw = w;
      let t = (i-l*0.8)/(l*0.2)
      for (let j = 0; j < 5; j++){
        if (rand()<0.5){
          o2.push(...leaf(
            xx+ sin(a)*rw + cos(a)*j/5*stp,
            yy- cos(a)*rw + sin(a)*j/5*stp,
            a-PI/2+0.8+t,nl));
        }else{
          o2.push(...leaf(
            xx- sin(a)*rw + cos(a)*j/5*stp,
            yy+ cos(a)*rw + sin(a)*j/5*stp,
            a+PI/2-0.8-t,nl));
        }
      }
    }

    xx += cos(a)*stp;
    yy += sin(a)*stp;
    a += (rand()-0.5)*da;
    da += 0.03
  }
  let rlo = lo.concat(ro.reverse());
  o.push({t:'c',p:rlo})
  o.push({t:'l',p:mo})
  
  o2.forEach(x=>o.push(x));
  return o;
}

function grass02(x,y,a,l){
  let o = [];
  let o2 = [];
  let lo = [];
  let ro = [];
  let mo = [];
  let xx = x;
  let yy = y;
  let stp = 4;
  let da = 0;
  for (let i = 0; i < l; i+= stp){
    let w = 0.5;
    lo.push([
      xx + sin(a)*w,
      yy - cos(a)*w
    ]);
    ro.push([
      xx - sin(a)*w,
      yy + cos(a)*w
    ]);
    mo.push([
      xx,yy
    ])
    xx += cos(a)*stp;
    yy += sin(a)*stp;
    a += (rand()-0.5)*da;
    da += 0.03
  }
  let rlo = lo.concat(ro.reverse());
  o.push({t:'c',p:rlo})
  o.push({t:'l',p:mo})
  o2.forEach(x=>o.push(x));
  return o;
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

function flower01(x,y,a,l){
  function petal(x0,y0,x1,y1,x2,y2,x3,y3){
    let o = [];
    let lo = [];
    let ro = [];
    let n = 12;
    let sa = rand()*5-2;
    for (let i = 0; i < n; i++){
      let t = i/n;
      let xl = x0*(1-t)+x1*t;
      let yl = y0*(1-t)+y1*t;

      let xr = x3*(1-t)+x2*t;
      let yr = y3*(1-t)+y2*t;

      yl -= sin(t*PI)*sa;
      yr -= sin(t*PI)*sa;

      let s = Math.pow(t,2)*0.5+(rand()*0.04-0.02);
      let ul = xl*(1-s)+xr*s;
      let vl = yl*(1-s)+yr*s;

      let ur = xl*(s)+xr*(1-s);
      let vr = yl*(s)+yr*(1-s);

      lo.push([ul,vl]);
      ro.push([ur,vr]);

    }
    let rlo = lo.concat(ro.reverse());

    o.push({t:'c',p:rlo})
    o.push({t:'l',p:rlo})
    return o;

  }
  let o = [];
  let o2 = [];
  let n = 12;
  let co = [];
  let wa = 4;
  let wb = 2;
  let wc = 20;
  let wd = 10;
  let df = rand()*10-5
  for (let i = 0; i < n; i++){
    let th0 = -i/n*PI*2;
    let th1 = -(i+1)/n*PI*2;
    let x0 = /*x +*/ cos(th0)*wa;
    let y0 = /*y +*/ sin(th0)*wb;
    let x1 = /*x +*/ cos(th0)*wc;
    let y1 = /*y +*/ sin(th0)*wd+df + rand()*6-3;
    let x2 = /*x +*/ cos(th1)*wa;
    let y2 = /*y +*/ sin(th1)*wb;
    let x3 = /*x +*/ cos(th1)*wc;
    let y3 = /*y +*/ sin(th1)*wd+df + rand()*6-3;
    
    // o.push({t:'l',p:[[x0,y0],[x1,y1]]})
    let q = petal(x0,y0,x1,y1,x3,y3,x2,y2);
    if (i < n/2){
      q.forEach(q=>o.push(q));
    }else{
      q.forEach(q=>o2.push(q));
    }

    co.push([x0,y0])
  }
  o.push({t:'c',p:co});
  o.push({t:'l',p:co});
  o2.forEach(x=>o.push(x))

  for (let i = 0; i < o.length; i++){
    o[i].p = rot_poly(o[i].p,a).map(([a,b])=>[a*l+x,b*l+y]);
  }
  return o;
}

function plant01(x,y,a,l,fsz){
  let o = [];
  let o2 = [];
  let lo = [];
  let ro = [];
  let xx = x;
  let yy = y;
  let stp = 4;
  let da =0;
  for (let i = 0; i < l; i+= stp){
    let w = 1;
    lo.push([
      xx + sin(a)*w,
      yy - cos(a)*w
    ]);
    ro.push([
      xx - sin(a)*w,
      yy + cos(a)*w
    ]);
    xx += cos(a)*stp;
    yy += sin(a)*stp;
    a += (rand()-0.5)*da;
    da += 0.01;
  }
  

  let rlo = lo.concat(ro.reverse());
  o.push({t:'c',p:rlo})
  o.push({t:'l',p:rlo})
  o2.forEach(x=>o.push(x));

  flower01(xx,yy,rand()*0.1-0.05,fsz*(rand()*0.25+0.75)).forEach(x=>o.push(x));
  return o;
}

function ratbez (p0, p1, p2, w, t){
  if (w == undefined) {w = 2};
  var u = (Math.pow (1 - t, 2) + 2 * t * (1 - t) * w + t * t);
  return [
    (Math.pow(1-t,2)*p0[0]+2*t*(1-t)*p1[0]*w+t*t*p2[0])/u,
    (Math.pow(1-t,2)*p0[1]+2*t*(1-t)*p1[1]*w+t*t*p2[1])/u,
  ];
}


function deer01(x,y){
  function organz(ps,ws){
    let o = [];
    let n = 5;
    for (let i = 0; i < ps.length; i++){
      let p0 = ps[(i-1+ps.length)%ps.length];
      let p1 = ps[i];
      let p2 = ps[(i+1)%ps.length];
      let q0 = [p0[0]*0.5+p1[0]*0.5, p0[1]*0.5+p1[1]*0.5];
      let q1 = [p2[0]*0.5+p1[0]*0.5, p2[1]*0.5+p1[1]*0.5];
      for (let j = 0; j < n; j++){
        let q = ratbez(q0,p1,q1,ws[i],j/(n-1));
        o.push(q);
      }
    }
    return o;
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
  function body(x0,y0,x1,y1,x2,y2){
    let o = [];
    let a0 = Math.atan2(y0-y1,x0-x1);
    let a1 = Math.atan2(y2-y1,x2-x1);

    let a2 = (a0+a1)/2;
    let x3 = x1+cos(a2)*12;
    let y3 = y1+sin(a2)*12;
    let x4 = x1-cos(a2)*10;
    let y4 = y1-sin(a2)*10;

    let x5 = x0 + sin(a0)*15;
    let y5 = y0 - cos(a0)*15;
    let x6 = x0 - sin(a0)*5;
    let y6 = y0 + cos(a0)*5;

    let x7 = x2 + sin(a1)*1;
    let y7 = y2 - cos(a1)*1;
    let x8 = x2 - sin(a1)*1;
    let y8 = y2 + cos(a1)*1;

    let og = organz([[x6,y6],[x5,y5],[x3,y3],[x8,y8],[x7,y7],[x4,y4]],[2,1.2,2,2,2,5]);

    o.push({t:'c',p:og});
    o.push({t:'l',p:og});
    // o.push({t:'l',p:[[x0,y0],[x1,y1],[x2,y2]]});
    return o;
  }
  function leg(x0,y0,x1,y1,x2,y2,x3,y3){

    let o = [];
    let a0 = Math.atan2(y0-y1,x0-x1);
    let a1 = Math.atan2(y2-y1,x2-x1);
    let a2 = Math.atan2(y1-y2,x1-x2);
    let a3 = Math.atan2(y3-y2,x3-x2);

    let a4 = (a0+a1)/2;
    let x4 = x1+cos(a4)*8;
    let y4 = y1+sin(a4)*8;
    let x5 = x1-cos(a4)*5;
    let y5 = y1-sin(a4)*5;

    let a5 = (a2+a3)/2;
    let x6 = x2+cos(a5)*2;
    let y6 = y2+sin(a5)*2;
    let x7 = x2-cos(a5)*2;
    let y7 = y2-sin(a5)*2;

    let x8 = x0 + sin(a0)*8;
    let y8 = y0 - cos(a0)*8;
    let x9 = x0 - sin(a0)*6;
    let y9 = y0 + cos(a0)*6;

    let x10 = x3 + sin(a3)*1;
    let y10 = y3 - cos(a3)*1;
    let x11 = x3 - sin(a3)*1;
    let y11 = y3 + cos(a3)*1;

    let ps = [[x8,y8],[x5,y5],[x7,y7],[x11,y11],[x10,y10],[x6,y6],[x4,y4],[x9,y9]];
    let og = organ(
      ps,
      [4,4,4,4,4,4,]
    );

    o.push({t:'c',p:og});
    o.push({t:'l',p:og});
    // o.push({t:'l',p:[[x0,y0],[x1,y1],[x2,y2],[x3,y3]]});
    // o.push({t:'l',p:ps});
    return o;


  }
  function head(x,y){
    function eye(x,y){
      o.push({t:'l',p:[[x+5,y+7],[x+7,y+8],[x+6,y+10],[x+5,y+7]]});
    }
    function ear(x,y,th){
      let ps = [
        [-2,0],[-3,-5],[0,-12],[3,-5],[1,0]
      ];
      ps = rot_poly(ps,th).map(([a,b])=>[x+a,y+b]);
      let og = organ(
        ps,
        [4,4,4,4,4,4,]
      );
      o.push({t:'c',p:og});
      o.push({t:'l',p:og});
    }
    let ps = [
      [x,y],[x+5,y],[x+8,y+5],[x+10,y+20],[x,y+10],
    ];
    let og = organz(
      ps,
      [4,4,4,4,4,4,]
    );
    ear(x+4,y+2,0.1);
    o.push({t:'c',p:og});
    o.push({t:'l',p:og});
    // o.push({t:'l',p:[[x0,y0],[x1,y1],[x2,y2],[x3,y3]]});
    // o.push({t:'l',p:ps});

    eye(x+0.5,y-1);
    ear(x+2,y+1,-0.2);
    return o;

  }
  function tail(x,y,th){
    let ps = [
      [-1,0],[-7,-10],[0,-25],[-1,-10],[1,0]
    ];
    ps = rot_poly(ps,th).map(([a,b])=>[x+a,y+b]);
    let og = organ(
      ps,
      [1,1,1,1,1]
    );
    o.push({t:'c',p:og});
    o.push({t:'l',p:og});
  }


  let o = [];
  leg(x+45,y+5,x+35,y+5,x+52,y+25,x+60,y+55).forEach(q=>o.push(q));

  leg(x+5,y+3,x+17,y+16,x+10,y+30,x+15,y+55).forEach(q=>o.push(q));

  tail(x+4,y+1,-0.7);

  body(x,y,x+45,y,x+75,y+40).forEach(q=>o.push(q));

  // for (let i = 0; i < 20; i++){
  //   let u = rand()*47+3;
  //   let v = rand()*10-3-u*0.05;
  //   let n = 10;

  //   for (let j = 0; j < n; j+=2){
  //     let a0 = j/n*PI*2;
  //     let a1 = (j+1)/n*PI*2;
  //     o.push({t:'l',p:[
  //       [x+u+cos(a0)*2,y+v+sin(a0)*1.5],
  //       [x+u+cos(a1)*2,y+v+sin(a1)*1.5],
  //     ]})
  //   }

  // }


  leg(x+45,y+5,x+35,y+5,x+45,y+25,x+45,y+55).forEach(q=>o.push(q));

  leg(x+7,y+3,x+15,y+16,x+5,y+30,x+5,y+55).forEach(q=>o.push(q));

  head(x+68,y+28);

  // console.log(o);
  return o;
}


function mountain(y){
  let o = [];
  let ps = [[0,y]];
  let sd = rand()*123
  for (let i = 0; i <= 512; i++){
    let u = i;
    let v = y-noise(i*0.01,sd)*100;
    ps.push([u,v]);
  }
  ps.push([512,y]);

  o.push({t:'c',p:ps});
  o.push({t:'l',p:ps});
  return o;
}


let hershey_raw = {
  "501":"  9I[RFJ[ RRFZ[ RMTWT",
  "502":" 24G\\KFK[ RKFTFWGXHYJYLXNWOTP RKPTPWQXRYTYWXYWZT[K[",
  "503":" 19H]ZKYIWGUFQFOGMILKKNKSLVMXOZQ[U[WZYXZV",
  "504":" 16G\\KFK[ RKFRFUGWIXKYNYSXVWXUZR[K[",
  "505":" 12H[LFL[ RLFYF RLPTP RL[Y[",
  "506":"  9HZLFL[ RLFYF RLPTP",
  "507":" 23H]ZKYIWGUFQFOGMILKKNKSLVMXOZQ[U[WZYXZVZS RUSZS",
  "508":"  9G]KFK[ RYFY[ RKPYP",
  "509":"  3NVRFR[",
  "510":" 11JZVFVVUYTZR[P[NZMYLVLT",
  "511":"  9G\\KFK[ RYFKT RPOY[",
  "512":"  6HYLFL[ RL[X[",
  "513":" 12F^JFJ[ RJFR[ RZFR[ RZFZ[",
  "514":"  9G]KFK[ RKFY[ RYFY[",
  "515":" 22G]PFNGLIKKJNJSKVLXNZP[T[VZXXYVZSZNYKXIVGTFPF",
  "516":" 14G\\KFK[ RKFTFWGXHYJYMXOWPTQKQ",
  "517":" 25G]PFNGLIKKJNJSKVLXNZP[T[VZXXYVZSZNYKXIVGTFPF RSWY]",
  "518":" 17G\\KFK[ RKFTFWGXHYJYLXNWOTPKP RRPY[",
  "519":" 21H\\YIWGTFPFMGKIKKLMMNOOUQWRXSYUYXWZT[P[MZKX",
  "520":"  6JZRFR[ RKFYF",
  "521":" 11G]KFKULXNZQ[S[VZXXYUYF",
  "522":"  6I[JFR[ RZFR[",
  "523":" 12F^HFM[ RRFM[ RRFW[ R\\FW[",
  "524":"  6H\\KFY[ RYFK[",
  "525":"  7I[JFRPR[ RZFRP",
  "526":"  9H\\YFK[ RKFYF RK[Y[",
  "601":" 18I\\XMX[ RXPVNTMQMONMPLSLUMXOZQ[T[VZXX",
  "602":" 18H[LFL[ RLPNNPMSMUNWPXSXUWXUZS[P[NZLX",
  "603":" 15I[XPVNTMQMONMPLSLUMXOZQ[T[VZXX",
  "604":" 18I\\XFX[ RXPVNTMQMONMPLSLUMXOZQ[T[VZXX",
  "605":" 18I[LSXSXQWOVNTMQMONMPLSLUMXOZQ[T[VZXX",
  "606":"  9MYWFUFSGRJR[ ROMVM",
  "607":" 23I\\XMX]W`VaTbQbOa RXPVNTMQMONMPLSLUMXOZQ[T[VZXX",
  "608":" 11I\\MFM[ RMQPNRMUMWNXQX[",
  "609":"  9NVQFRGSFREQF RRMR[",
  "610":" 12MWRFSGTFSERF RSMS^RaPbNb",
  "611":"  9IZMFM[ RWMMW RQSX[",
  "612":"  3NVRFR[",
  "613":" 19CaGMG[ RGQJNLMOMQNRQR[ RRQUNWMZM\\N]Q][",
  "614":" 11I\\MMM[ RMQPNRMUMWNXQX[",
  "615":" 18I\\QMONMPLSLUMXOZQ[T[VZXXYUYSXPVNTMQM",
  "616":" 18H[LMLb RLPNNPMSMUNWPXSXUWXUZS[P[NZLX",
  "617":" 18I\\XMXb RXPVNTMQMONMPLSLUMXOZQ[T[VZXX",
  "618":"  9KXOMO[ ROSPPRNTMWM",
  "619":" 18J[XPWNTMQMNNMPNRPSUTWUXWXXWZT[Q[NZMX",
  "620":"  9MYRFRWSZU[W[ ROMVM",
  "621":" 11I\\MMMWNZP[S[UZXW RXMX[",
  "622":"  6JZLMR[ RXMR[",
  "623":" 12G]JMN[ RRMN[ RRMV[ RZMV[",
  "624":"  6J[MMX[ RXMM[",
  "625":" 10JZLMR[ RXMR[P_NaLbKb",
  "626":"  9J[XMM[ RMMXM RM[X[",
  "700":" 18H\\QFNGLJKOKRLWNZQ[S[VZXWYRYOXJVGSFQF",
  "701":"  5H\\NJPISFS[",
  "702":" 15H\\LKLJMHNGPFTFVGWHXJXLWNUQK[Y[",
  "703":" 16H\\MFXFRNUNWOXPYSYUXXVZS[P[MZLYKW",
  "704":"  7H\\UFKTZT RUFU[",
  "705":" 18H\\WFMFLOMNPMSMVNXPYSYUXXVZS[P[MZLYKW",
  "706":" 24H\\XIWGTFRFOGMJLOLTMXOZR[S[VZXXYUYTXQVOSNRNOOMQLT",
  "707":"  6H\\YFO[ RKFYF",
  "708":" 30H\\PFMGLILKMMONSOVPXRYTYWXYWZT[P[MZLYKWKTLRNPQOUNWMXKXIWGTFPF",
  "709":" 24H\\XMWPURRSQSNRLPKMKLLINGQFRFUGWIXMXRWWUZR[P[MZLX",
  "710":"  6MWRYQZR[SZRY",
  "711":"  9MWSZR[QZRYSZS\\R^Q_",
  "712":" 12MWRMQNROSNRM RRYQZR[SZRY",
  "713":" 15MWRMQNROSNRM RSZR[QZRYSZS\\R^Q_",
  "714":"  9MWRFRT RRYQZR[SZRY",
  "715":" 21I[LKLJMHNGPFTFVGWHXJXLWNVORQRT RRYQZR[SZRY",
  "716":"  3NVRFRM",
  "717":"  6JZNFNM RVFVM",
  "710":"  6MWRYQZR[SZRY",
};
  
let hershey_cache = {};

function compile_hershey(i){
  if (hershey_cache[i]){
    return hershey_cache[i];
  }
  var entry = hershey_raw[i];
  if (entry == null){
    return;
  }
  var ordR = 82;
  var bound= entry.substring(3,5);
  var xmin = bound.charCodeAt(0)-ordR;
  var xmax = bound.charCodeAt(1)-ordR;
  var content = entry.substring(5);
  var polylines = [[]];
  var j  = 0;
  while (j < content.length){
    var digit = content.substring(j,j+2);
    if (digit == " R"){
      polylines.push([]);
    }else{
      var x  = digit.charCodeAt(0)-ordR;
      var y  = digit.charCodeAt(1)-ordR;
      polylines[polylines.length-1].push([x,y]);
    }
    j+=2;
  }
  let data = {
    xmin:xmin,
    xmax:xmax,
    polylines:polylines,
  };
  hershey_cache[i] = data;
  return data;
}

function put_text(txt){
  let base = 500;
  let x = 0;
  let o = [];
  for (let i = 0; i < txt.length; i++){
    let ord = txt.charCodeAt(i);
    let idx;
    if (65 <= ord && ord <= 90){
      idx = base+1+(ord-65);
    }else if (97 <= ord && ord <= 122){
      idx = base + 101+(ord-97);
    }else if (ord == 46){
      idx = 710;
    }else if (ord == 32){
      x += 10;
      continue;
    }else if (48 <= ord && ord <= 57){
      idx = 700+ord-48;
    }else if (ord == 39){
      idx = 716;
    }else{
      continue;
    }
    let {xmin,xmax,polylines} = compile_hershey(idx);
    polylines = polylines.map(p=>trsl_poly(p,x-xmin,0));
    o.push(...polylines);
    x += (xmax-xmin);
  }
  return [x,o];
}


// let o = branch01(200,100,0,50).concat(branch01(200,100,PI,120));

let o = [];

mountain(100).forEach(x=>o.push(x));
mountain(90).forEach(x=>o.push(x));

jsr = 0x5EED;

// for (let i = 0; i < 5; i++){
//   tree01(100+i*100,450,-PI/2,450).forEach(x=>o.push(x));
// }



let slots = new Array(32).fill(0);
for (let i = 0; i < 16; i++){
  let sl = ~~(rand()*32);
  while (slots[sl]){
    sl = ~~(rand()*32);
  }
  slots[sl] = 1;
  tree01(sl*16,500,-PI/2+rand()*0.04-0.02,620*(rand()*0.3+0.7)).forEach(x=>o.push(x));
}

for (let i = 0; i < 1000; i++){
  grass01(rand()*512,520+rand()*30,-PI/2+rand()*0.6-0.3,20+rand()*40).forEach(x=>o.push(x))
}

deer01(100,480).forEach(x=>o.push(x));

for (let i = 0; i < 1000; i++){
  grass01(rand()*512,590+rand()*30,-PI/2+rand()*0.6-0.3,30+rand()*60).forEach(x=>o.push(x))
}
for (let i = 0; i < 500; i++){
  grass01(rand()*512,680+rand()*30,-PI/2+rand()*0.6-0.3,40+rand()*80).forEach(x=>o.push(x))
}


// for (let i = 0; i < 100; i++){
//   flower01(rand()*512,rand()*512,rand()*0.2-0.1,rand()*0.5+0.75).forEach(x=>o.push(x));
// }


for (let i = 0; i < 20; i++){
  let x = rand()*512;
  let l = rand()*80+40;
  let dy = x*0.1-50;
  for (let j = 0; j < 4; j++){
    plant01(x + (rand()*20-10),720+rand()*50-dy,-PI/2+rand()*0.4-0.2,l+rand()*40,0.7).forEach(x=>o.push(x));
  }
  for (let j = 0; j < 10; j++){
    grass02(x + (rand()*40-20),700+rand()*50-dy,-PI/2+rand()*0.6-0.3,30+rand()*50).forEach(x=>o.push(x))
  }
}
for (let i = 0; i < 20; i++){
  let x = rand()*512;
  let l = rand()*80+40;
  let dy = x*0.1-50;
  for (let j = 0; j < 4; j++){
    plant01(x + (rand()*20-10),770+rand()*50-dy,-PI/2+rand()*0.4-0.2,l+rand()*40,0.7).forEach(x=>o.push(x));
  }
  for (let j = 0; j < 10; j++){
    grass02(x + (rand()*40-20),750+rand()*50-dy,-PI/2+rand()*0.6-0.3,30+rand()*50).forEach(x=>o.push(x))
  }
}



// deer01(100,480).forEach(x=>o.push(x));

// tree01(400,500,-PI/2+rand()*0.04-0.02,500).forEach(x=>o.push(x));

// console.log(o);


for (let i = 0; i < o.length; i++){
  o[i].p = o[i].p.map(([x,y])=>[x+16,y+16]);
}
o.push({t:'c',p:[[-200,0],[16,0],[16,832],[-200,832]]});
o.push({t:'c',p:[[528,0],[744,0],[744,832],[528,832]]});
o.push({t:'c',p:[[-200,-200],[744,-200],[744,16],[-200,16]]});
o.push({t:'c',p:[[-200,784],[744,784],[744,1032],[-200,1032]]});

// o = [];

o.push({t:'l',p:[[16,16],[528,16],[528,784],[16,784],[16,16]]});


let tw,tp;

;[tw,tp] = put_text("A.P.");
tp.forEach(p=>o.push({t:'l',p:trsl_poly(scl_poly(shr_poly(p,-0.1),0.38,0.4),16,795)}));

;[tw,tp] = put_text("A VIEW ON GALIANO ISLAND");
tp.forEach(p=>o.push({t:'l',p:trsl_poly(scl_poly(shr_poly(p,-0.1),0.38,0.4),272-tw*0.38*0.5,795)}));

;[tw,tp] = put_text("LINGDONG H. '24");
tp.forEach(p=>o.push({t:'l',p:trsl_poly(scl_poly(shr_poly(p,-0.1),0.38,0.4),528-tw*0.38,795)}));


let svg = draw_svg(o,544,832,1);
// let svg = draw_svg(o,200,200,4);

const fs = require('fs');
// fs.writeFileSync("out.json",JSON.stringify(o));
fs.writeFileSync("out/raw.svg",svg);