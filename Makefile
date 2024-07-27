dir:
	mkdir -p out
drawing: dir
	node main.js
jigsaw: dir
	node jigsaw.js
clip: dir
	g++ -std=c++11 -O3 hlr.cpp -o hlr; time ./hlr -o out/clipped.svg out/raw.svg
all: drawing jigsaw clip
