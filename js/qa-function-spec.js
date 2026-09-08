(() => {
  'use strict';

  const RELIM_TEMPLATE = "# RELIM Website\n\n## Product Requirements Document + Functional Specification\n\n**문서명** RELIM 웹사이트 PRD + 기능명세서\n**버전** v1.0\n**기준일** 2026.08.21\n**브랜드명** RELIM\n**도메인** re-lim.com\n**Repository** `relim_site.git`\n**문서 목적** RELIM 웹사이트의 기획·개발·운영·유지보수 기준을 하나의 문서로 통합한다.\n\n---\n\n# 1. 프로젝트 개요\n\n## 1.1 프로젝트 정의\n\nRELIM은 수영, 쉘터, 바비큐, 카페 및 조건부 숙박을 결합한 **시간제 복합 휴식 공간**이다.\n\n웹사이트는 단순한 브랜드 소개 사이트가 아니라 다음 역할을 수행한다.\n\n- RELIM 브랜드 및 공간 소개\n- 시설 및 공간 구조 안내\n- 이용시간 및 요금 안내\n- 이용규정 전달\n- 예약 전환\n- 쉘터 위치 안내\n- 갤러리 제공\n- FAQ 및 고객 문의\n- 리뷰 및 Q&A\n- 방문자 및 고객 데이터 관리\n- 운영자를 위한 관리자 시스템\n\n---\n\n# 2. 프로젝트 목표\n\n## 2.1 핵심 목표\n\n방문자가 RELIM을 처음 접했을 때 다음 내용을 빠르게 이해할 수 있어야 한다.\n\n1. RELIM이 어떤 공간인지\n2. 어떤 시설을 이용할 수 있는지\n3. 언제 이용할 수 있는지\n4. 얼마인지\n5. 어떤 준비물이 필요한지\n6. 숙박 이용 조건은 무엇인지\n7. 어떻게 예약하는지\n\n---\n\n## 2.2 비즈니스 목표\n\n- 예약 전환율 향상\n- 반복 문의 감소\n- 이용규정 사전 전달\n- 고객의 공간 이해도 향상\n- 브랜드 신뢰도 강화\n- 검색엔진 노출 강화\n- 모바일 이용 편의성 향상\n- 운영자 업무 효율화\n\n---\n\n# 3. 서비스 정의\n\nRELIM의 핵심 서비스는 다음과 같다.\n\n### Pool\n\n수영 및 물놀이 공간\n\n### Shelter\n\n개별 이용 공간\n\n### BBQ\n\n바비큐 이용\n\n### Cafe\n\n카페 이용\n\n### Stay\n\n조건부 숙박\n\n단, **숙박은 RELIM의 독립적인 예약 상품이 아니다.**\n\n숙박은 오후 타임 예약 확정 고객에게만 추가적으로 제공될 수 있으며 숙박만 별도로 예약할 수 없다.\n\n---\n\n# 4. 브랜드 표기 규칙\n\n모든 페이지, 관리자, SEO, 코드 및 문서에서 브랜드명을 다음과 같이 사용한다.\n\n**RELIM**\n\n사용하지 않는 표기:\n\n- RE\\:LIM\n- RE LIM\n- Re\\:Lim\n- Relim\n\n사이트 UI 내 영문 브랜드 표기는 원칙적으로 `RELIM`으로 통일한다.\n\n---\n\n# 5. 핵심 사용자\n\n## 5.1 Visitor\n\n일반 방문자 및 예약 고객\n\n주요 행동:\n\n- 브랜드 탐색\n- 공간 확인\n- 이용요금 확인\n- 이용시간 확인\n- 쉘터 위치 확인\n- 이용규정 확인\n- 갤러리 확인\n- FAQ 확인\n- 예약 진행\n- 문의 작성\n- 리뷰 확인\n\n---\n\n# 5.2 Admin\n\nRELIM 운영자\n\n주요 행동:\n\n- 문의 확인\n- 문의 상태관리\n- 리뷰 관리\n- Q&A 관리\n- 회원/가입자 확인\n- 방문자 통계 확인\n- 콘텐츠 관리\n- 삭제 데이터 복원\n- 필요 시 예약정보 확인\n\n---\n\n# 6. 운영 정책\n\n## 6.1 이용시간\n\n### 오전 타임\n\n**10:00 \\~ 15:00**\n\n### 오후 타임\n\n**16:00 \\~ 21:00**\n\n---\n\n## 6.2 라스트오더\n\n오전 타임:\n\n**15:00**\n\n오후 타임:\n\n**20:00**\n\n---\n\n# 7. 이용요금\n\n## 7.1 쉘터 기본요금\n\n**150,000원**\n\n---\n\n## 7.2 인원\n\n최대 이용 가능 인원:\n\n**10명**\n\n### 36개월 이상\n\n1인당:\n\n**25,000원**\n\n### 36개월 미만\n\n**무료**\n\n---\n\n# 8. 숙박 정책\n\n숙박은 RELIM의 독립적인 예약 상품으로 취급하지 않는다.\n\n숙박 가능 조건:\n\n- 오후 타임 예약 고객\n- 예약 확정 고객\n- 운영 정책에 따른 숙박 이용 가능 고객\n\n숙박 단독 예약:\n\n**불가**\n\n사이트에서 반드시 다음 의미가 전달되어야 한다.\n\n> 숙박은 오후 타임 예약 확정 고객에 한해 추가 이용이 가능하며, 숙박만 별도로 예약할 수 없습니다.\n\n---\n\n# 9. 필수 준비물 및 이용규정\n\n예약 전 이용자에게 다음 내용을 명확하게 안내한다.\n\n- 아쿠아슈즈 필수\n- 개인 세면도구 지참\n- 개인 수건 지참\n- 외부 음식 반입 제한\n- 외부 주류 반입 제한\n- 최대 이용 가능 인원 10명\n- 이용시간 준수\n- 숙박 단독 예약 불가\n\n---\n\n# 10. 취소 및 환불\n\n기본 원칙:\n\n**이용일 8일 전까지 취소 시 100% 환불**\n\n이후 환불률은 이용일과 가까워질수록 단계적으로 감소한다.\n\n정확한 단계별 환불 비율은 운영 정책 확정값을 기준으로 적용한다.\n\n### 개발 원칙\n\n환불 정책은 여러 위치에 하드코딩하지 않는다.\n\n가능하면 하나의 정책 데이터 기준으로 다음 영역에서 동일한 값이 노출되도록 한다.\n\n- 이용안내\n- 예약\n- FAQ\n- 관리자\n- 예약 완료 안내\n\n---\n\n# 11. 사이트 정보구조\n\n| 1Depth2Depth목적 |             |                |\n| -------------- | ----------- | -------------- |\n| Home           | -           | 핵심정보 및 예약 전환   |\n| About          | -           | 브랜드 소개         |\n| Space          | -           | 공간 및 쉘터 안내     |\n| Guide          | -           | 이용방법 / 요금 / 규정 |\n| Reservation    | -           | 예약             |\n| Gallery        | -           | 실제 공간 사진       |\n| FAQ            | -           | 자주 묻는 질문       |\n| Location       | -           | 위치 및 오시는 길     |\n| Admin          | Dashboard   | 관리자 홈          |\n| Admin          | Reservation | 예약 관리          |\n| Admin          | Inquiry     | 문의 관리          |\n| Admin          | Review      | 리뷰 관리          |\n| Admin          | Q&A         | Q&A 관리         |\n| Admin          | Member      | 가입자 관리         |\n| Admin          | Analytics   | 방문자 통계         |\n| Admin          | Trash       | 삭제 데이터 관리      |\n\n---\n\n# 12. 핵심 사용자 흐름\n\n## 12.1 기본 이용 흐름\n\n```text\nHOME\n↓\n공간 확인\n↓\n이용시간 / 요금 확인\n↓\n이용규정 확인\n↓\nRESERVATION\n↓\n날짜 선택\n↓\n오전 / 오후 선택\n↓\n쉘터 선택\n↓\n인원 선택\n↓\n요금 확인\n↓\n예약자 정보 입력\n↓\n약관 동의\n↓\n예약 완료\n\n```\n\n---\n\n# 12.2 숙박 이용 흐름\n\n```text\nRESERVATION\n↓\n오후 타임 선택\n↓\n숙박 이용 조건 확인\n↓\n숙박 관련 안내 노출\n↓\n예약 진행\n\n```\n\n오전 타임에서는 숙박 옵션을 노출하지 않는다.\n\n---\n\n# 13. HOME\n\n## HOME-001 Hero\n\n### 목적\n\nRELIM의 분위기와 브랜드 이미지를 첫 화면에서 전달한다.\n\n### 구성\n\n- Main Visual\n- Main Copy\n- Supporting Text\n- Reservation CTA\n\n### 기능\n\n- 이미지 또는 영상 대응\n- Desktop / Mobile 대응\n- CTA 클릭 시 예약 화면 이동\n- 영상 로딩 실패 시 이미지 fallback 가능\n\n---\n\n# 13.2 HOME-002 Brand Introduction\n\nRELIM을 간결하게 설명한다.\n\n텍스트를 과도하게 사용하지 않고 이미지 중심으로 구성한다.\n\n---\n\n# 13.3 HOME-003 Space Preview\n\n주요 시설을 소개한다.\n\n- Pool\n- Shelter\n- BBQ\n- Cafe\n- Stay\n\n---\n\n# 13.4 HOME-004 Time Information\n\n오전과 오후 운영시간을 한눈에 확인할 수 있도록 한다.\n\n---\n\n# 13.5 HOME-005 Guide Summary\n\n예약 전에 중요한 정보만 요약한다.\n\n예:\n\n- 최대 10인\n- 아쿠아슈즈 필수\n- 수건 지참\n- 숙박 단독 예약 불가\n\n---\n\n# 13.6 HOME-006 Reservation CTA\n\n페이지 중간 및 하단에 예약 CTA를 제공한다.\n\n---\n\n# 14. ABOUT\n\n## ABOUT-001 Brand Story\n\nRELIM의 공간 철학과 브랜드 방향을 전달한다.\n\n---\n\n# 14.2 ABOUT-002 Brand Concept\n\n브랜드 핵심 키워드 중 하나로 다음 개념을 활용할 수 있다.\n\n**re\\:forest**\n\n의미:\n\n**다시 숲으로**\n\n브랜드 스토리 문구는 과도한 마케팅 표현보다 공간과 경험을 중심으로 작성한다.\n\n---\n\n# 14.3 ABOUT-003 Space Philosophy\n\nRELIM을 단순한 수영장이나 숙박업소로 설명하지 않는다.\n\n다음 경험을 연결하는 공간으로 설명한다.\n\n- Swim\n- Rest\n- Eat\n- Connect\n- Stay\n\n---\n\n# 15. SPACE\n\n## SPACE-001 Space Overview\n\nRELIM 전체 공간 구조를 시각적으로 안내한다.\n\n---\n\n# 15.2 SPACE-002 Shelter Map\n\n쉘터:\n\n**1 \\~ 24**\n\n### 지도 기준\n\n- 쉘터 번호 1\\~24 표시\n- 번호는 반시계 방향\n- 22번 영역 이후 1번 방향 연결 관계 명확화\n- 화장실 영역 가독성 강화\n- 불필요한 연두색 영역 제거\n- 하늘색 표현 유지\n- 불필요한 선 제거\n- 필요한 경계선만 유지\n\n---\n\n# 15.3 SPACE-003 Shelter Interaction\n\n### Desktop\n\n- Hover\n- Click\n\n### Mobile\n\n- Tap\n\n클릭 또는 터치 시 쉘터 정보를 표시한다.\n\n### 표시 정보\n\n- 쉘터 번호\n- 위치\n- 이미지\n- 특징\n- 예약 CTA\n\n---\n\n# 15.4 SPACE-004 Space Popup\n\nPopup 또는 Modal 형태로 노출한다.\n\n요구사항:\n\n- 닫기 버튼 제공\n- ESC 지원 가능\n- 모바일 전체폭 대응\n- 배경 스크롤 제어\n- CTA 포함\n\n---\n\n# 16. GUIDE\n\n## GUIDE-001 Price\n\n표시:\n\n- 쉘터 150,000원\n- 36개월 이상 25,000원\n- 36개월 미만 무료\n- 최대 10인\n\n---\n\n# 16.2 GUIDE-002 Time\n\n### 오전\n\n10:00 \\~ 15:00\n\n### 오후\n\n16:00 \\~ 21:00\n\n---\n\n# 16.3 GUIDE-003 Preparation\n\n필수 준비물:\n\n- 아쿠아슈즈\n- 수건\n- 세면도구\n\n---\n\n# 16.4 GUIDE-004 Food & Alcohol\n\n외부 음식 및 주류 반입 제한 내용을 명확하게 안내한다.\n\n---\n\n# 16.5 GUIDE-005 Stay\n\n숙박 조건을 명확하게 설명한다.\n\n특히 다음 내용은 강조한다.\n\n**숙박 단독 예약 불가**\n\n---\n\n# 16.6 GUIDE-006 Cancellation\n\n취소 및 환불 정책을 표 또는 단계형 UI로 제공한다.\n\n---\n\n# 17. RESERVATION\n\n# RSV-001 Reservation Entry\n\n예약 CTA 클릭 시 예약 페이지 또는 예약 프로세스로 이동한다.\n\n---\n\n# RSV-002 Date Selection\n\n사용자가 예약 날짜를 선택한다.\n\n### 날짜 상태\n\n- 예약 가능\n- 일부 가능\n- 마감\n- 휴무\n- 선택\n\n---\n\n# RSV-003 Time Slot\n\n사용자가 선택할 수 있는 타임:\n\n- 오전\n- 오후\n\n---\n\n# RSV-004 Shelter Selection\n\n사용자는 예약 가능한 쉘터를 선택한다.\n\n쉘터 번호:\n\n**1 \\~ 24**\n\n### 상태\n\n- Available\n- Selected\n- Reserved\n- Disabled\n\n예약 완료된 쉘터는 선택할 수 없다.\n\n---\n\n# RSV-005 Guest Selection\n\n총 이용인원 최대:\n\n**10명**\n\n입력 데이터 예:\n\n- 일반 이용자\n- 36개월 이상\n- 36개월 미만\n\n---\n\n# RSV-006 Guest Validation\n\n총 인원이 10명을 초과하면 예약을 진행하지 않는다.\n\n오류 메시지:\n\n> 최대 이용 가능 인원은 10명입니다.\n\n---\n\n# RSV-007 Price Calculation\n\n요금은 선택 값에 따라 자동 계산한다.\n\n기본 구조:\n\n```text\n쉘터 기본요금\n+\n유료 추가 인원 요금\n=\n총 이용금액\n\n```\n\n36개월 미만 인원은 추가요금 계산에서 제외한다.\n\n---\n\n# RSV-008 Stay Condition\n\n오후 타임 선택 시에만 숙박 관련 안내 또는 선택 기능을 활성화할 수 있다.\n\n오전 선택 시:\n\n- 숙박 옵션 숨김\n- 숙박 선택 불가\n\n---\n\n# RSV-009 Customer Information\n\n예약자 정보 입력 항목:\n\n- 이름\n- 휴대폰 번호\n- 이메일\n- 이용 인원\n- 요청사항\n\n필요에 따라 이메일은 선택항목으로 운영할 수 있다.\n\n---\n\n# RSV-010 Agreement\n\n필수 동의 항목:\n\n- 이용규정\n- 취소 및 환불정책\n- 개인정보 수집 및 이용\n\n필수 동의가 완료되지 않으면 예약을 제출할 수 없다.\n\n---\n\n# RSV-011 Reservation Summary\n\n최종 제출 전 다음 내용을 확인한다.\n\n- 예약 날짜\n- 오전 / 오후\n- 쉘터\n- 인원\n- 숙박 여부\n- 이용요금\n- 예약자\n\n---\n\n# RSV-012 Duplicate Reservation Check\n\n예약 제출 시 동일한 날짜 / 시간 / 쉘터의 예약 상태를 재확인한다.\n\n중복 시:\n\n> 해당 시간의 쉘터 예약이 마감되었습니다. 다른 쉘터를 선택해주세요.\n\n---\n\n# RSV-013 Reservation Complete\n\n예약 성공 후 완료 화면을 표시한다.\n\n### 표시 내용\n\n- 예약번호\n- 예약일\n- 시간\n- 쉘터\n- 인원\n- 결제 또는 예약 금액\n- 예약자\n- 예약 상태\n\n---\n\n# 18. LOCATION\n\n## LOC-001 Map\n\nRELIM 위치를 지도 형태로 제공한다.\n\n---\n\n# LOC-002 Address\n\n주소를 텍스트로 제공한다.\n\n---\n\n# LOC-003 Navigation\n\n외부 길찾기 서비스 연결을 지원할 수 있다.\n\n예:\n\n- 네이버지도\n- 카카오맵\n\n---\n\n# LOC-004 Visit Guide\n\n필요 시 다음을 표시한다.\n\n- 주차\n- 차량 진입\n- 출입구\n- 방문 유의사항\n\n---\n\n# 19. GALLERY\n\n## GAL-001 Gallery List\n\n실제 RELIM 공간 이미지를 제공한다.\n\n---\n\n# GAL-002 Lightbox\n\n이미지 클릭 시 확대 화면 제공.\n\n---\n\n# GAL-003 Lazy Loading\n\n화면 밖 이미지는 Lazy Loading을 적용한다.\n\n---\n\n# GAL-004 Responsive Image\n\nDesktop / Mobile 환경에 맞는 이미지 크기를 사용한다.\n\n---\n\n# 20. FAQ\n\n## FAQ-001 FAQ List\n\nAccordion UI를 기본으로 한다.\n\n---\n\n# FAQ-002 Category\n\n필요 시 FAQ를 분류한다.\n\n- 예약\n- 이용\n- 요금\n- 취소\n- 시설\n- 숙박\n\n---\n\n# FAQ-003 Accordion\n\n질문 클릭 시 답변을 펼친다.\n\n---\n\n# 21. REVIEW\n\n## REV-001 Review List\n\n리뷰 목록을 표시한다.\n\n초기 테스트 또는 운영 데이터 기준:\n\n**약 80개**\n\n---\n\n# REV-002 Review Detail\n\n필요 시 다음 정보 표시:\n\n- 작성자\n- 내용\n- 평점\n- 이미지\n- 작성일\n\n---\n\n# REV-003 Review Status\n\n관리자 상태:\n\n- 공개\n- 숨김\n- 삭제\n\n---\n\n# 22. Q&A\n\n## QNA-001 Q&A List\n\n초기 테스트 데이터:\n\n**약 10개**\n\n---\n\n# QNA-002 Question\n\n사용자는 문의성 질문을 등록할 수 있다.\n\n---\n\n# QNA-003 Answer\n\n관리자는 답변을 등록하거나 수정할 수 있다.\n\n---\n\n# 23. ADMIN\n\n## ADM-AUTH-001 Login\n\n관리자 인증 후 Admin에 접근한다.\n\n비로그인 사용자는 관리자 데이터를 확인할 수 없다.\n\n---\n\n# 24. ADMIN DASHBOARD\n\n## ADM-DASH-001 Today Visitors\n\n오늘 방문자 표시\n\n---\n\n# ADM-DASH-002 Weekly Visitors\n\n최근 주간 방문자 표시\n\n---\n\n# ADM-DASH-003 Total Visitors\n\n누적 방문자 표시\n\n---\n\n# ADM-DASH-004 Inquiry Summary\n\n문의 상태별 개수 표시\n\n- 신규\n- 확인\n- 처리중\n- 완료\n\n---\n\n# ADM-DASH-005 Recent Activity\n\n최근 데이터를 보여준다.\n\n예:\n\n- 예약\n- 문의\n- 리뷰\n- Q&A\n- 가입\n\n---\n\n# 25. ADMIN RESERVATION\n\n## ADM-RSV-001 Reservation List\n\n예약 목록 조회\n\n표시 예:\n\n- 예약번호\n- 날짜\n- 시간\n- 쉘터\n- 예약자\n- 인원\n- 금액\n- 상태\n\n---\n\n# ADM-RSV-002 Reservation Detail\n\n예약 상세정보 확인\n\n---\n\n# ADM-RSV-003 Reservation Status\n\n상태 예:\n\n- 예약접수\n- 예약확정\n- 이용완료\n- 취소\n\n---\n\n# 26. ADMIN INQUIRY\n\n## ADM-INQ-001 Inquiry List\n\n관리자가 접수된 문의를 확인한다.\n\n---\n\n# ADM-INQ-002 Inquiry Detail\n\n표시:\n\n- 이름\n- 전화번호\n- 이메일\n- 문의내용\n- 접수일\n- 처리상태\n\n---\n\n# ADM-INQ-003 Status\n\n상태:\n\n- 신규\n- 확인\n- 처리중\n- 완료\n\n---\n\n# ADM-INQ-004 Delete\n\n삭제 시 즉시 영구삭제하지 않는다.\n\n삭제 데이터는 휴지통으로 이동한다.\n\n---\n\n# 27. ADMIN REVIEW\n\n## ADM-REV-001 Review List\n\n리뷰 목록 관리\n\n---\n\n# ADM-REV-002 Visibility\n\n리뷰 공개 / 비공개 변경\n\n---\n\n# ADM-REV-003 Delete\n\n리뷰 삭제 시 휴지통으로 이동\n\n---\n\n# 28. ADMIN Q&A\n\n## ADM-QNA-001 Q&A List\n\n질문 목록 확인\n\n---\n\n# ADM-QNA-002 Answer\n\n관리자가 답변 등록\n\n---\n\n# ADM-QNA-003 Edit\n\n기존 답변 수정\n\n---\n\n# 29. ADMIN MEMBER\n\n## ADM-MEM-001 Member List\n\n가입자 목록\n\n표시 예:\n\n- 이름\n- 이메일\n- 전화번호\n- 가입일\n\n---\n\n# ADM-MEM-002 Search\n\n다음 기준 검색:\n\n- 이름\n- 이메일\n- 전화번호\n\n---\n\n# 30. ADMIN TRASH\n\n## ADM-TRASH-001 Trash List\n\n삭제된 데이터를 한곳에서 확인한다.\n\n---\n\n# ADM-TRASH-002 Restore\n\n삭제된 데이터를 복원한다.\n\n---\n\n# ADM-TRASH-003 Permanent Delete\n\n관리자가 명시적으로 영구삭제한 경우에만 완전히 삭제한다.\n\n---\n\n# 31. 기능명세 요약\n\n| ID페이지기능권한우선순위 |             |        |        |    |\n| ------------- | ----------- | ------ | ------ | -- |\n| HOME-001      | Home        | Hero   | Public | P0 |\n| HOME-006      | Home        | 예약 CTA | Public | P0 |\n| SPACE-002     | Space       | 쉘터 지도  | Public | P0 |\n| SPACE-003     | Space       | 쉘터 선택  | Public | P0 |\n| GUIDE-001     | Guide       | 요금 안내  | Public | P0 |\n| GUIDE-002     | Guide       | 이용시간   | Public | P0 |\n| GUIDE-005     | Guide       | 숙박 안내  | Public | P0 |\n| RSV-002       | Reservation | 날짜 선택  | Public | P1 |\n| RSV-003       | Reservation | 시간 선택  | Public | P1 |\n| RSV-004       | Reservation | 쉘터 선택  | Public | P1 |\n| RSV-005       | Reservation | 인원 입력  | Public | P1 |\n| RSV-007       | Reservation | 금액 계산  | System | P1 |\n| RSV-008       | Reservation | 숙박 조건  | System | P1 |\n| RSV-010       | Reservation | 약관 동의  | Public | P1 |\n| RSV-012       | Reservation | 중복 검증  | System | P1 |\n| RSV-013       | Reservation | 예약 완료  | System | P1 |\n| GAL-001       | Gallery     | 갤러리    | Public | P1 |\n| FAQ-001       | FAQ         | FAQ    | Public | P1 |\n| REV-001       | Review      | 리뷰 목록  | Public | P2 |\n| QNA-001       | Q&A         | Q&A 목록 | Public | P2 |\n| ADM-AUTH-001  | Admin       | 로그인    | Admin  | P0 |\n| ADM-DASH-001  | Admin       | 방문자    | Admin  | P2 |\n| ADM-RSV-001   | Admin       | 예약관리   | Admin  | P1 |\n| ADM-INQ-001   | Admin       | 문의관리   | Admin  | P1 |\n| ADM-REV-001   | Admin       | 리뷰관리   | Admin  | P2 |\n| ADM-QNA-001   | Admin       | Q&A 관리 | Admin  | P2 |\n| ADM-MEM-001   | Admin       | 가입자    | Admin  | P2 |\n| ADM-TRASH-001 | Admin       | 휴지통    | Admin  | P2 |\n\n---\n\n# 32. 상세 기능 처리 명세\n\n| IDTriggerValidationProcessResult |           |          |             |          |\n| -------------------------------- | --------- | -------- | ----------- | -------- |\n| HOME-006                         | 예약 CTA 클릭 | -        | 예약 경로 호출    | 예약 페이지   |\n| SPACE-003                        | 쉘터 클릭     | 유효 번호    | 쉘터 데이터 조회   | 상세 팝업    |\n| RSV-002                          | 날짜 클릭     | 예약 가능 날짜 | 상태 확인       | 날짜 선택    |\n| RSV-003                          | 타임 클릭     | 운영 시간 확인 | 슬롯 조회       | 오전/오후 선택 |\n| RSV-004                          | 쉘터 클릭     | 예약 여부    | 가용성 조회      | 쉘터 선택    |\n| RSV-005                          | 인원 변경     | 최대 10명   | 인원 합산       | 상태 갱신    |\n| RSV-007                          | 인원 변경     | 유료인원 확인  | 가격 계산       | 총액 갱신    |\n| RSV-008                          | 오후 선택     | 타임 확인    | 숙박 조건 활성화   | 숙박 UI    |\n| RSV-010                          | 예약 제출     | 약관 동의    | 필수항목 확인     | 제출 가능    |\n| RSV-012                          | 예약 제출     | 중복여부     | 최신 예약 상태 조회 | 성공/차단    |\n| ADM-INQ-003                      | 상태 변경     | Admin    | DB 갱신       | 상태 변경    |\n| ADM-TRASH-002                    | 복구 클릭     | Admin    | 삭제상태 해제     | 원목록 복귀   |\n\n---\n\n# 33. 예약 데이터 구조\n\n```text\nreservationId\nreservationDate\ntimeSlot\nshelterNumber\nadultCount\nchildCount\ninfantCount\ntotalGuestCount\nstayOption\ncustomerName\ncustomerPhone\ncustomerEmail\nrequest\nbasePrice\nadditionalPrice\ntotalPrice\nreservationStatus\ncreatedAt\nupdatedAt\ncancelledAt\n\n```\n\n---\n\n# 34. 문의 데이터 구조\n\n```text\ninquiryId\nname\nphone\nemail\ncontent\nstatus\ncreatedAt\nupdatedAt\ndeletedAt\n\n```\n\n---\n\n# 35. 리뷰 데이터 구조\n\n```text\nreviewId\nauthor\ncontent\nrating\nimages\nstatus\ncreatedAt\nupdatedAt\ndeletedAt\n\n```\n\n---\n\n# 36. Q&A 데이터 구조\n\n```text\nqnaId\nauthor\ntitle\ncontent\nanswer\nstatus\ncreatedAt\nansweredAt\ndeletedAt\n\n```\n\n---\n\n# 37. 방문자 데이터\n\n필수:\n\n- 방문일\n- 방문자 수\n- 페이지뷰\n\n추후 확장:\n\n- 유입경로\n- Device\n- Browser\n- Landing Page\n- 예약 CTA 클릭\n- 예약완료\n- 문의완료\n\n---\n\n# 38. Responsive\n\n## Desktop\n\n기본 디자인 기준:\n\n**1440px**\n\n---\n\n## Tablet\n\n대략:\n\n**768px \\~ 1024px**\n\n---\n\n## Mobile\n\n대략:\n\n**360px \\~ 767px**\n\n---\n\n# 38.1 Mobile UX 기준\n\n모바일에서 특히 확인해야 한다.\n\n- 버튼 최소 터치영역 확보\n- 텍스트 과밀 방지\n- 예약 스텝 단순화\n- 쉘터 지도 확대 가능\n- Modal 화면 밖 이탈 방지\n- 가격 정보 명확하게 표시\n- Sticky CTA 적용 가능\n- 브라우저 뒤로가기 정상 동작\n\n---\n\n# 39. SEO\n\n필수 구현:\n\n- Page Title\n- Meta Description\n- Canonical\n- Open Graph\n- Favicon\n- robots.txt\n- sitemap.xml\n- Semantic HTML\n- 이미지 alt\n\n---\n\n# 39.1 Search Engine\n\n등록 대상:\n\n- 네이버 서치어드바이저\n- Google Search Console\n\n---\n\n# 39.2 Structured Data\n\n적용 검토:\n\n- LocalBusiness\n- Organization\n- FAQPage\n- BreadcrumbList\n\n---\n\n# 40. Analytics\n\n측정 권장 Event:\n\n```text\nview_home\nview_space\nview_guide\nclick_reservation\nselect_date\nselect_time\nselect_shelter\nstart_reservation\ncomplete_reservation\nsubmit_inquiry\nview_location\n\n```\n\n이를 통해 향후 다음을 판단할 수 있다.\n\n- 어디에서 예약이 이탈하는지\n- 어떤 페이지가 예약에 기여하는지\n- 모바일/PC 전환 차이\n- CTA 위치별 성과\n\n---\n\n# 41. Performance\n\n## 필수\n\n- 이미지 WebP 또는 AVIF 권장\n- Lazy Loading\n- 불필요 JS 제거\n- CSS 최적화\n- 캐시 사용\n- 영상 최적화\n\n---\n\n# 41.1 이미지\n\n웹 원본 이미지를 그대로 대용량으로 로드하지 않는다.\n\n가능하면 화면 크기에 적합한 이미지 파일을 제공한다.\n\n---\n\n# 42. Accessibility\n\n권장 기준:\n\n- 이미지 alt\n- 버튼 label\n- 키보드 focus\n- 충분한 색상 대비\n- 폼 label 연결\n- 오류 메시지 명확화\n- Modal focus 관리\n\n---\n\n# 43. Security\n\n필수 검토:\n\n- 관리자 인증\n- 관리자 Route Protection\n- DB Security Rules\n- 개인정보 접근권한 제한\n- 입력값 Validation\n- XSS 방어\n- 무단 API 호출 방지\n- 관리자 데이터 Public 노출 금지\n\n---\n\n# 44. Error Handling\n\n## 예약 처리 실패\n\n> 예약 처리 중 문제가 발생했습니다. 다시 시도해주세요.\n\n사용자가 입력한 정보는 가능한 유지한다.\n\n---\n\n## 중복 예약\n\n> 해당 시간의 쉘터 예약이 마감되었습니다. 다른 쉘터를 선택해주세요.\n\n---\n\n## 네트워크 오류\n\n> 네트워크 연결을 확인한 후 다시 시도해주세요.\n\n---\n\n## 페이지 데이터 오류\n\n빈 화면을 보여주지 않고 안내 UI를 제공한다.\n\n---\n\n# 45. 상태 관리\n\n예약 상태 예:\n\n```text\nPENDING\nCONFIRMED\nCOMPLETED\nCANCELLED\n\n```\n\n문의:\n\n```text\nNEW\nCHECKED\nPROCESSING\nCOMPLETED\n\n```\n\n리뷰:\n\n```text\nVISIBLE\nHIDDEN\nDELETED\n\n```\n\n---\n\n# 46. 개발 우선순위\n\n## P0 — Core\n\n서비스 이용에 반드시 필요한 기능.\n\n- HOME\n- ABOUT\n- SPACE\n- 쉘터 지도\n- GUIDE\n- 운영시간\n- 이용요금\n- 이용규정\n- Reservation CTA\n- LOCATION\n- 모바일 대응\n- 관리자 인증\n- 기본 SEO\n\n---\n\n# 46.2 P1 — Reservation\n\n실제 고객 전환에 중요한 기능.\n\n- 날짜 선택\n- 시간 선택\n- 쉘터 선택\n- 인원 선택\n- 요금 계산\n- 숙박 조건\n- 예약자 정보\n- 약관 동의\n- 예약 중복 검증\n- 예약 완료\n- 관리자 예약 확인\n- 문의\n\n---\n\n# 46.3 P2 — Operation\n\n운영 효율화를 위한 기능.\n\n- Gallery\n- FAQ\n- 리뷰\n- Q&A\n- 가입자\n- 방문자 통계\n- 휴지통\n- Analytics\n\n---\n\n# 46.4 P3 — Future\n\n향후 확장 가능 기능.\n\n- 실시간 결제\n- SMS 알림\n- 카카오 알림톡\n- 예약 변경\n- 자동 취소\n- 자동 환불\n- 할인 쿠폰\n- 관리자 예약 캘린더\n- 고객 CRM\n- 재방문 고객 관리\n- 고객별 이용이력\n- 매출 Dashboard\n\n---\n\n# 47. 개발 변경 원칙\n\n사이트 수정 시 다음 기준을 따른다.\n\n### 1.\n\n요청받지 않은 기존 기능은 제거하지 않는다.\n\n### 2.\n\n기능 수정 전 영향 범위를 확인한다.\n\n### 3.\n\nDesktop과 Mobile을 모두 확인한다.\n\n### 4.\n\n예약 관련 수정은 전체 예약 Flow를 다시 테스트한다.\n\n### 5.\n\n관리자 수정은 권한 및 데이터 저장을 함께 확인한다.\n\n### 6.\n\n디자인 수정이 기능 동작을 방해하지 않아야 한다.\n\n### 7.\n\n배포 전 주요 기능 Regression Test를 진행한다.\n\n---\n\n# 48. 핵심 Regression Test\n\n사이트 수정 시 최소 다음을 확인한다.\n\n- 메인 접속\n- 메뉴 이동\n- 모바일 메뉴\n- 예약 CTA\n- 쉘터 지도\n- 팝업\n- 날짜 선택\n- 시간 선택\n- 쉘터 선택\n- 인원 계산\n- 총 금액 계산\n- 숙박 조건\n- 예약 등록\n- 문의 등록\n- Admin Login\n- 예약조회\n- 문의조회\n- 삭제\n- 휴지통\n- 복원\n\n---\n\n# 49. Definition of Done\n\n기능은 다음 조건을 모두 충족해야 완료로 판단한다.\n\n- 요구사항 구현 완료\n- Desktop 정상\n- Mobile 정상\n- Chrome 정상\n- Safari 정상\n- 데이터 저장 정상\n- Validation 정상\n- 오류 처리 정상\n- 관리자 권한 정상\n- 기존 기능 영향 없음\n- 예약 Flow 영향 없음\n- SEO 구조 영향 없음\n\n---\n\n# 50. 콘텐츠 관리 원칙\n\n사이트의 핵심 정보 우선순위는 다음과 같다.\n\n**공간 → 이용시간 → 요금 → 규정 → 예약**\n\n콘텐츠가 추가되더라도 이 흐름을 방해하지 않는다.\n\n---\n\n# 51. 사이트 포지셔닝 원칙\n\nRELIM을 다음과 같이 보이게 하지 않는다.\n\n- 일반 펜션\n- 숙박 예약 플랫폼\n- 단순 수영장\n- 단순 카페\n\nRELIM은 다음과 같이 커뮤니케이션한다.\n\n> 수영, 쉼, 바비큐, 카페와 선택적 숙박이 연결되는 시간제 복합 휴식 공간.\n\n---\n\n# 52. GitHub 문서 구조\n\nRepository 내 다음 구조를 권장한다.\n\n```text\n/docs\n  PRD.md\n  FUNCTION_SPEC.md\n  OPERATIONS.md\n  CHANGELOG.md\n  QA_CHECKLIST.md\n\n```\n\n---\n\n## PRD.md\n\n- 서비스 정의\n- 사용자\n- 정책\n- IA\n- User Flow\n- 우선순위\n\n---\n\n## FUNCTION\\_SPEC.md\n\n- 기능 ID\n- Trigger\n- Validation\n- Processing\n- Result\n- Error Handling\n\n---\n\n## OPERATIONS.md\n\n변경 가능성이 높은 운영정보를 관리한다.\n\n예:\n\n- 운영시간\n- 가격\n- 환불정책\n- 이용규정\n- 준비물\n- 숙박정책\n\n---\n\n## CHANGELOG.md\n\n사이트 변경 이력을 기록한다.\n\n예:\n\n```text\n2026.08.21\n- RELIM 브랜드 표기 통일\n- PRD v1.0 작성\n- 예약 기능명세 정리\n\n```\n\n---\n\n## QA\\_CHECKLIST.md\n\n배포 전 확인 항목 관리.\n\n---\n\n# 53. 개발 요청용 기본 Prompt\n\n향후 개발자 또는 AI에게 수정 요청 시 다음 기준을 사용한다.\n\n> RELIM 프로젝트의 PRD.md, FUNCTION\\_SPEC.md, OPERATIONS.md를 기준 문서로 사용한다.\n>\n> 명시적으로 변경 요청하지 않은 기존 기능 및 운영정책은 유지한다.\n>\n> 수정 전 관련 기능과 영향 범위를 확인하고, 기존 코드를 중복 생성하지 않는다.\n>\n> 동일한 기능을 수행하는 CSS, JavaScript, 컴포넌트 또는 이벤트가 중복되어 있다면 기존 구현을 확인한 뒤 안전하게 정리한다.\n>\n> 수정 후 Desktop 및 Mobile 환경에서 확인한다.\n>\n> 예약과 관련된 수정은 날짜 → 시간 → 쉘터 → 인원 → 가격 → 예약완료까지 전체 Flow를 테스트한다.\n>\n> 관리자 기능 수정 시 로그인, 데이터 조회, 저장, 삭제, 복원까지 확인한다.\n>\n> 기존 정상 기능을 임의로 삭제하거나 비활성화하지 않는다.\n\n---\n\n# 54. Single Source of Truth\n\nRELIM의 웹사이트 개발 및 운영 기준은 다음 순서로 판단한다.\n\n### 1순위\n\n`OPERATIONS.md`\n\n운영시간, 요금, 이용규정 등 실제 운영 정책\n\n### 2순위\n\n`PRD.md`\n\n서비스 목적, 구조, 사용자 경험\n\n### 3순위\n\n`FUNCTION_SPEC.md`\n\n실제 기능 동작\n\n### 4순위\n\n`CHANGELOG.md`\n\n변경 이력\n\n충돌되는 내용이 있을 경우 가장 최신의 승인된 운영정책을 우선한다.\n\n---\n\n# 55. 최종 제품 원칙\n\nRELIM 웹사이트는 화려한 기능 자체보다 다음 네 가지를 가장 우선한다.\n\n**명확성**\n\n사용자가 공간과 이용방식을 즉시 이해할 수 있어야 한다.\n\n**신뢰성**\n\n가격, 운영시간, 예약조건이 서로 다르게 노출되지 않아야 한다.\n\n**예약 편의성**\n\n예약까지 불필요한 단계를 최소화한다.\n\n**운영 안정성**\n\n사이트 수정 시 정상 동작 중인 기존 기능을 보호하고, 운영자가 데이터를 쉽게 관리할 수 있어야 한다.\n\n---\n\n**END OF DOCUMENT**";
  const GENERIC_TEMPLATE = "# {{SITE_NAME}} Website\n\n## Product Requirements Document + Functional Specification\n\n**문서명** {{SITE_NAME}} 웹사이트 PRD + 기능명세서  \n**버전** v1.0  \n**기준일** {{TODAY}}  \n**도메인** {{DOMAIN}}  \n**문서 목적** 웹사이트의 기획·개발·운영·유지보수 기준과 QA 기준을 하나의 문서로 관리한다.\n\n---\n\n# 1. 프로젝트 개요\n\n## 1.1 프로젝트 정의\n\n사이트의 목적과 서비스 성격을 작성한다.\n\n## 1.2 핵심 목표\n\n- 사용자가 사이트의 목적을 빠르게 이해할 수 있어야 한다.\n- 핵심 기능이 Desktop / Mobile에서 동일하게 정상 동작해야 한다.\n- 운영 정보와 실제 기능이 서로 다르게 노출되지 않아야 한다.\n\n---\n\n# 2. 핵심 사용자\n\n## 2.1 Visitor\n\n- 정보 탐색\n- 주요 기능 이용\n- 문의 또는 전환\n\n## 2.2 Admin\n\n- 콘텐츠 및 데이터 확인\n- 상태 관리\n- 운영 정보 수정\n\n---\n\n# 3. 사이트 정보구조\n\n| 1Depth | 2Depth | 목적 |\n| --- | --- | --- |\n| Home | - | 핵심 정보 및 주요 CTA |\n| About | - | 브랜드 / 기업 소개 |\n| Service | - | 서비스 / 제품 소개 |\n| Contact | - | 문의 및 전환 |\n\n---\n\n# 4. 핵심 사용자 흐름\n\n```text\nHOME\n↓\n핵심 정보 확인\n↓\n서비스 / 제품 확인\n↓\nCTA\n↓\n문의 또는 주요 기능 완료\n```\n\n---\n\n# 5. 기능명세\n\n| ID | Page | 기능 | 권한 | 우선순위 |\n| --- | --- | --- | --- | --- |\n| HOME-001 | Home | Hero | Public | P0 |\n| NAV-001 | Global | 메뉴 이동 | Public | P0 |\n| CTA-001 | Global | 주요 CTA | Public | P0 |\n| FORM-001 | Contact | 문의 입력 및 제출 | Public | P1 |\n\n---\n\n# 6. 상세 기능 처리 명세\n\n| ID | Trigger | Validation | Process | Result |\n| --- | --- | --- | --- | --- |\n| NAV-001 | 메뉴 클릭 | 유효 URL | 경로 이동 | 대상 페이지 노출 |\n| CTA-001 | CTA 클릭 | 연결 대상 확인 | 경로 또는 기능 호출 | 전환 화면 |\n| FORM-001 | 문의 제출 | 필수값 확인 | 데이터 저장 / 전송 | 완료 안내 |\n\n---\n\n# 7. Responsive\n\n## Desktop\n\n기본 디자인 기준: **1440px**\n\n## Tablet\n\n대략: **768px ~ 1024px**\n\n## Mobile\n\n대략: **360px ~ 767px**\n\n### Mobile UX 기준\n\n- 버튼 최소 터치영역 확보\n- 텍스트 과밀 방지\n- 이미지 및 콘텐츠 잘림 방지\n- Modal 화면 밖 이탈 방지\n- 브라우저 뒤로가기 정상 동작\n\n---\n\n# 8. SEO\n\n필수 구현:\n\n- Page Title\n- Meta Description\n- Canonical\n- Open Graph\n- Favicon\n- robots.txt\n- sitemap.xml\n- Semantic HTML\n- 이미지 alt\n\n---\n\n# 9. Performance\n\n- 이미지 WebP 또는 AVIF 권장\n- Lazy Loading\n- 불필요 JS 제거\n- CSS 최적화\n- 캐시 사용\n\n---\n\n# 10. Accessibility\n\n- 이미지 alt\n- 버튼 label\n- 키보드 focus\n- 충분한 색상 대비\n- 폼 label 연결\n- 오류 메시지 명확화\n\n---\n\n# 11. Security\n\n- 관리자 인증\n- 입력값 Validation\n- 개인정보 접근권한 제한\n- XSS 방어\n- 무단 API 호출 방지\n- 관리자 데이터 Public 노출 금지\n\n---\n\n# 12. Error Handling\n\n## 기능 처리 실패\n\n> 처리 중 문제가 발생했습니다. 다시 시도해주세요.\n\n## 네트워크 오류\n\n> 네트워크 연결을 확인한 후 다시 시도해주세요.\n\n---\n\n# 13. 핵심 Regression Test\n\n- 메인 접속\n- 메뉴 이동\n- 모바일 메뉴\n- 주요 CTA\n- 폼 입력 및 제출\n- 팝업 / 모달\n- Desktop 레이아웃\n- Mobile 레이아웃\n- 외부 링크\n- 관리자 기능\n\n---\n\n# 14. Definition of Done\n\n- 요구사항 구현 완료\n- Desktop 정상\n- Mobile 정상\n- Chrome 정상\n- Safari 정상\n- 데이터 저장 정상\n- Validation 정상\n- 오류 처리 정상\n- 기존 기능 영향 없음\n\n---\n\n# 15. 개발 변경 원칙\n\n1. 요청받지 않은 기존 기능은 제거하지 않는다.\n2. 기능 수정 전 영향 범위를 확인한다.\n3. Desktop과 Mobile을 모두 확인한다.\n4. 디자인 수정이 기능 동작을 방해하지 않아야 한다.\n5. 배포 전 주요 기능 Regression Test를 진행한다.\n\n---\n\n**END OF DOCUMENT**\n";

  const STYLE_ID = 'qa-function-spec-style';
  const WORKSPACE_ID = 'qaFunctionSpecWorkspace';
  const OPEN_SELECTOR = '[data-qa-spec-open]';
  let api = null;
  let activeSiteId = '';
  let activeSite = null;
  let content = '';
  let originalContent = '';
  let dirty = false;
  let mode = 'view';
  let exportPromise = null;
  let ensureQueued = false;

  const $ = (selector, root = document) => root.querySelector(selector);
  const escapeHtml = (value = '') => String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

  const todayKey = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}.${m}.${day}`;
  };

  function toast(message) {
    const el = $('#toast');
    if (!el) return;
    el.textContent = message;
    el.classList.add('is-visible');
    clearTimeout(window.__qaFunctionSpecToastTimer);
    window.__qaFunctionSpecToastTimer = setTimeout(() => el.classList.remove('is-visible'), 2500);
  }

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .qa-spec-open-button{display:inline-flex;align-items:center;gap:6px}
      .qa-function-spec-workspace{position:fixed;inset:0;z-index:2500;display:grid;grid-template-rows:auto 1fr;background:#111216;color:#f3f3f5}
      .qa-function-spec-workspace[hidden]{display:none!important}
      .qa-spec-topbar{display:flex;align-items:center;justify-content:space-between;gap:18px;min-height:72px;padding:13px 20px;border-bottom:1px solid #2e3037;background:rgba(22,23,27,.97);backdrop-filter:blur(14px)}
      .qa-spec-title{min-width:0}
      .qa-spec-title small{display:block;margin-bottom:4px;color:#7e828d;font-size:9px;font-weight:800;letter-spacing:.11em;text-transform:uppercase}
      .qa-spec-title strong{display:block;overflow:hidden;max-width:48vw;color:#f5f5f7;font-size:16px;letter-spacing:-.025em;white-space:nowrap;text-overflow:ellipsis}
      .qa-spec-title span{display:block;margin-top:4px;color:#777b86;font-size:10px}
      .qa-spec-actions{display:flex;align-items:center;gap:7px;flex-wrap:wrap;justify-content:flex-end}
      .qa-spec-actions button{height:39px}
      .qa-spec-mode{display:inline-flex;padding:3px;border:1px solid #34363e;border-radius:9px;background:#1b1c21}
      .qa-spec-mode button{height:32px;border:0;border-radius:6px;padding:0 11px;background:transparent;color:#8d919c;font:700 11px Pretendard,sans-serif;cursor:pointer}
      .qa-spec-mode button.is-active{background:#30323a;color:#fff}
      .qa-spec-save.is-dirty::before{content:'•';margin-right:6px}
      .qa-spec-main{min-height:0;overflow:auto;padding:28px}
      .qa-spec-paper{width:min(920px,100%);min-height:calc(100vh - 130px);margin:0 auto;border-radius:3px;padding:64px 72px 84px;background:#fff;color:#17181b;box-shadow:0 24px 70px rgba(0,0,0,.28)}
      .qa-spec-editor-shell{width:min(1100px,100%);height:calc(100vh - 132px);margin:0 auto}
      .qa-spec-editor{box-sizing:border-box;width:100%;height:100%;border:1px solid #343740;border-radius:10px;padding:24px;background:#181a1f;color:#eceef2;font:400 14px/1.72 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;outline:0;resize:none;tab-size:2}
      .qa-spec-editor:focus{border-color:#576ef2;box-shadow:0 0 0 3px rgba(87,110,242,.1)}
      .qa-spec-doc{font-family:Pretendard,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;line-height:1.72;letter-spacing:-.015em;word-break:keep-all}
      .qa-spec-doc h1{margin:46px 0 18px;padding-top:6px;font-size:30px;line-height:1.25;letter-spacing:-.045em}
      .qa-spec-doc h1:first-child{margin-top:0}
      .qa-spec-doc h2{margin:34px 0 13px;font-size:21px;line-height:1.35;letter-spacing:-.035em}
      .qa-spec-doc h3{margin:26px 0 10px;font-size:16px;line-height:1.4;letter-spacing:-.025em}
      .qa-spec-doc h4{margin:22px 0 8px;font-size:14px}
      .qa-spec-doc p{margin:0 0 13px;color:#33353a}
      .qa-spec-doc strong{color:#111217;font-weight:760}
      .qa-spec-doc ul,.qa-spec-doc ol{margin:5px 0 17px;padding-left:23px}
      .qa-spec-doc li{margin:4px 0;color:#303238}
      .qa-spec-doc blockquote{margin:16px 0;padding:13px 16px;border-left:3px solid #1d2026;background:#f4f5f7;color:#34363a}
      .qa-spec-doc blockquote p{margin:0}
      .qa-spec-doc hr{height:1px;border:0;margin:30px 0;background:#e4e5e8}
      .qa-spec-doc code{border-radius:4px;padding:2px 5px;background:#f0f1f3;font:500 12px/1.5 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
      .qa-spec-doc pre{overflow:auto;margin:16px 0 20px;border-radius:8px;padding:17px 19px;background:#17191e;color:#eef0f4;white-space:pre-wrap;word-break:break-word}
      .qa-spec-doc pre code{padding:0;background:transparent;color:inherit}
      .qa-spec-doc table{width:100%;border-collapse:collapse;margin:16px 0 24px;font-size:12px;line-height:1.5}
      .qa-spec-doc th,.qa-spec-doc td{border:1px solid #dfe1e5;padding:9px 10px;text-align:left;vertical-align:top}
      .qa-spec-doc th{background:#f4f5f6;color:#17181b;font-weight:750}
      .qa-spec-doc a{color:#324bc7;text-decoration:none;word-break:break-all}
      .qa-spec-empty{display:grid;min-height:360px;place-items:center;color:#858994;text-align:center}
      .qa-spec-status{min-width:92px;color:#787c86;font-size:10px;text-align:right}
      body.qa-function-spec-open{overflow:hidden!important}
      @media(max-width:760px){
        .qa-spec-topbar{align-items:flex-start;flex-direction:column;padding:12px}
        .qa-spec-title strong{max-width:90vw}
        .qa-spec-actions{width:100%;justify-content:flex-start}
        .qa-spec-main{padding:12px}
        .qa-spec-paper{min-height:calc(100vh - 180px);padding:34px 24px 56px}
        .qa-spec-editor-shell{height:calc(100vh - 180px)}
        .qa-spec-doc h1{font-size:25px}
      }
      @media print{
        body>*:not(#${WORKSPACE_ID}){display:none!important}
        #${WORKSPACE_ID}{position:static!important;display:block!important;background:#fff!important}
        #${WORKSPACE_ID} .qa-spec-topbar{display:none!important}
        #${WORKSPACE_ID} .qa-spec-main{overflow:visible!important;padding:0!important}
        #${WORKSPACE_ID} .qa-spec-paper{width:auto!important;min-height:0!important;margin:0!important;padding:0!important;box-shadow:none!important}
      }
    `;
    document.head.appendChild(style);
  }

  function inlineMarkdown(raw = '') {
    let text = escapeHtml(raw);
    const code = [];
    text = text.replace(/`([^`]+)`/g, (_, value) => {
      const token = `@@CODE${code.length}@@`;
      code.push(`<code>${value}</code>`);
      return token;
    });
    text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    text = text.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    code.forEach((value, index) => {
      text = text.replace(`@@CODE${index}@@`, value);
    });
    return text;
  }

  function splitTableRow(line) {
    return String(line).trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(cell => cell.trim());
  }

  function isTableSeparator(line) {
    const cells = splitTableRow(line);
    return cells.length > 0 && cells.every(cell => /^:?-{3,}:?$/.test(cell));
  }

  function renderMarkdown(markdown = '') {
    const lines = String(markdown || '').replace(/\r\n/g, '\n').split('\n');
    const out = [];
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      const trimmed = line.trim();

      if (!trimmed) { i += 1; continue; }

      if (/^```/.test(trimmed)) {
        const lang = trimmed.slice(3).trim();
        const codeLines = [];
        i += 1;
        while (i < lines.length && !/^```/.test(lines[i].trim())) {
          codeLines.push(lines[i]);
          i += 1;
        }
        if (i < lines.length) i += 1;
        out.push(`<pre${lang ? ` data-language="${escapeHtml(lang)}"` : ''}><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`);
        continue;
      }

      if (/^\|/.test(trimmed) && i + 1 < lines.length && isTableSeparator(lines[i + 1])) {
        const headers = splitTableRow(line);
        i += 2;
        const rows = [];
        while (i < lines.length && /^\|/.test(lines[i].trim()) && lines[i].trim()) {
          rows.push(splitTableRow(lines[i]));
          i += 1;
        }
        out.push(`<table><thead><tr>${headers.map(cell => `<th>${inlineMarkdown(cell)}</th>`).join('')}</tr></thead><tbody>${rows.map(row => `<tr>${headers.map((_, idx) => `<td>${inlineMarkdown(row[idx] || '')}</td>`).join('')}</tr>`).join('')}</tbody></table>`);
        continue;
      }

      const heading = trimmed.match(/^(#{1,6})\s+(.+)$/);
      if (heading) {
        const level = Math.min(4, heading[1].length);
        out.push(`<h${level}>${inlineMarkdown(heading[2])}</h${level}>`);
        i += 1;
        continue;
      }

      if (/^---+$/.test(trimmed)) {
        out.push('<hr>');
        i += 1;
        continue;
      }

      if (/^>\s?/.test(trimmed)) {
        const quote = [];
        while (i < lines.length && /^>\s?/.test(lines[i].trim())) {
          quote.push(lines[i].trim().replace(/^>\s?/, ''));
          i += 1;
        }
        out.push(`<blockquote><p>${inlineMarkdown(quote.join(' '))}</p></blockquote>`);
        continue;
      }

      if (/^[-*+]\s+/.test(trimmed)) {
        const items = [];
        while (i < lines.length && /^[-*+]\s+/.test(lines[i].trim())) {
          items.push(lines[i].trim().replace(/^[-*+]\s+/, ''));
          i += 1;
        }
        out.push(`<ul>${items.map(item => `<li>${inlineMarkdown(item)}</li>`).join('')}</ul>`);
        continue;
      }

      if (/^\d+[.)]\s+/.test(trimmed)) {
        const items = [];
        while (i < lines.length && /^\d+[.)]\s+/.test(lines[i].trim())) {
          items.push(lines[i].trim().replace(/^\d+[.)]\s+/, ''));
          i += 1;
        }
        out.push(`<ol>${items.map(item => `<li>${inlineMarkdown(item)}</li>`).join('')}</ol>`);
        continue;
      }

      const paragraph = [trimmed];
      i += 1;
      while (i < lines.length) {
        const next = lines[i].trim();
        if (!next || /^(#{1,6})\s+/.test(next) || /^```/.test(next) || /^\|/.test(next) || /^>\s?/.test(next) || /^[-*+]\s+/.test(next) || /^\d+[.)]\s+/.test(next) || /^---+$/.test(next)) break;
        paragraph.push(next);
        i += 1;
      }
      out.push(`<p>${inlineMarkdown(paragraph.join('\n')).replaceAll('\n', '<br>')}</p>`);
    }
    return out.join('');
  }

  function siteMeta(site = {}) {
    const name = site.name || site.siteName || site.title || '사이트';
    const url = site.url || site.siteUrl || '';
    let domain = site.displayDomain || '';
    if (!domain && url) {
      try { domain = new URL(url).hostname.replace(/^www\./, ''); } catch {}
    }
    return { name, url, domain };
  }

  function isRelim(siteId, site = {}) {
    const meta = siteMeta(site);
    return site.sostProjectId === 'relim' || /relim/i.test(String(siteId || '')) || /re-lim\.com/i.test(meta.domain);
  }

  function defaultTemplate(siteId, site = {}) {
    if (isRelim(siteId, site)) return RELIM_TEMPLATE;
    const meta = siteMeta(site);
    return GENERIC_TEMPLATE
      .replaceAll('{{SITE_NAME}}', meta.name)
      .replaceAll('{{DOMAIN}}', meta.domain || '-')
      .replaceAll('{{TODAY}}', todayKey());
  }

  function currentSiteId() {
    const stateId = window.NineworksQAState?.getSiteId?.();
    if (stateId) return stateId;
    const hashMatch = location.hash.match(/^#qa\/site\/([^/?#]+)/);
    if (hashMatch) return decodeURIComponent(hashMatch[1]);
    return document.querySelector('[data-qa-site].is-selected')?.dataset.qaSite || '';
  }

  function ensureWorkspace() {
    let workspace = document.getElementById(WORKSPACE_ID);
    if (workspace) return workspace;
    workspace = document.createElement('section');
    workspace.id = WORKSPACE_ID;
    workspace.className = 'qa-function-spec-workspace';
    workspace.hidden = true;
    workspace.setAttribute('role', 'dialog');
    workspace.setAttribute('aria-modal', 'true');
    workspace.setAttribute('aria-label', '사이트 기능명세서');
    workspace.innerHTML = `
      <header class="qa-spec-topbar">
        <div class="qa-spec-title">
          <small>SITE FUNCTION SPECIFICATION</small>
          <strong id="qaSpecWorkspaceTitle">사이트 기능명세서</strong>
          <span id="qaSpecWorkspaceMeta">불러오는 중</span>
        </div>
        <div class="qa-spec-actions">
          <div class="qa-spec-mode" role="tablist" aria-label="문서 보기 방식">
            <button type="button" data-qa-spec-mode="view" class="is-active">보기</button>
            <button type="button" data-qa-spec-mode="edit">수정</button>
          </div>
          <span class="qa-spec-status" id="qaSpecSaveStatus"></span>
          <button class="button button--primary qa-spec-save" id="qaSpecSave" type="button">저장</button>
          <button class="button button--ghost" id="qaSpecExportPdf" type="button">PDF 내보내기</button>
          <button class="button button--ghost" id="qaSpecClose" type="button">닫기</button>
        </div>
      </header>
      <main class="qa-spec-main">
        <article class="qa-spec-paper qa-spec-doc" id="qaSpecPreview"></article>
        <div class="qa-spec-editor-shell" id="qaSpecEditorShell" hidden>
          <textarea class="qa-spec-editor" id="qaSpecEditor" spellcheck="false" aria-label="기능명세서 Markdown 편집"></textarea>
        </div>
      </main>
    `;
    document.body.appendChild(workspace);
    return workspace;
  }

  function updateDirtyState() {
    const save = $('#qaSpecSave');
    const status = $('#qaSpecSaveStatus');
    if (save) save.classList.toggle('is-dirty', dirty);
    if (status) status.textContent = dirty ? '저장 전 변경사항' : (activeSite?.functionalSpecUpdatedAtText ? `저장됨 · ${String(activeSite.functionalSpecUpdatedAtText).slice(0, 10)}` : '초기 템플릿');
  }

  function renderPreview() {
    const preview = $('#qaSpecPreview');
    if (!preview) return;
    preview.innerHTML = content.trim() ? renderMarkdown(content) : '<div class="qa-spec-empty">등록된 기능명세서가 없습니다.<br>수정 모드에서 내용을 작성해주세요.</div>';
  }

  function setMode(nextMode) {
    mode = nextMode === 'edit' ? 'edit' : 'view';
    const preview = $('#qaSpecPreview');
    const editorShell = $('#qaSpecEditorShell');
    const editor = $('#qaSpecEditor');
    document.querySelectorAll('[data-qa-spec-mode]').forEach(button => button.classList.toggle('is-active', button.dataset.qaSpecMode === mode));
    if (mode === 'edit') {
      if (editor) editor.value = content;
      if (preview) preview.hidden = true;
      if (editorShell) editorShell.hidden = false;
      requestAnimationFrame(() => editor?.focus());
    } else {
      if (editor && editor.value !== content) content = editor.value;
      renderPreview();
      if (preview) preview.hidden = false;
      if (editorShell) editorShell.hidden = true;
    }
  }

  async function loadSite(siteId) {
    if (!api || !siteId) return null;
    const snap = await api.getDoc(api.doc(api.db, 'qaSites', siteId));
    return snap.exists() ? { id: snap.id, ...snap.data() } : { id: siteId };
  }

  async function openWorkspace() {
    const siteId = currentSiteId();
    if (!siteId) {
      toast('먼저 QA 사이트를 선택해주세요.');
      return;
    }
    if (!api?.auth?.currentUser) {
      toast('로그인 후 기능명세서를 사용할 수 있습니다.');
      return;
    }
    const workspace = ensureWorkspace();
    activeSiteId = siteId;
    workspace.hidden = false;
    document.body.classList.add('qa-function-spec-open');
    $('#qaSpecWorkspaceTitle').textContent = '기능명세서를 불러오는 중입니다.';
    $('#qaSpecWorkspaceMeta').textContent = '';
    $('#qaSpecPreview').innerHTML = '<div class="qa-spec-empty">문서를 불러오는 중입니다.</div>';
    try {
      activeSite = await loadSite(siteId);
      const meta = siteMeta(activeSite);
      content = typeof activeSite.functionalSpec === 'string' && activeSite.functionalSpec.trim()
        ? activeSite.functionalSpec
        : defaultTemplate(siteId, activeSite);
      originalContent = content;
      dirty = false;
      $('#qaSpecWorkspaceTitle').textContent = `${meta.name} · 사이트 기능명세서`;
      $('#qaSpecWorkspaceMeta').textContent = [meta.domain, activeSite.functionalSpecVersion || 'v1.0'].filter(Boolean).join(' · ');
      renderPreview();
      setMode('view');
      updateDirtyState();
    } catch (error) {
      console.error('기능명세서 불러오기 실패', error);
      $('#qaSpecPreview').innerHTML = '<div class="qa-spec-empty">기능명세서를 불러오지 못했습니다.</div>';
      toast('기능명세서를 불러오지 못했습니다.');
    }
  }

  async function saveSpec() {
    if (!api?.auth?.currentUser || !activeSiteId) return;
    const editor = $('#qaSpecEditor');
    if (mode === 'edit' && editor) content = editor.value;
    const button = $('#qaSpecSave');
    const oldText = button?.textContent || '저장';
    if (button) { button.disabled = true; button.textContent = '저장 중...'; }
    try {
      const stamp = new Date().toISOString();
      await api.setDoc(api.doc(api.db, 'qaSites', activeSiteId), {
        functionalSpec: content,
        functionalSpecFormat: 'markdown',
        functionalSpecVersion: activeSite?.functionalSpecVersion || 'v1.0',
        functionalSpecUpdatedAt: api.serverTimestamp(),
        functionalSpecUpdatedAtText: stamp,
        functionalSpecUpdatedByUid: api.auth.currentUser.uid,
        updatedAt: api.serverTimestamp(),
        updatedAtText: stamp
      }, { merge: true });
      activeSite = { ...(activeSite || {}), functionalSpec: content, functionalSpecUpdatedAtText: stamp };
      originalContent = content;
      dirty = false;
      updateDirtyState();
      toast('기능명세서를 저장했습니다.');
    } catch (error) {
      console.error('기능명세서 저장 실패', error);
      toast(String(error?.code || '').includes('permission-denied') ? '기능명세서 저장 권한을 확인해주세요.' : '기능명세서를 저장하지 못했습니다.');
    } finally {
      if (button) { button.disabled = false; button.textContent = oldText; }
    }
  }

  function closeWorkspace(force = false) {
    const workspace = document.getElementById(WORKSPACE_ID);
    if (!workspace || workspace.hidden) return;
    if (dirty && !force && !window.confirm('저장하지 않은 기능명세서 변경사항이 있습니다. 저장하지 않고 닫으시겠습니까?')) return;
    workspace.hidden = true;
    document.body.classList.remove('qa-function-spec-open');
    activeSiteId = '';
    activeSite = null;
    content = '';
    originalContent = '';
    dirty = false;
    mode = 'view';
  }

  function loadHtml2Pdf() {
    if (window.html2pdf) return Promise.resolve(window.html2pdf);
    if (exportPromise) return exportPromise;
    exportPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
      script.async = true;
      script.onload = () => resolve(window.html2pdf);
      script.onerror = reject;
      document.head.appendChild(script);
    });
    return exportPromise;
  }

  function printFallback() {
    const meta = siteMeta(activeSite || {});
    const win = window.open('', '_blank', 'noopener,noreferrer');
    if (!win) {
      toast('팝업 차단을 해제한 뒤 다시 시도해주세요.');
      return;
    }
    win.document.write(`<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>${escapeHtml(meta.name)} 기능명세서</title><style>body{margin:0;padding:18mm;font-family:Pretendard,Arial,sans-serif;color:#17181b}article{max-width:180mm;margin:0 auto;font-size:12px;line-height:1.65}h1{font-size:26px;margin:32px 0 14px}h1:first-child{margin-top:0}h2{font-size:19px;margin:25px 0 10px}h3{font-size:15px;margin:20px 0 8px}table{width:100%;border-collapse:collapse;margin:12px 0 18px;font-size:10px}th,td{border:1px solid #ddd;padding:7px;text-align:left;vertical-align:top}th{background:#f3f3f3}pre{white-space:pre-wrap;background:#f5f5f5;padding:12px}blockquote{border-left:3px solid #222;margin:12px 0;padding:8px 12px;background:#f5f5f5}@page{size:A4;margin:14mm}</style></head><body><article>${renderMarkdown(content)}</article></body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 250);
  }

  async function exportPdf() {
    const editor = $('#qaSpecEditor');
    if (mode === 'edit' && editor) content = editor.value;
    renderPreview();
    const button = $('#qaSpecExportPdf');
    const oldText = button?.textContent || 'PDF 내보내기';
    if (button) { button.disabled = true; button.textContent = 'PDF 생성 중...'; }
    try {
      const html2pdf = await loadHtml2Pdf();
      if (!html2pdf) throw new Error('html2pdf unavailable');
      const meta = siteMeta(activeSite || {});
      const holder = document.createElement('div');
      holder.style.cssText = 'width:190mm;padding:12mm;background:#fff;color:#17181b;';
      holder.innerHTML = `<article class="qa-spec-doc">${renderMarkdown(content)}</article>`;
      document.body.appendChild(holder);
      const filename = `${String(meta.name || 'site').replace(/[^0-9A-Za-z가-힣._-]+/g, '_')}_기능명세서_${todayKey().replaceAll('.', '-')}.pdf`;
      await html2pdf().set({
        margin: [10, 10, 12, 10],
        filename,
        image: { type: 'jpeg', quality: 0.97 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'], avoid: ['tr', 'pre', 'blockquote'] }
      }).from(holder).save();
      holder.remove();
      toast('PDF 내보내기를 시작했습니다.');
    } catch (error) {
      console.warn('PDF 직접 내보내기 실패, 인쇄 방식으로 전환', error);
      printFallback();
    } finally {
      if (button) { button.disabled = false; button.textContent = oldText; }
    }
  }

  function ensureTrigger() {
    ensureQueued = false;
    const compactActions = $('#qaCompactDetail:not([hidden]) .qa-detail-head__actions');
    if (compactActions && !compactActions.querySelector(OPEN_SELECTOR)) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'button button--ghost qa-spec-open-button';
      button.dataset.qaSpecOpen = 'true';
      button.textContent = '기능명세서 보기';
      compactActions.insertBefore(button, compactActions.querySelector('a') || null);
    }
    const oldWorkbarActions = $('#qaSiteDetail .qa-detail-workbar-actions');
    if (oldWorkbarActions && !oldWorkbarActions.querySelector(OPEN_SELECTOR)) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'button button--ghost qa-spec-open-button';
      button.dataset.qaSpecOpen = 'true';
      button.textContent = '기능명세서';
      oldWorkbarActions.insertBefore(button, oldWorkbarActions.lastElementChild || null);
    }
  }

  function scheduleEnsureTrigger() {
    if (ensureQueued) return;
    ensureQueued = true;
    requestAnimationFrame(ensureTrigger);
  }

  function bindEvents() {
    document.addEventListener('click', event => {
      if (event.target.closest(OPEN_SELECTOR)) {
        event.preventDefault();
        event.stopPropagation();
        openWorkspace();
        return;
      }
      const modeButton = event.target.closest('[data-qa-spec-mode]');
      if (modeButton) {
        setMode(modeButton.dataset.qaSpecMode);
        return;
      }
      if (event.target.closest('#qaSpecSave')) {
        saveSpec();
        return;
      }
      if (event.target.closest('#qaSpecExportPdf')) {
        exportPdf();
        return;
      }
      if (event.target.closest('#qaSpecClose')) {
        closeWorkspace();
      }
    });

    document.addEventListener('input', event => {
      if (event.target?.id !== 'qaSpecEditor') return;
      content = event.target.value;
      dirty = content !== originalContent;
      updateDirtyState();
    });

    document.addEventListener('keydown', event => {
      const workspace = document.getElementById(WORKSPACE_ID);
      if (!workspace || workspace.hidden) return;
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        saveSpec();
        return;
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        closeWorkspace();
      }
    });

    window.addEventListener('beforeunload', event => {
      const workspace = document.getElementById(WORKSPACE_ID);
      if (!dirty || !workspace || workspace.hidden) return;
      event.preventDefault();
      event.returnValue = '';
    });
  }

  function init() {
    injectStyle();
    ensureWorkspace();
    bindEvents();
    const waitApi = () => {
      api = window.NineworksFirebase;
      if (!api) return setTimeout(waitApi, 80);
      scheduleEnsureTrigger();
      const observer = new MutationObserver(scheduleEnsureTrigger);
      observer.observe(document.body, { childList: true, subtree: true });
      window.addEventListener('hashchange', scheduleEnsureTrigger);
      window.addEventListener('popstate', scheduleEnsureTrigger);
    };
    waitApi();
  }

  window.NineworksQAFunctionSpec = {
    open: openWorkspace,
    close: () => closeWorkspace(),
    save: saveSpec,
    exportPdf
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
