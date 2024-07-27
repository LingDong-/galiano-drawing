// g++ -std=c++11 -O3 hlr.cpp -o hlr

#define PROJ "hlr - fast hidden-(poly)line-removal for 2D (plotter) drawing"
#define AUTH "      by Lingdong Huang, based on an algorithm by Leo McElroy"
// https://github.com/hackclub/blot/blob/main/src/drawingToolkit/cutCover.js

#include <stdio.h>
#include <stdlib.h>
#include <math.h>
#include <vector>
#include <algorithm>

#define float_t float
#define SHAPE_NONE 0
#define SHAPE_LINE 1
#define SHAPE_CLIP 2

float_t epsilon = 0.001;

class V2f{public:
  float_t x;
  float_t y;
  V2f(){}
  V2f(float_t _x, float_t _y){
    x=_x;y=_y;
  }
  V2f operator*(const float f){ 
    return V2f(x*f,y*f); 
  }
  V2f operator+(const V2f& v){ 
    return V2f(x+v.x,y+v.y); 
  }
};

class Bbox{public:
  float_t xmin;
  float_t ymin;
  float_t xmax;
  float_t ymax;
};

class Shape{public:
  char type;
  Bbox bbox;
  std::vector<V2f> poly;
};



float_t is_left(const V2f& p0, const V2f& p1, const V2f& p2){
  return ( (p1.x - p0.x) * (p2.y - p0.y)
          -(p2.x - p0.x) * (p1.y - p0.y) );
}

bool pt_in_poly(const V2f& pt, const std::vector<V2f>& poly){
  float_t x = pt.x;
  float_t y = pt.y;
  int wn = 0;
  for (long i = 0, j = (long)poly.size()-1; i < poly.size(); j = i++){
    float_t xi = poly[i].x, yi = poly[i].y;
    float_t xj = poly[j].x, yj = poly[j].y;

    if (yj <= y){
      if (yi > y){
        if (is_left(V2f(xj,yj),V2f(xi,yi),pt) > 0){
          wn++;
        }
      }
    }else{
      if (yi <= y){
        if (is_left(V2f(xj,yj),V2f(xi,yi),pt) < 0){
          wn--;
        }
      }
    }
  }
  return wn != 0;
}

Bbox get_bbox(const std::vector<V2f>& pts){
  Bbox bb;
  bb.xmin = INFINITY;
  bb.ymin = INFINITY;
  bb.xmax = -INFINITY;
  bb.ymax = -INFINITY;
  for (int i = 0; i < pts.size(); i++){
    bb.xmin = fmin(bb.xmin,pts[i].x);
    bb.ymin = fmin(bb.ymin,pts[i].y);
    bb.xmax = fmax(bb.xmax,pts[i].x);
    bb.ymax = fmax(bb.ymax,pts[i].y);
  }
  return bb;
}

float_t segment_intersect(const V2f& l1p1, const V2f& l1p2, const V2f& l2p1, const V2f& l2p2) {
  float_t d =
    (l2p2.y - l2p1.y) * (l1p2.x - l1p1.x) -
    (l2p2.x - l2p1.x) * (l1p2.y - l1p1.y);
  if (d == 0) return -1;
  float_t n_a =
    (l2p2.x - l2p1.x) * (l1p1.y - l2p1.y) -
    (l2p2.y - l2p1.y) * (l1p1.x - l2p1.x);
  float_t n_b =
    (l1p2.x - l1p1.x) * (l1p1.y - l2p1.y) -
    (l1p2.y - l1p1.y) * (l1p1.x - l2p1.x);
  float_t ua = n_a / d;
  float_t ub = n_b / d;
  if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
    return ua;
  }
  return -1;
}

bool bbox_overlap(const Bbox& b0, const Bbox& b1){
  return !(b0.xmax < b1.xmin || b1.xmax < b0.xmin || b0.ymax < b1.ymin || b1.ymax < b0.ymin);
}

void add_seg(std::vector<Shape> & ndp, V2f& ls0, V2f& ls1){
  if (!ndp.size()){
    Shape s;
    s.type = SHAPE_LINE;
    ndp.push_back(s);
  }
  if (!ndp.back().poly.size()){
    ndp.back().poly.push_back(ls0);
    ndp.back().poly.push_back(ls1);
    return;
  }
  if (ndp.back().poly.back().x == ls0.x && ndp.back().poly.back().y == ls0.y){
    ndp.back().poly.push_back(ls1);
  }else{
    Shape s;
    s.type = SHAPE_LINE;
    ndp.push_back(s);
    ndp.back().poly.push_back(ls0);
    ndp.back().poly.push_back(ls1);
  }
}

void clip_one(const std::vector<V2f>& polyline, const std::vector<V2f>& polygon, std::vector< Shape >& ndp){
  
  ndp.reserve(ndp.size()+polyline.size());

  int idx0 = ndp.size();
  
  for (long i = 0; i < (long)polyline.size()-1; i++){
    
    V2f ls0 = polyline[i];
    V2f ls1 = polyline[i+1];
    std::vector<float> isx;
    
    for (int j = 0; j < polygon.size(); j++){
      
      float_t ret = segment_intersect(ls0,ls1,polygon[j],polygon[(j+1)%polygon.size()]);
      if (ret>=0){
        isx.push_back(ret);
      }
    };
    

    if (!isx.size()){
      
      if (!pt_in_poly(ls0,polygon)){
        add_seg(ndp,ls0,ls1);
      }
      
    }else{
      
      isx.push_back(0);
      isx.push_back(1);
      
      std::sort(isx.begin(),isx.end(),std::less<float_t>());
      // for (int k = 0; k < isx.size(); k++){
      //   printf("%f ",(float)isx[k]);
      // }
      // printf("\n");
      
      float dx = ls1.x-ls0.x;
      float dy = ls1.y-ls0.y;
      float td = dx*dx+dy*dy;
      for (long k = 0; k < (long)isx.size()-1; k++){
        float_t t0 = isx[k];
        float_t t1 = isx[k+1];
        V2f x0 = ls0*(1-t0)+ls1*(t0);
        V2f x1 = ls0*(1-t1)+ls1*(t1);
        float ds = (t1-t0)*td;
        if (ds >= epsilon){
          if (!pt_in_poly((x0+x1)*0.5,polygon)){
            add_seg(ndp,x0,x1);
          }
        }
      }
    }
  }
  
  for (int i = idx0; i < ndp.size(); i++){
    ndp[i].bbox = get_bbox(ndp[i].poly);
  }
  
}



std::vector<Shape > clip(const std::vector<Shape> & shapes){
  std::vector<Shape > out;
  out.reserve(shapes.size());
  
  for (int i = 0; i < shapes.size(); i++){
    if (i % 1000 == 0){
      fprintf(stderr,"\33[2K\r[");
      int pct = 20*(float)i/(float)shapes.size();
      for (int i = 0; i < 20; i++){
        fprintf(stderr,i<=pct?"#":"-");
      }
      fprintf(stderr,"] clipping %d/%lu...",i,shapes.size());
      fflush(stderr);
      out.erase(
        std::remove_if(out.begin(), out.end(), [](Shape& s) { return s.type==SHAPE_NONE; }), 
        out.end()
      );
    }
    if (shapes[i].type == SHAPE_LINE){
      out.push_back(shapes[i]);

    }else if (shapes[i].type == SHAPE_CLIP){
      
      int n = out.size();
      for (int j = 0; j < n; j++){
        if (out[j].type != SHAPE_LINE) continue;
        if (bbox_overlap(out[j].bbox, shapes[i].bbox)){
          out[j].type = SHAPE_NONE;
          clip_one(out[j].poly, shapes[i].poly, out);
        }
      }
    }
  }
  return out;
}



V2f parse(FILE* fd, std::vector<Shape>& shapes) {
  V2f wh(300,150);
  int c=0,d;
  while (1){
    c = fgetc(fd);
    if (c == EOF) break;
    if (c == 'M'){
      Shape s;
      s.type = SHAPE_LINE;
      while (1){
        d = fgetc(fd);
        if (d == 'z'){
          s.type = SHAPE_CLIP;
          break;
        }else if (d == '\n' || d == EOF){
          break;
        }else if (d == ' '){
          continue;
        }else{
          ungetc(d,fd);
        }
        float x,y;
        fscanf(fd,"%f,%f",&x,&y);
        s.poly.push_back(V2f(x,y));
      }
      s.bbox = get_bbox(s.poly);
      shapes.push_back(s);
    }else{
      if (c == 'w'){
        float x,y;
        fscanf(fd,"idth=\"%f\" height=\"%f\"",&x,&y);
        wh.x = x, wh.y = y;
      }
      while (c != '\n' && c != EOF){
        c = fgetc(fd);
      }
    }
  }
  // for (int i = 0; i < shapes.size(); i++){
  //   printf("%d|",shapes[i].type);
  //   for (int j = 0; j < shapes[i].poly.size(); j++){
  //     printf("%f,%f ",shapes[i].poly[j].x,shapes[i].poly[j].y);
  //   }
  //   printf("\n\n");
  // }
  return wh;
}


void draw_svg(FILE* fd, std::vector<Shape > & polys,int w,int h){
  fprintf(fd,"<svg xmlns=\"http://www.w3.org/2000/svg\"\nwidth=\"%d\" height=\"%d\"\n>",w,h);
  fprintf(fd,"<rect x=\"0\" y=\"0\" width=\"%d\" height=\"%d\" fill=\"white\"/>",w,h);
  for (int i = 0; i < polys.size(); i++){
    if (polys[i].type != SHAPE_LINE) continue;
    fprintf(fd,"<path stroke=\"black\" stroke-width=\"0.5\" fill=\"none\" stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"\nM");
    for (int j = 0; j < polys[i].poly.size(); j++){
      float x = polys[i].poly[j].x;
      float y = polys[i].poly[j].y;
      fprintf(fd,"%03f,%03f ",x,y);
    }
    fprintf(fd,"\n\"/>");
  }
  fprintf(fd,"</svg>");
}

void print_help(){
  printf("\n" PROJ "\n");
  printf(AUTH "\n\n");
  printf("usage:\n");
  printf("  hlr [options] path/to/input\n\n");
  printf("options:\n");
  printf("  -o path/to/output\n\n");
  printf("file format:\n");
  printf("  hlr reads (and writes) a simple text-based format. Each line\n");
  printf("  denotes either a polyline to be clipped, or a polygon to clip\n");
  printf("  (occlude/obscure) all the polylines that came before it.\n");
  printf("  Both shapes must start the line with the character 'M',\n");
  printf("  followed by pairs of x,y coordinates, separated by spaces.\n");
  printf("  Clipper polygons are differentiated from clippee polylines\n");
  printf("  by endding the line with the character 'z'.\n");
  printf("  e.g. M10,20 30,40 50,60z\n");
  printf("  A special line, width=\"%%d\" height=\"%%d\" can be used to denote\n");
  printf("  the width and height of the document.\n");
  printf("  All other lines are ignored. Lines are delimited by 0xA.\n");
  printf("  The format is a subset of SVG, and can be written in a\n");
  printf("  compatible way that allows its viewing as a .svg image.\n\n");
}

int main(int argc, char** argv){
  char* inp_pth = NULL;
  char* out_pth = NULL;

  for (int i = 1; i < argc; i++){
    if (strcmp(argv[i],"-o")==0){
      out_pth = argv[++i];
    }else if (strcmp(argv[i],"-h")==0){
      print_help();
      return 0;
    }else{
      inp_pth = argv[i];
    }
  }
  if (argc <= 1){
    print_help();
    return 0;
  }
  fprintf(stderr,"reading %s...\n",inp_pth);

  std::vector<Shape> shapes;
  FILE* fd = fopen(inp_pth,"r");
  V2f wh = parse(fd,shapes);
  fprintf(stderr,"size %fx%f, %lu shapes.\n",(float)wh.x,(float)wh.y,shapes.size());
  std::vector<Shape> polys = clip(shapes);

  FILE* fp = (out_pth)?fopen(out_pth,"w"):stdout;
  draw_svg(fp,polys,wh.x,wh.y);

  fprintf(stderr,"\nwritten.\n");
}


