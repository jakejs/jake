#!/bin/sh
if [ -x "`dirname "$0"`/node.exe" ]; then
  "`dirname "$0"`/node.exe" "`dirname "$0"`/node_modules/jake/bin/cli.js" "$@"
else
  node "`dirname "$0"`/node_modules/jake/bin/cli.js" "$@"
fi
