# Final pre-push review

Ngày kiểm tra: 2026-10-20  
Phạm vi: working tree của `integration/khanh-final`, Matching HR/PM/Developer, allocation, Task matching, RBAC, migration và release gates.

## 1. Git branch và changeset

- Branch hiện tại: `integration/khanh-final`.
- Đã chạy `git fetch origin --prune` thành công, không merge/rebase. So với ref `origin/main` mới fetch: `HEAD` ahead 186 commit, behind 0 commit.
- `HEAD` là `53249f5ad43ba45b97dd5e5987880562449618bd`; `origin/main` là `a2bbe6f748fdc50257580412d0acb8d51d9380b7`; `origin/integration/khanh-final` hiện trùng `HEAD` trước changeset working tree.
- Diff commit-level với `origin/main`: 342 file. Đây là integration branch chứa thay đổi toàn dự án, không phải một changeset Matching độc lập.
- Working tree sau security fix: 34 tracked file modified, 32 untracked file, 0 staged file. Changeset đề xuất gồm đúng 65 file, loại trừ `backend/src/modules/users/users.controller.ts`.
- Không có thao tác `git add`, commit, push, merge, reset hoặc checkout.
- `backend/.env.example` là thay đổi có trước nhưng đã được sửa có chủ đích theo yêu cầu security gate. `backend/src/modules/users/users.controller.ts` vẫn được giữ nguyên như lúc bắt đầu vòng này và bị loại khỏi staging đề xuất.
- `backend/package.json` chỉ bổ sung Jest `moduleNameMapper`; không thêm dependency nên không cần thay đổi lockfile.
- `backend/.env` và `frontend/.env` đều được ignore. Không thấy `.pem`, `.key`, `.p12`, `.pfx`, database dump hoặc file tạm audit còn lại.
- Không tìm thấy skill ID giả dạng `sk-*`, `MOCK_SKILLS` hoặc `mockSkills` trong source sau khi loại các false positive như `task-dependencies`.

## 2. Những vấn đề đã kiểm tra

- HR Talent/Bench dùng dữ liệu API thật; HR tạo recommendation tới project/Sprint hợp lệ.
- Recommendation duplicate, transition, PM access hiện tại, notification và transaction rollback.
- Allocation create/accept/decline/retry/release, overlap capacity, duplicate và lock ordering.
- Task create/edit dùng skill catalog thật, validate skill tồn tại, duplicate skill, weighted score và candidate eligibility.
- Developer chỉ đọc/cập nhật Task của chính mình; DTO không cho mass assignment các field quản trị.
- Task lifecycle, dependency guard, progress/status consistency, evidence idempotency và realtime publish sau commit.
- JWT authentication, role metadata, object-level PM ownership, Developer ownership và DTO validation.
- Entity/module/migration Matching, foreign key, index, `synchronize: false` và migration default-off.
- Route/sidebar/API wiring cho HR Matching, PM Matching và Developer Tasks.
- Git staged/unstaged/untracked, secret exposure, package config và diff với `origin/main`.

## 3. Bugs phát hiện

### P0 — đã sửa trong changeset; còn rotation ngoài repository

- `backend/.env.example` đã dùng placeholder an toàn cho `INIT_PASSWORD`, `JWT_SECRET_KEY` và `JWT_REFRESH_SECRET_KEY`; cả ba không còn khớp local `backend/.env`.
- Checksum của `backend/.env` trước/sau khi sửa giống nhau; file thật không bị sửa, xóa hoặc stage và vẫn được `.gitignore` bảo vệ.
- Sau `git fetch`, exact-value scan trên 210 commit reachable từ refs local/origin cho thấy `INIT_PASSWORD` hiện tại đã xuất hiện trong history origin (140 commit, tại user service cũ và admin add-user UI). Hard-code còn tồn tại trong working tree đã được xóa; form tạo user nay yêu cầu admin nhập mật khẩu tạm thời tối thiểu 12 ký tự.
- Hai JWT secret không có match trong reachable Git history/origin hoặc tracked/untracked working tree. Tuy nhiên access JWT secret đã bị công cụ patch verification in vào local audit transcript trong lúc sửa; không lặp lại giá trị trong báo cáo. Vì vậy phải rotate `JWT_SECRET_KEY` cùng `INIT_PASSWORD` theo quy trình vận hành. Không tự rotate môi trường.
- Không có bằng chứng Git/transcript cho thấy `JWT_REFRESH_SECRET_KEY` bị lộ. Không kết luận phải rotate key này chỉ vì từng tồn tại trong local working tree; nếu chính sách vận hành bắt buộc rotate cặp JWT cùng nhau thì thực hiện coordinated rotation ngoài changeset này.

### P1/P2 — đã sửa trong phạm vi Matching

- Recommendation create dùng check-then-save, có thể tạo duplicate khi concurrent.
- Recommendation decision không khóa row, có thể bị accept/reject đồng thời.
- Project không-active và Sprint terminal vẫn có thể được đề cử; target API trả cả Sprint deleted/terminal.
- PM cũ vẫn có thể thấy recommendation sau khi mất quyền vì query dựa trên `recommendation.pmId` lịch sử.
- Notification lỗi sau commit làm API trả lỗi giả dù business state đã lưu.
- JWT strategy dùng role/status từ token cũ thay vì user hiện tại trong DB.
- Các route HR Talent, Project, Sprint, Task và UserSprint thiếu role gate tường minh; allocation/release payload còn `any` hoặc DTO rỗng.
- Matching score có thể trả `NaN`/`Infinity` với legacy data không hữu hạn.
- Developer Task update có ownership TOCTOU; Task/evidence không nằm trong cùng transaction; recomplete có thể tạo evidence trùng.
- UI Developer có thể gửi payload mâu thuẫn như `IN_PROGRESS + 100` hoặc `DONE + <100`.
- Allocation create/accept/retry và Sprint timeline update chưa dùng cùng chiến lược khóa, tạo race capacity.
- Task assignment có thể race với allocation release, để Developer đã release vẫn sở hữu Task.
- Review comment chỉ chứa whitespace có thể được lưu như review hợp lệ.

## 4. Bugs đã tự sửa

- Recommendation create khóa `User` bằng `pessimistic_write`, kiểm tra duplicate và insert trong một transaction.
- Recommendation decision khóa row recommendation; chỉ `PROPOSED` mới chuyển sang `ACCEPTED`/`REJECTED`.
- Chỉ project `active`, Sprint không deleted/terminal và skill không deleted được chấp nhận.
- PM list dựa trên Primary PM/Co-PM hiện tại của project.
- Notification recommendation chạy best-effort sau commit; lỗi notification không đảo kết quả nghiệp vụ.
- Bổ sung index `(pm_id,status)`, `(hr_id,created_at)` và `(employee_id,project_id,sprint_id,status)`.
- JWT strategy lấy identity/role/permissions hiện tại từ DB và bỏ user đã soft-delete.
- Bổ sung `@Roles`: HR cho HR Talent; PM cho Projects/Sprints và Task quản trị; Developer/PM tách rõ trên UserSprint và Developer Task.
- Bổ sung DTO UUID/enum/range/length cho allocation create, status và release review.
- Task lifecycle dùng row lock và transaction; owner constraint nằm trong locked query; evidence được tạo idempotent trong cùng transaction.
- Matching score normalize giá trị không hữu hạn và clamp score `0..100`.
- UI normalize status/progress hai chiều và đưa `validateFields()` vào error boundary.
- Allocation create/accept/retry khóa User rồi khóa Sprint; Sprint timeline update khóa các User bị ảnh hưởng rồi Sprint và re-check capacity trong transaction.
- Task assignment và allocation release cùng khóa User; assignment còn khóa Task, release re-check unfinished Task trong transaction.
- Review comment rỗng sau trim bị từ chối.
- Sanitize ba credential trong `.env.example`; xóa default password hard-code khỏi admin UI và bắt buộc nhập mật khẩu tạm thời tối thiểu 12 ký tự khi tạo user.

## 5. File đã thay đổi

Nhóm thay đổi Matching chính:

- Backend recommendation: `backend/src/modules/matching-recommendations/**`, `backend/migration/1792371600000-AddMatchingRecommendations.ts`, `backend/src/app.module.ts`.
- Backend auth/RBAC: `backend/src/decorator/customize.ts`, JWT guard/strategy và các test; role annotations trong HR Talents, Projects, Sprints, Tasks, UserSprint.
- Backend allocation/concurrency: UserSprint controller/service, response/retry service, DTO và focused tests; Sprint timeline service/test.
- Backend Task: controller/service/module, create/update/progress DTO, scorer và transaction/concurrency tests.
- Backend skill catalog: Skills controller/service.
- Frontend: route/sidebar/layout, HR Bench/Matching, PM Matching, Developer Tasks, Task create/edit và API clients.
- Test configuration/docs: `backend/package.json`, `backend/src/test-support/api-query-params.ts`, `docs/matching-completion/01..07`.

Security fix bắt buộc kèm changeset:

- `backend/.env.example` — chỉ còn placeholder.
- `frontend/src/components/admin/add-user-modal.tsx` — bỏ credential hard-code, yêu cầu mật khẩu tạm thời do admin nhập.

Manifest cần commit gồm đúng 65 path trong biến `$files` ở mục 10. File cần loại trừ:

- `backend/src/modules/users/users.controller.ts` — thay đổi formatting có trước (1 dòng thêm, 4 dòng xóa), không cần cho Matching/security fix và không bị ghi đè.
- `backend/.env`, `frontend/.env` — local, ignored, tuyệt đối không stage.
- `backend/dist/**`, `frontend/dist/**`, `node_modules/**` và artifact runtime — không nằm trong status/manifest.

## 6. Tests PASS/FAIL

PASS:

- Backend build: PASS.
- Frontend build + TypeScript typecheck: PASS; Vite báo warning bundle khoảng 2.48 MB, không phải build failure.
- Targeted frontend lint cho các trang/API Matching, Task mới và admin add-user security fix: PASS.
- Targeted backend lint cho module/test mới và migration: PASS.
- Focused backend regression: 8 suite, 22 test PASS sau các fix cuối, bao phủ RBAC, stale JWT role, recommendation create/duplicate/terminal/access/decision/notification, scorer, allocation create/accept/retry/release, Sprint timeline lock, Task ownership/lifecycle/evidence/assignment.
- `git diff --check`: PASS.
- Secret scan cuối: PASS cho changeset/working tree. Đã quét 395 file tracked/untracked bằng exact-value scan và các pattern high-confidence (private key, AWS/GitHub/Slack/OpenAI token, JWT literal, credential URL, non-placeholder secret trong `.env*`); 0 finding hiện tại. History result/rotation được tách riêng ở mục 8.
- Vite route delivery: `/login`, `/hr/matching`, `/pm/matching`, `/developer/tasks` đều trả HTTP 200 và app root.

FAIL / baseline debt:

- Full Jest cuối cùng: 26 suite fail, 11 pass (37 total); 26 test fail, 39 pass (65 total). Nguyên nhân lặp lại là các scaffold spec cũ không cung cấp repository/service mocks hoặc gặp test-module circular dependency, không phải assertion business mới.
- Full backend ESLint: 2,886 vấn đề (2,828 error, 58 warning), phần lớn formatting/unsafe-any tồn tại rộng khắp codebase.
- Full frontend ESLint baseline trước security fix: 199 vấn đề (191 error, 8 warning), chủ yếu legacy `any`, unused vars và React hook/compiler rules. Không rerun full lint debt; targeted file mới và file security fix đều PASS.

## 7. Database/migration verification

- Static review: PASS. Entity/module registration, FK, enum/column names và index phù hợp; migration chỉ tạo bảng mới; `synchronize` là `false`; `migrationsRun` mặc định `false`.
- Duplicate business rule được bảo vệ bằng transaction + employee row lock; không dùng unique constraint sai với lịch sử status và nullable Sprint.
- Docker client có nhưng Docker daemon không chạy.
- Kết nối MySQL read-only probe kết thúc `ECONNREFUSED`; không xác nhận được database disposable.
- Không chạy migration up/down, không seed, không ghi DB và không đụng shared/production database.
- Kết luận: **DB TEST NOT VERIFIED**. Chưa có bằng chứng migration chạy/rollback thành công hoặc real-MySQL contention pass.

## 8. Security findings

- P0 repository blocker đã đóng: `backend/.env.example` chỉ chứa placeholder; hard-code `INIT_PASSWORD` hiện tại đã bị xóa khỏi frontend; exact local credential scan hiện tại trả 0 match.
- Known remote chỉ có `origin` (40 remote-tracking refs). `git fetch origin --prune` thành công. Exact history scan bao phủ 210 commit reachable từ tất cả refs local/remote đã biết. `INIT_PASSWORD` có trong origin history; hai JWT secret không có match trong Git history. `backend/.env.example` chưa từng chứa ba giá trị local này trong commit reachable.
- Rotation bắt buộc ngoài repository: `INIT_PASSWORD` vì đã có trong origin history; `JWT_SECRET_KEY` vì bị in vào local audit transcript trong một patch-verification error. Không tự rotate production. `JWT_REFRESH_SECRET_KEY` không có bằng chứng lộ; chỉ rotate nếu có bằng chứng chia sẻ ngoài Git hoặc policy yêu cầu rotate cả cặp.
- `backend/.env` không đổi theo checksum, vẫn ignored và không tracked/staged. Generic high-confidence scan trên 395 tracked/untracked file không tìm thấy private key/token/credential URL hay secret `.env*` không-placeholder khác.
- Role guard chạy global và role metadata được kiểm tra trước permission bypass.
- JWT role lấy từ DB hiện tại, tránh token role cũ tiếp tục có quyền.
- PM object-level access vẫn dùng Primary PM/Co-PM; PM list recommendation dùng ownership hiện tại.
- Developer Task query/update buộc `userId` từ JWT trong query, không tin payload.
- DTO whitelist toàn cục đang bật với `forbidNonWhitelisted` và `transform`.
- Recommendation accept không tạo allocation; HR không có endpoint allocation qua recommendation.

## 9. Hạng mục chưa kiểm chứng được

- Migration up/schema/down/up trên MySQL/MariaDB disposable.
- Concurrency thật trên InnoDB, rollback/deadlock/retry dưới request song song; unit tests mock chỉ xác minh lock coverage/order.
- Authenticated API E2E cho HR, PM, Developer và notification/websocket runtime.
- Visual browser E2E: Computer Use helper không kết nối được native pipe sau retry/reset. HTTP route delivery không chứng minh protected workflow.
- Full-suite/full-lint baseline vẫn đỏ; cần quyết định chất lượng repository ở cấp merge gate.
- Đã fetch refs mới nhất nhưng chưa merge/rebase/chạy CI remote; conflict khi sau này đưa integration branch vào `main` vẫn chưa được giải quyết trong vòng này.

## 10. Quyết định push/merge và lý do

### PUSH FEATURE BRANCH: GO

Repository blocker đã được xử lý, không còn exact credential trong tracked/untracked working tree, builds/lint/focused tests/diff check đều PASS và manifest đã được kiểm tra. Rotation là follow-up vận hành bắt buộc cho `INIT_PASSWORD` và `JWT_SECRET_KEY`, nhưng không cần đưa credential mới vào commit và không ngăn push code đã sanitize lên integration branch.

Stage chọn lọc bằng PowerShell, không dùng `git add .`:

```powershell
$files = @(
  'backend/.env.example'
  'backend/migration/1792371600000-AddMatchingRecommendations.ts'
  'backend/package.json'
  'backend/src/app.module.ts'
  'backend/src/decorator/customize.ts'
  'backend/src/modules/auth/guard/jwt-auth.guard.spec.ts'
  'backend/src/modules/auth/guard/jwt-auth.guard.ts'
  'backend/src/modules/auth/strategy/jwt.strategy.spec.ts'
  'backend/src/modules/auth/strategy/jwt.strategy.ts'
  'backend/src/modules/hr-talents/hr-talents.controller.ts'
  'backend/src/modules/matching-recommendations/dto/create-matching-recommendation.dto.ts'
  'backend/src/modules/matching-recommendations/dto/decide-matching-recommendation.dto.ts'
  'backend/src/modules/matching-recommendations/entities/matching-recommendation.entity.ts'
  'backend/src/modules/matching-recommendations/matching-recommendations.controller.ts'
  'backend/src/modules/matching-recommendations/matching-recommendations.module.ts'
  'backend/src/modules/matching-recommendations/matching-recommendations.service.spec.ts'
  'backend/src/modules/matching-recommendations/matching-recommendations.service.ts'
  'backend/src/modules/projects/projects.controller.ts'
  'backend/src/modules/skills/skills.controller.ts'
  'backend/src/modules/skills/skills.service.ts'
  'backend/src/modules/sprints/sprints.controller.ts'
  'backend/src/modules/sprints/sprints.service.ts'
  'backend/src/modules/sprints/sprint-timeline-concurrency.spec.ts'
  'backend/src/modules/task/dto/create-task.dto.ts'
  'backend/src/modules/task/dto/update-my-task-progress.dto.ts'
  'backend/src/modules/task/dto/update-task.dto.ts'
  'backend/src/modules/task/task.controller.ts'
  'backend/src/modules/task/task.module.ts'
  'backend/src/modules/task/task.service.ts'
  'backend/src/modules/task/task-assignment-concurrency.spec.ts'
  'backend/src/modules/task/task-lifecycle-transaction.spec.ts'
  'backend/src/modules/task/task-matching-score.spec.ts'
  'backend/src/modules/task/task-matching-score.ts'
  'backend/src/modules/users/users.service.ts'
  'backend/src/modules/user-sprints/allocation-capacity-concurrency.spec.ts'
  'backend/src/modules/user-sprints/dto/create-user-sprint.dto.ts'
  'backend/src/modules/user-sprints/dto/release-user-sprint.dto.ts'
  'backend/src/modules/user-sprints/dto/update-user-sprint-status.dto.ts'
  'backend/src/modules/user-sprints/sprint-allocation-response.service.ts'
  'backend/src/modules/user-sprints/sprint-allocation-retry.service.ts'
  'backend/src/modules/user-sprints/user-sprints.controller.ts'
  'backend/src/modules/user-sprints/user-sprints.service.ts'
  'backend/src/test-support/api-query-params.ts'
  'docs/matching-completion/01-audit.md'
  'docs/matching-completion/02-implementation.md'
  'docs/matching-completion/03-business-flows.md'
  'docs/matching-completion/04-test-results.md'
  'docs/matching-completion/05-remaining-work.md'
  'docs/matching-completion/06-merge-readiness.md'
  'docs/matching-completion/07-final-pre-push-review.md'
  'frontend/src/App.tsx'
  'frontend/src/api/developerTasks.ts'
  'frontend/src/api/index.tsx'
  'frontend/src/api/matchingRecommendations.ts'
  'frontend/src/common/types/pm.d.ts'
  'frontend/src/components/admin/add-user-modal.tsx'
  'frontend/src/components/dev/sider.tsx'
  'frontend/src/components/hr/sider.tsx'
  'frontend/src/components/pm/sprints/CreateTaskModal.tsx'
  'frontend/src/components/pm/sprints/EditTaskModal.tsx'
  'frontend/src/layout/pm/index.tsx'
  'frontend/src/pages/dev/tasks.tsx'
  'frontend/src/pages/hr/BenchForecast.tsx'
  'frontend/src/pages/hr/MatchingRecommendations.tsx'
  'frontend/src/pages/pm/MatchingRecommendationsPage.tsx'
)

git add -- $files
git diff --cached --name-status
git diff --cached --check
git status --short
```

Trước commit, xác nhận `backend/src/modules/users/users.controller.ts` vẫn hiện ở cột unstaged và không xuất hiện trong `git diff --cached --name-status`. Không dùng plain diff của hai file security trong shared terminal/log vì phần deleted có thể chứa credential lịch sử.

Sau khi tự review danh sách staged:

```powershell
git commit -m "feat(matching): complete secure cross-role matching flow"
git push --set-upstream origin integration/khanh-final
```

### MERGE MAIN: NO-GO

Merge vẫn thiếu migration up/down/up trên DB disposable, real InnoDB concurrency/rollback/deadlock verification, authenticated HR/PM/Developer API/browser E2E và disposition rõ ràng cho full Jest/full lint debt. Diff integration rộng 342 file so với `origin/main` cũng cần CI/review trước merge.

