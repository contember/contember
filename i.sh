for d in packages/*/
do
     (cd "$d" && npm install)
done
