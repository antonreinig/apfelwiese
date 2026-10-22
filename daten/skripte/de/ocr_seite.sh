#!/bin/zsh
# OCR einer einzelnen PDF-Seite. Aufruf: ocr_seite.sh <pdf> <zielordner> <sprache> <dpi> <seite>
pdf=$1; ziel=$2; lang=$3; dpi=$4; s=$5
p=$(printf "%04d" $s)
[ -s $ziel/p$p.txt ] && exit 0
pdftoppm -f $s -l $s -r $dpi -gray -png $pdf $ziel/tmp/p$p
f=$(ls $ziel/tmp/p$p*.png | head -1)
tesseract $f $ziel/p$p -l $lang --psm 4 >/dev/null 2>&1
rm -f $f
