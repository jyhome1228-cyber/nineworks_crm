# NINEWORKS CRM

나인웍스 내부에서 클라이언트 요청과 팀 일정을 함께 관리하기 위한 다크 워크스페이스입니다.

## 구현된 기능

- Firebase 관리자 이메일 로그인
- 로그인 상태 자동 유지
- 비로그인 사용자 내부 화면 차단
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
- Firestore 실시간 데이터 공유

## 파일 구성

```text
nineworks_crm/
├── index.html
├── assets/
│   └── nineworks-logo.svg
├── css/
│   └── style.css
├── js/
│   ├── firebase.js
│   └── app.js
├── firebase.json
├── firestore.rules
└── README.md
```

## Firebase 콘솔 설정

### 1. Authentication

Firebase Console에서 아래 순서로 설정합니다.

```text
Authentication
→ 로그인 방법
→ 이메일/비밀번호 활성화
→ 사용자 탭에서 관리자 계정 추가
```

웹사이트에는 회원가입 기능이 없으며 Firebase Console에서 생성한 계정만 로그인할 수 있습니다.

### 2. Firestore Database

```text
Firestore Database
→ 데이터베이스 만들기
→ Production mode
→ asia-northeast3 또는 사용할 리전 선택
```

### 3. 보안 규칙

Firebase Console의 Firestore `규칙` 탭에 저장소의 `firestore.rules` 내용을 붙여넣고 게시합니다.

현재 규칙은 Firebase Authentication으로 로그인한 계정만 일정, 할 일, 요청사항, 클라이언트 데이터를 읽고 수정할 수 있도록 설정되어 있습니다.

## 데이터 컬렉션

```text
events
 todos
 requests
 clients
 meta
 users
```

최초 로그인 시 데이터베이스가 비어 있으면 화면 확인용 기본 데이터가 한 번 자동 생성됩니다. 이후 일정과 요청사항 변경은 Firestore에 즉시 저장되며 로그인한 다른 사용자 화면에도 실시간 반영됩니다.

## 로컬 실행

Firebase 모듈을 사용하므로 파일을 직접 더블클릭하지 말고 로컬 서버로 실행합니다.

```bash
python3 -m http.server 8000
```

브라우저에서 `http://localhost:8000`으로 접속합니다.

## 사용 라이브러리

- Firebase Web SDK 12.17.0
- FullCalendar 6.1.15
- Pretendard
- Vanilla HTML / CSS / JavaScript

## 디자인 방향

웨이브랩 웹사이트의 무드를 기준으로 구성했습니다.

- 차콜 다크 배경
- 화이트 타이포그래피
- 블루 포인트 컬러
- 얇은 구분선
- 카드보다 여백과 리스트 중심
- 상단 고정 내비게이션
