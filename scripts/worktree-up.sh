#!/usr/bin/env bash
# 지금 worktree에 전용 포트와 DB 스키마를 할당하고 개발 서버를 띄운다.
#
# 왜 필요한가: 포트와 DB 스키마가 고정이면 worktree를 두 개 띄울 수 없다.
# 그러면 "main에서 직접 작업하지 않는다"는 규칙이 실질적으로 안 지켜진다.
# 작업을 병렬로 굴리려면 서로 간섭하지 않는 실행 환경이 먼저 있어야 한다.
#
# 사용법:
#   scripts/worktree-up.sh              설정하고 개발 서버까지 띄운다
#   scripts/worktree-up.sh --setup-only 설정만 하고 끝낸다
#
# 새 worktree를 만들려면 먼저:
#   git worktree add ../stin-<브랜치> -b feat/<브랜치>
#   cd ../stin-<브랜치> && scripts/worktree-up.sh

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

ENV_FILE="apps/api/.env"
MARKER="# generated-by: scripts/worktree-up.sh"

BRANCH="$(git rev-parse --abbrev-ref HEAD)"
IS_MAIN_WORKTREE=$([ "$(git rev-parse --git-dir)" = "$(git rev-parse --git-common-dir)" ] && echo yes || echo no)

# Postgres 스키마 이름으로 쓸 수 있게 다듬는다 (소문자·영숫자·밑줄).
SLUG="$(printf '%s' "$BRANCH" | tr '[:upper:]/.-' '[:lower:]___' | tr -cd 'a-z0-9_' | cut -c1-40)"

if [ "$IS_MAIN_WORKTREE" = "yes" ] && [ "$BRANCH" = "main" ]; then
  SCHEMA="public"
  WEB_PORT=3000
  API_PORT=3001
else
  SCHEMA="wt_${SLUG}"
  # 브랜치 이름에서 결정적으로 포트를 뽑는다. 같은 브랜치는 항상 같은 포트를 받는다.
  OFFSET=$(( $(printf '%s' "$SLUG" | cksum | cut -d' ' -f1) % 40 ))
  WEB_PORT=$(( 3100 + OFFSET * 2 ))
  API_PORT=$(( 3101 + OFFSET * 2 ))
fi

DB_URL="postgresql://stin:stin_dev_password@localhost:5432/stin?schema=${SCHEMA}"

echo "── worktree 설정"
echo "   브랜치   $BRANCH"
echo "   스키마   $SCHEMA"
echo "   포트     web $WEB_PORT · api $API_PORT"
echo "   로그     $ROOT/.logs/api.jsonl"
echo ""

# 남의 .env를 말없이 덮어쓰지 않는다.
if [ -f "$ENV_FILE" ] && ! grep -q "$MARKER" "$ENV_FILE"; then
  echo "✗ $ENV_FILE 가 이미 있고 이 스크립트가 만든 것이 아닙니다."
  echo "  → 덮어쓰지 않았습니다. 직접 관리하는 파일이라면 아래 값을 반영하세요:"
  echo ""
  echo "      DATABASE_URL=\"$DB_URL\""
  echo "      API_PORT=$API_PORT"
  echo ""
  echo "  → 이 스크립트가 관리하게 하려면 파일을 지우고 다시 실행하세요."
  exit 1
fi

cat > "$ENV_FILE" <<EOF
$MARKER
# 브랜치 '$BRANCH' 전용 설정. 다시 만들려면: scripts/worktree-up.sh --setup-only

DATABASE_URL="$DB_URL"
API_PORT=$API_PORT

JWT_SECRET="change-me-in-local-env"
JWT_EXPIRES_IN="7d"

LOG_LEVEL=
LOG_FILE=
EOF

echo "── 의존성 설치"
pnpm install --silent

echo "── DB 스키마 '$SCHEMA' 마이그레이션"
if ! pnpm --filter api exec prisma migrate deploy; then
  echo ""
  echo "✗ 마이그레이션에 실패했습니다."
  echo "  → PostgreSQL이 떠 있는지 확인하세요: docker compose up -d"
  echo "  → 그래도 안 되면 apps/api/.env의 DATABASE_URL을 확인하세요."
  exit 1
fi

if [ "${1:-}" = "--setup-only" ]; then
  echo ""
  echo "✓ 설정 완료. 서버를 띄우려면:"
  echo "    WEB_PORT=$WEB_PORT pnpm dev"
  exit 0
fi

echo ""
echo "✓ http://localhost:$WEB_PORT (web) · http://localhost:$API_PORT (api)"
echo ""
export WEB_PORT API_PORT
exec pnpm dev
