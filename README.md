# 9WORKS CRM

나인웍스 내부에서 클라이언트 요청과 팀 일정을 함께 관리하기 위한 다크 워크스페이스 프로토타입입니다.

## 현재 구현된 화면

- 로그인 화면
- 전체 캘린더
- 일정 추가·수정·삭제
- 일정 드래그 이동 및 기간 조절
- 클라이언트·담당자·업무 분류 필터
- 마이페이지
  - 전체 현황
  - 목표 일정
  - 해야 할 일
  - 담당 요청
  - 완료 업무
  - 프로필
- 클라이언트 목록
- 요청사항 보드
- 요청사항을 일정으로 전환

## 파일 구성

```text
nineworks_crm/
├── index.html
├── css/
│   └── style.css
├── js/
│   └── app.js
└── README.md
```

## 실행 방법

정적 HTML 프로젝트이므로 `index.html`을 브라우저에서 열거나 로컬 서버를 실행하면 됩니다.

```bash
python3 -m http.server 8000
```

브라우저에서 `http://localhost:8000`으로 접속합니다.

## 현재 데이터 저장 방식

현재 단계는 UI와 사용 흐름을 확인하기 위한 프로토타입으로, 로그인 상태와 일정·할 일·요청사항을 브라우저 `localStorage`에 저장합니다.

- 실제 계정 인증은 아직 연결하지 않았습니다.
- 로그인 폼에 이메일과 비밀번호를 입력하면 화면에 접속됩니다.
- 다른 브라우저나 다른 직원과 데이터가 공유되지는 않습니다.

## 다음 단계: Firebase 연결

아래 순서로 연결할 예정입니다.

1. Firebase Authentication
   - 관리자 초대 방식 계정 생성
   - Owner / Staff 권한 분리
2. Cloud Firestore
   - `users`
   - `events`
   - `todos`
   - `requests`
   - `clients`
3. 실시간 동기화
   - 일정 이동 및 수정 즉시 반영
   - 요청사항 상태 변경 공유
4. Firestore Security Rules
   - 로그인 사용자만 접근
   - 관리자와 직원 권한 구분
5. GitHub Pages 또는 Firebase Hosting 배포

## 사용 라이브러리

- Pretendard
- FullCalendar 6.1.15
- Vanilla HTML / CSS / JavaScript

## 디자인 방향

웨이브랩 웹사이트의 무드를 기준으로 구성했습니다.

- 차콜 다크 배경
- 화이트 타이포그래피
- 블루 포인트 컬러
- 얇은 구분선
- 카드보다 여백과 리스트 중심
- 상단 고정 내비게이션
