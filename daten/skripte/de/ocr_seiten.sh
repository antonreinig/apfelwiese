#!/bin/zsh
# OCR einer PDF-Datei Seite für Seite, 6 Prozesse parallel.
# Aufruf: ocr_seiten.sh <pdf> <zielordner> <sprache> <erste> <letzte> [dpi]
pdf=$1; ziel=$2; lang=$3; a=$4; b=$5; dpi=${6:-300}
mkdir -p $ziel/tmp
seq $a $b | xargs -P 6 -n 1 $(dirname $0)/ocr_seite.sh $pdf $ziel $lang $dpi
echo fertig
