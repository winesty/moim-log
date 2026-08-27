# 모임 기록 (moim-log)

모임/가족 지인 등과의 만남을 기록하는 개인용 웹앱입니다. 일자, 장소(주소/메뉴),
참석자, 참석자별로 나눈 이야기(해시태그 카테고리 포함), 금액을 기록하고
이름/날짜/장소/메뉴로 검색할 수 있습니다.

## 기술 스택
- Next.js 14 (App Router) + TypeScript + Tailwind
- 데이터 저장은 `StorageProvider` 인터페이스로 추상화되어 있어
  구글 드라이브(`GoogleDriveProvider`) 또는 로컬 파일(`LocalFileProvider`) 중
  환경변수로 선택 가능. 다른 클라우드를 붙이려면 동일 인터페이스를 구현하는
  클래스를 `lib/storage/`에 추가하고 `lib/storage/index.ts`에 한 줄만 추가하면 됩니다.

## 데이터 모델
- `Person` (참석자): 이름 + 나이/학력/가족관계/커리어/회사및직함/주요Network/취미/기타
- `Place` (장소): 이름, 주소, 메뉴 목록(가격 포함)
- `Meeting` (모임): 일자, 시간, 장소, 참석자, 금액, 이야기 목록
- `StoryEntry` (이야기): 참석자별 대화 내용. `#카테고리` 해시태그를 자유롭게 포함 가능하며,
  모임 이후에도 계속 추가할 수 있습니다 (작성일자가 각 항목에 별도로 기록됨)
- `StoryCategory`: 기본 제공(#나이 #학력 #가족관계 #커리어 #회사및직함 #주요Network #취미 #기타) +
  사용자가 직접 추가하는 커스텀 카테고리

## 로컬 실행 (구글 드라이브 연동 없이 바로 테스트)
```bash
npm install
cp .env.example .env.local   # STORAGE_PROVIDER=local 이 기본값
npm run dev
```
`http://localhost:3000` 접속. 데이터는 프로젝트 폴더의 `.local-data/`에 JSON으로 저장됩니다.

## 구글 드라이브 연동 설정
1. [Google Cloud Console](https://console.cloud.google.com/)에서 프로젝트 생성 후
   "Drive API" 사용 설정
2. OAuth 동의 화면 구성 (테스트 사용자에 본인 구글 계정 추가), OAuth 클라이언트 ID
   생성 (유형: 웹 애플리케이션, 승인된 리디렉션 URI에
   `http://localhost:3000/api/auth/google/callback` 추가)
3. 발급받은 클라이언트 ID/시크릿을 `.env.local`에 입력하고 `STORAGE_PROVIDER=google-drive`로 변경
4. 서버 실행 후 브라우저에서 `http://localhost:3000/api/auth/google` 접속 → 구글 로그인/동의
5. 콜백 화면에 표시되는 refresh token을 복사해 `.env.local`의 `GOOGLE_REFRESH_TOKEN`에 붙여넣고
   서버 재시작
6. 이후 모든 데이터는 사용자 드라이브의 `moim-log-data` 폴더에 JSON 파일로 저장됩니다
   (사용자 소유 폴더이므로, 나중에 장소/메뉴 데이터를 다른 사람과 공유하고 싶으면
   드라이브에서 해당 파일을 직접 공유하면 됩니다)

## GitHub + Vercel로 테스트 배포
```bash
git init
git add .
git commit -m "init"
gh repo create moim-log --private --source=. --push
# 또는 GitHub 웹에서 저장소 생성 후 git remote add origin ... && git push
```
이후 [vercel.com](https://vercel.com)에서 이 GitHub 저장소를 Import하면
push할 때마다 자동으로 프리뷰 배포가 생성됩니다. Vercel 프로젝트 설정의
Environment Variables에 `.env.local`과 동일한 값(STORAGE_PROVIDER, GOOGLE_CLIENT_ID 등)을
등록하세요. 구글 OAuth 리디렉션 URI에도 배포 도메인의
`/api/auth/google/callback` 주소를 추가로 등록해야 합니다.

## 폴더 구조
```
app/
  page.tsx              최근 모임 목록 (홈)
  new/page.tsx           새 모임 입력
  meeting/[id]/page.tsx   모임 상세 + 이후 이야기 추가
  search/page.tsx        검색
  api/                   REST API 라우트
components/
  MeetingForm.tsx         입력 폼
  AddStoryForm.tsx        모임 이후 이야기 추가 폼
lib/
  types.ts                도메인 타입
  storage/                StorageProvider 인터페이스 + 구현체
```

## 다음에 이어서 할 만한 것들
- 참석자 프로필(나이/학력/가족관계 등) 편집 화면 (`/people`)
- 장소/메뉴 관리 화면 (`/places`)
- 카테고리별 필터 검색 (예: #커리어 태그만 모아보기)
- 인증 없이 본인만 쓰는 구조이므로, 나중에 실제로 공유하려면 별도 로그인/권한 체계 추가 필요
