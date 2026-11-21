# 37강 챌린지 — Meta 앱 생성, Threads API 권한 추가 및 자연어 명령 자동 발행

## 수행 내역
1. Meta for Developers에서 앱 생성 후 `threads_basic`, `threads_content_publish`, `threads_manage_replies` 권한 추가 및 테스터 토큰 발급 완료
2. 에이전트에 Threads API / MCP 도구를 연결하고 자연어 명령("오늘 바이브코딩 핵심 팁으로 쓰레드 초안 만들고 검증 후 발행해줘")으로 작업 수행
- **연동 확인 캡처**: `37강_쓰레드_자동발행_화면.png`

---

## 정식 1기 v2 개선 사항 (2026-11-22)
- **리브랜딩 반영**: 활동명 **데이비**(`@david153.official`) 및 콘텐츠 자동화 포지셔닝 기준으로 문서·링크·운영 기준을 일원화했습니다.
- **핵심 개선 내역**: Threads API 자연어 발행 흐름을 `@david153.official` 브랜드 가이드와 연결하고, 발행 전 인간화 필터(`/ig-human`) 및 금지어 검사를 거치도록 파이프라인을 개선했습니다.
