#!/usr/bin/env bash
# Pack the route engine into the guides repo (vendor/route-engine.tgz), so the
# guides CI can validate routes without access to this repository.
set -euo pipefail
here=$(cd "$(dirname "$0")/.." && pwd)
guides="${1:-$here/../exile-overlay-guides}"
mkdir -p "$guides/vendor"
cd "$here/packages/route-engine"
file=$(npm pack --silent --pack-destination "$guides/vendor")
mv "$guides/vendor/$file" "$guides/vendor/route-engine.tgz"
echo "packed $file -> $guides/vendor/route-engine.tgz"
# npm keeps the old copy when the version number is unchanged: force a reinstall.
(cd "$guides" && rm -rf node_modules/@exile-overlay && npm install --no-audit --no-fund ./vendor/route-engine.tgz >/dev/null)
echo "reinstalled in $guides"
