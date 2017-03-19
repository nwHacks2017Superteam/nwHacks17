\| IFS=","; while read a b c; do echo "INSERT INTO csv VALUES ($a, $b, $c);"; done < data_smaller.csv;
