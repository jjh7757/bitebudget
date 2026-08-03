# BiteBudget 구현 정리

기획서(예산·위치 기반 맛집 추천)의 화면 3개와 테이블 설계를 기준으로 구현한 내용입니다.

## 1. 인증 (Supabase Auth)

기획서 화면에는 없었지만, `restaurants.user_id`로 "본인 목록만 조회"를 구현하려면 로그인이 필요해서 추가했습니다.

- 이메일/비밀번호 회원가입·로그인 — [app/login/page.tsx](app/login/page.tsx)
- 로그아웃 — [lib/actions.ts](lib/actions.ts)의 `signOut`
- 로그인하지 않으면 모든 페이지가 `/login`으로 리다이렉트 — [proxy.ts](proxy.ts)
  (이 프로젝트의 Next.js 버전은 `middleware.ts`가 `proxy.ts`로 이름이 바뀜)
- 브라우저/서버용 Supabase 클라이언트 — [lib/supabase/client.ts](lib/supabase/client.ts), [lib/supabase/server.ts](lib/supabase/server.ts)

## 2. 데이터베이스 (Supabase)

`restaurants` 테이블을 기획서 설계대로 재생성:

| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | bigint | 자동 증가 PK |
| name | text | 식당 이름 |
| category | text | 한식/중식/일식/양식/카페 |
| address | text | 주소 |
| budget | integer | 예산 |
| visited | boolean | 다녀왔는지 |
| rating | smallint | 별점 1~5 (안 갔으면 null) |
| memo | text | 한 줄 메모 |
| user_id | uuid | 등록한 사용자 (auth.users 참조) |
| created_at | timestamptz | 자동 생성 |

Row Level Security로 본인 소유 행만 select/insert/update/delete 가능하도록 정책 설정 (다른 사용자 목록 공유 안 함 — 기획서의 "안 만들 것" 준수).

## 3. 화면 1 — 목록 (`/`)

[app/page.tsx](app/page.tsx)

- "가고 싶은 곳" / "다녀온 곳" 탭 전환
- 카테고리 필터 칩 (전체/한식/중식/일식/양식/카페)
- 예산 필터 칩 (예산 전체/1만원 이하/2만원 이하/3만원 이하 — `budget` 컬럼에 `lte` 조건)
- 카드 목록: 카테고리 배지, 다녀옴 배지, 이름, 별점(다녀온 경우만), 예산
- 우하단 + 버튼 → 등록 화면 이동
- 로그아웃 버튼

## 4. 화면 3 — 등록 (`/restaurants/new`)

[app/restaurants/new/page.tsx](app/restaurants/new/page.tsx)

- 이름 / 카테고리(칩 선택) / 주소 / 예산만 입력받는 최소 등록 폼
- Server Action(`createRestaurant`)으로 저장 후 상세 화면으로 이동
- 별점·메모는 여기서 받지 않고 상세 화면 안내 문구로 유도

## 5. 화면 2 — 상세 (`/restaurants/[id]`)

[app/restaurants/[id]/page.tsx](app/restaurants/[id]/page.tsx)

- 카테고리 배지, 이름, 주소, 예산 표시
- "다녀왔어요" 토글 스위치
- 별점 선택 (커스텀 클라이언트 컴포넌트 — [components/RatingInput.tsx](components/RatingInput.tsx))
- 메모 입력
- 수정 버튼 (토글/별점/메모 저장, `updateRestaurantStatus`)
- 삭제 버튼 (`deleteRestaurant`)

## 6. 기획서의 "안 만들 것" 준수 여부

지도 API 연동, 거리순 정렬, 예약/웨이팅, 주문/결제, 배달, 타 사용자 공유, 공개 리뷰, 추천 이력, 가격대 자동추정, 별도 즐겨찾기 테이블 — **모두 구현하지 않음** (기획서 범위 그대로 유지).

## 7. 알려진 제한사항

- Supabase 무료 플랜의 기본 이메일 발송은 시간당 제한이 있어 회원가입 확인 메일을 짧은 시간에 여러 번 요청하면 "email rate limit exceeded" 에러가 날 수 있음. 필요하면 Supabase 대시보드 → Authentication → Sign In / Providers → Email에서 "Confirm email"을 꺼서 우회 가능.
