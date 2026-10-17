# 40강 챌린지 — 브랜드 프로젝트 작업별 디렉터리 구조 및 `AGENTS.md` 안내 문구


# AGENTS.md — 콘자(고위드153) 통합 에이전트 디렉터리 및 운영 규칙

## 프로젝트별 디렉터리 위치 안내

- **브랜드 정체성·말투·금지어 정본**: `brand/AGENTS.md`에서 관리하며, 모든 채널 원고·답글·상세페이지 생성 시 최우선으로 참조합니다.
- **판매 사이트 및 관리자·백업(`conja-starter`)**: 웹 화면·결제·자료실 코드는 `site/` (`https://conja-starter.pages.dev`), DB 백업 및 매출 리포트는 `backups/`와 `/admin`에서 관리합니다.
- **유튜브·쇼츠 자동화(`youtube-shorts`)**: 소재 발굴·대본·TTS·FFmpeg 렌더링 스킬은 `skills/youtube-shorts/SKILL.md`를 따르며, 산출물은 `assets/`에 보관합니다.
- **모바일·웹 동선 자동화(`mobile-app-flow`)**: 화면 탐색 및 반복 동선 스킬은 `skills/mobile-app-flow/SKILL.md`에서 관리합니다.
- **일일 브리핑 및 자율 개선 루틴(`jarvis & goal-runner`)**: 실행 결과 및 검증 보고서는 `WORK_REPORT.md`에 기록하고, 피드백 벡터 데이터는 `agent_learning.document_embeddings` 테이블을 정본으로 사용합니다.
