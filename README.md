# 세특 스튜디오

학생 활동 키워드나 관찰 내용을 입력하면 수집·작성·검토 에이전트 흐름으로 과목별 세특 초안을 만들고, Supabase에 저장·조회하는 Next 기반 웹앱입니다.

## 실행 및 Supabase 연결

1. Supabase SQL Editor에서 `supabase/schema.sql`을 실행합니다.
2. `.env.example`을 `.env.local`로 복사하고 Supabase URL과 anon key를 입력합니다.
3. `npm install` 후 `npm run dev`로 실행합니다.

환경 변수가 없으면 로컬 미리보기 모드로 작성과 임시 내역 조회를 테스트할 수 있습니다. 환경 변수가 있으면 `seteuk_records` 테이블에 저장하고 목록을 Supabase에서 불러옵니다.

## Vercel 배포

Vercel에서 이 저장소를 Import한 뒤 다음 환경 변수를 등록합니다.

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

기본 모델과 Gemini API Key는 개인 메뉴에서 설정합니다. 현재 생성기는 외부 API가 없어도 검증 가능한 로컬 에이전트 파이프라인으로 동작하며, 모델 설정은 생성 환경 메타데이터로 표시됩니다.
