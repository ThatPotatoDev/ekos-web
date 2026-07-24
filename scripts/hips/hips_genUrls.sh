#!/bin/bash

# SCRIPT MUST BE RUN WITH THIS DIR AS THE WORKING DIR

ORDER=${1:-6}
MAX=$((12 * (4 ** ORDER) - 1))

HOST="https://cdn.skies.esac.esa.int/DSSColor"

> urls-Norder${ORDER}.txt

for n in $(seq 0 $MAX); do
    dir=$(( (n / 10000) * 10000 ))

    echo "$HOST/Norder$ORDER/Dir$dir/Npix$n.jpg" >> urls-Norder${ORDER}.txt
    echo " dir=../../server/static/stellarium-data/dssGen/surveys/dss/Norder$ORDER/Dir$dir" >> urls-Norder${ORDER}.txt
    echo " out=Npix$n.jpg" >> urls-Norder${ORDER}.txt
    echo >> urls-Norder${ORDER}.txt
done

echo "Generated urls-Norder${ORDER}.txt for Norder${ORDER}: $((MAX+1)) tiles"