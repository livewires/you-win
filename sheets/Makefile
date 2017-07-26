
# %.pdf: %.html
# 	../node_modules/.bin/chrome-headless-render-pdf --url "file://$(shell pwd)/$<" --pdf $@

%.html: %.md _pandoc.css
	pandoc -f markdown -t html --css _pandoc.css $< -o $@

all:  \
	1-Numbers.pdf \
	2-Animation.pdf \
	3-Arrays.pdf \
	4-Functions.pdf \
	Reference.pdf

.PHONY: all

