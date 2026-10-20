# Matching implementation

## PM matching foundation

- Added validated `CreateTaskDto`; required skill IDs must be UUIDs.
- Added a global, read-only skill catalog endpoint and connected both Task forms to it.
- Task create/update rejects duplicate, deleted or unknown skill IDs.
- Candidate score now uses requirement weight and proportional level fit; the response exposes human-readable skill names.
- Allocation create, Developer accept and PM retry serialize on the employee row inside a TypeORM transaction.
- Added focused transaction/lock tests for allocation create, accept and retry.

## Developer task workflow

- `GET /api/v1/tasks/my`
- `GET /api/v1/tasks/my/:taskId`
- `PATCH /api/v1/tasks/my/:taskId/progress`
- `/developer/tasks` provides owned Task list, deadline, status and progress editing.
- Direct UUID access is constrained by `userId` ownership and the `DEVELOPER` role.
- Empty updates are rejected; updates reuse existing dependency, sprint mutability, status/progress consistency, XP/evidence and PM realtime logic.

## HR matching integration

- Added `matching_recommendations` entity and additive migration.
- HR can load real Projects/Sprints, Developers and skills, then persist a recommendation.
- Recommendation targets are restricted to active Projects with a Primary PM.
- Duplicate recommendations for the same employee/project/sprint are rejected while an earlier recommendation is proposed or accepted.
- PM sees recommendations only for Projects they manage and can accept/reject them.
- Both directions create persistent/realtime notifications.
- Accepting a recommendation deliberately does not create an allocation; PM continues through the existing capacity-safe allocation/invitation flow.
- Replaced the hardcoded Bench Forecast page with the real Bench Readiness component/API.

## Main files

- `backend/src/modules/matching-recommendations/**`
- `backend/migration/1792371600000-AddMatchingRecommendations.ts`
- `backend/src/modules/task/**`
- `backend/src/modules/user-sprints/*.service.ts`
- `frontend/src/pages/hr/MatchingRecommendations.tsx`
- `frontend/src/pages/pm/MatchingRecommendationsPage.tsx`
- `frontend/src/pages/dev/tasks.tsx`
- `frontend/src/components/pm/sprints/{CreateTaskModal,EditTaskModal}.tsx`
