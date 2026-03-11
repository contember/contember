#!/bin/bash
set -e

REPO="contember/contember"
WORKFLOW="publish.yaml"

for dir in packages/*; do
  if [ -f "$dir/package.json" ]; then
    if ! grep -q '"private": true' "$dir/package.json"; then
      name=$(node -e "console.log(require('./$dir/package.json').name)")

      # Revoke existing trust if any
      trust_id=$(npm trust list "$name" --json 2>/dev/null | node -e "
        let d=''; process.stdin.on('data',c=>d+=c); process.stdin.on('end',()=>{
          try { const t=JSON.parse(d); if(Array.isArray(t)&&t[0]) console.log(t[0].id); else if(t.id) console.log(t.id); } catch(e){}
        })
      ")
      if [ -n "$trust_id" ]; then
        echo "Revoking old trust for $name (id: $trust_id)..."
        npm trust revoke "$name" --id="$trust_id" --yes
      fi

      echo "Setting trusted publisher for $name..."
      npm trust github "$name" --file="$WORKFLOW" --repository="$REPO" --yes
    fi
  fi
done
