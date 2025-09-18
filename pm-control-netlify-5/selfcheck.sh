#!/usr/bin/env bash
set -e
echo "Self-check: /hello"
curl -sS -o /dev/null -w "%{http_code}\n" http://localhost:8888/.netlify/functions/hello
echo "Self-check: GET /activities"
curl -sS -H "Accept: application/json" -o /dev/null -w "%{http_code}\n" http://localhost:8888/.netlify/functions/activities
