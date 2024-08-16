#!/bin/sh
PORT=7890
screen -dmS 'My Page'
screen -S 'My Page' -X stuff 'bun run build; PORT=$PORT bun run serve\n'
echo "server running on port $PORT"