# CLAUDE.md — 콘자(고위드153) AI 자동화 워크스페이스 작업 지침

## 1. 핵심 원칙
- **반복은 코드로, 판단만 AI로**: 크롤링·정렬·파일 변환·업로드 같은 정형 반복 작업은 Node.js/Python 스크립트로 분리하고, 대본·답글·기획 등 맥락 판단이 필요한 단계에만 LLM을 호출한다.
- **불변/가변 분리**: 브랜드 정체성·말투(`brand/AGENTS.md`)는 로컬 정본을 참조하고, 실시간 가격·재고·일정은 DB(Cloudflare D1 / Supabase)에서 조회한다.
- **자가 개선 루프**: 모든 작업 결과와 사용자 피드백(O/X 및 수정 사유)은 `agent_learning.feedback_logs` 및 `agent_learning.document_embeddings`에 기록하며, 비교 실험을 통과한 규칙만 정식 승격한다.
