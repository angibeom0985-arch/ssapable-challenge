# 55강 챌린지 — 서버에 24시간 무인 Goal Runner 세팅

## 수행 내역
- VPS 서버(`conja-agent-vps-01`)에 `goal-runner.service` (systemd 데몬) 등록 및 30분 주기 실행·실패 시 자동 재시작(`Restart=on-failure`) 구성 완료
- 일일 실행 한도, API 비용 상한, 텔레그램 승인 대시보드 웹훅 연동 완료
