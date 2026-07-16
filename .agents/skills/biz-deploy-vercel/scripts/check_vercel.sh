#!/usr/bin/env bash
# Preflight check for Vercel CLI deployment.
# Exits 0 if ready to deploy. Exits non-zero with structured stdout if action needed.
# Output is JSON-ish lines for Claude to parse:
#   STATUS=<ok|need_node|need_cli|need_auth>
#   NODE_VERSION=<version or empty>
#   VERCEL_VERSION=<version or empty>
#   VERCEL_USER=<username or empty>
#   PACKAGE_MANAGER=<pnpm|yarn|npm>

set -u

# Detect preferred package manager (for install instructions)
if command -v pnpm >/dev/null 2>&1; then
  PKG_MGR="pnpm"
elif command -v yarn >/dev/null 2>&1; then
  PKG_MGR="yarn"
elif command -v npm >/dev/null 2>&1; then
  PKG_MGR="npm"
else
  PKG_MGR="none"
fi
echo "PACKAGE_MANAGER=${PKG_MGR}"

# 1. Node.js
if ! command -v node >/dev/null 2>&1; then
  echo "NODE_VERSION="
  echo "STATUS=need_node"
  echo "MESSAGE=Node.js not installed. Install from https://nodejs.org or via brew/nvm."
  exit 2
fi
NODE_VER=$(node --version 2>/dev/null)
echo "NODE_VERSION=${NODE_VER}"

# 2. Vercel CLI
if ! command -v vercel >/dev/null 2>&1; then
  echo "VERCEL_VERSION="
  echo "STATUS=need_cli"
  case "${PKG_MGR}" in
    pnpm) echo "MESSAGE=Vercel CLI not installed. Run: pnpm add -g vercel" ;;
    yarn) echo "MESSAGE=Vercel CLI not installed. Run: yarn global add vercel" ;;
    npm)  echo "MESSAGE=Vercel CLI not installed. Run: npm install -g vercel" ;;
    *)    echo "MESSAGE=Vercel CLI not installed. Install a package manager first." ;;
  esac
  exit 3
fi
VERCEL_VER=$(vercel --version 2>/dev/null | head -1)
echo "VERCEL_VERSION=${VERCEL_VER}"

# 3. Auth — filter out plugin hints (e.g. `<claude-code-hint ... />`) and blanks
WHOAMI_RAW=$(vercel whoami 2>&1)
if echo "${WHOAMI_RAW}" | grep -qiE "(error|not authenticated|log in)"; then
  echo "VERCEL_USER="
  echo "STATUS=need_auth"
  echo "MESSAGE=Not logged in. Run: vercel login (will open browser)."
  exit 4
fi
# Pick last non-empty line that doesn't look like an XML/hint annotation
WHOAMI=$(echo "${WHOAMI_RAW}" | grep -vE '^[[:space:]]*$|<[^>]+/?>' | tail -1)
echo "VERCEL_USER=${WHOAMI}"
echo "STATUS=ok"
echo "MESSAGE=Vercel CLI ready to deploy."
exit 0
