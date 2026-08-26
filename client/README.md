# NINEWORKS Client Dashboard

클라이언트별 전용 프로젝트 대시보드는 `/client/{slug}/` 구조로 운영합니다.

## 기본 구성

각 클라이언트 폴더는 아래 문서를 기본으로 가집니다.

- `index.html` : 프로젝트 진행 현황 대시보드
- `contract.html` : 계약서 확인 페이지
- `quote.html` : 견적서 확인 페이지

필요 시 아래 문서를 추가합니다.

- `proposal.html` : 제안서
- `schedule.html` : 일정표
- `deliverables.html` : 납품 산출물
- `files/` : 공개 가능한 프로젝트 문서/PDF

## Registry

전체 클라이언트 기본 정보는 `/client/clients.json`에서 관리합니다.

필수 정보:

- id / slug
- clientName / clientNameEn
- brandName
- projectName
- businessType
- contractStart / contractEnd
- maintenanceStart / maintenanceEnd
- status
- dashboardPath
- documents

## 운영 원칙

1. 클라이언트에게는 자기 프로젝트 경로만 공유합니다.
2. 모든 클라이언트 페이지는 검색엔진에 노출되지 않도록 `noindex,nofollow`를 유지합니다.
3. 계약서·견적서·제안서는 대시보드에서 각각 별도 페이지로 연결합니다.
4. 진행 상태는 `preparing → planning → design → delivery → maintenance → completed` 순서로 관리합니다.
5. 민감한 계약 문서의 실제 공개 전에는 인증 또는 별도 접근 제어를 적용합니다.

## 최초 적용 클라이언트

- `/client/phyto/`
- 파이토레볼루션 / 브랜드 고스란
- 계약기간: 2026-08-27 ~ 2026-10-27
- 유지보수: 2026-10-28 ~ 2026-12-27
- 정부지원사업
