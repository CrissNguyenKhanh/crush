# Test results

Latest verification: 2026-10-20.

| Check | Result | Evidence |
|---|---|---|
| Backend build | PASS | `npm run build` exit 0 |
| Frontend build/typecheck | PASS | `npm run build` exit 0; 3968 modules transformed |
| Weighted matching unit test | PASS | 1 suite, 3 tests |
| Allocation create/accept/retry lock tests | PASS | 1 suite, 3 tests; each path asserts transaction, per-user pessimistic lock and capacity query |
| Role guard unit test | PASS | 1 suite, 2 tests; required role is allowed and a different authenticated role is rejected |
| Targeted backend lint (new DTO/entity/module/scorer files) | PASS | exit 0 |
| Targeted frontend lint (new/affected Matching UI/API files) | PASS | exit 0 |
| Frontend runtime smoke | PASS | Vite ready; `GET /login` returned HTTP 200 and root element |
| Backend runtime smoke | BLOCKED | MariaDB/MySQL at local `localhost:3306` returned `ECONNREFUSED`; boot was run with initializer and migration auto-run disabled |
| Full backend Jest | FAIL (baseline debt) | 6/32 suites and 25/51 tests pass. All new focused suites pass; remaining failures are scaffold specs missing repository/service mocks or exposing circular test DI |
| Database migration/API E2E | NOT VERIFIED | Database service unavailable; migration was not run and existing data was not modified |
| Authenticated browser walkthrough | NOT VERIFIED | Backend/database unavailable; no claim of UI workflow completion is made |

No production/real database mutation, commit, merge or push was performed.
