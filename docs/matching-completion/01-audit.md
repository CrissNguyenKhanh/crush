# Matching audit

Audit date: 2026-10-19. Branch: `integration/khanh-final` at baseline `53249f5`.

| Area | Before | Evidence / finding | Current working-tree state |
|---|---|---|---|
| PM task skill input | BROKEN | Create/Edit Task used `sk-1`…`sk-5`; database uses UUID | Implemented against live skill catalog; API validates UUID and existence |
| Matching score | PARTIAL | Equal-count score ignored `weight`; labels could expose UUID | Weighted, level-aware pure scorer with unit tests |
| Allocation capacity | PARTIAL | Duplicate/capacity checks ran before an unlocked save | Create, accept and retry now run in DB transactions with a per-user pessimistic lock |
| Developer task workflow | MISSING | Developer saw projects/sprints, but had no owned-task API/UI | Owned list/detail/progress API and `/developer/tasks` UI implemented |
| HR Talent/Skill Matrix/Bench APIs | COMPLETE | Existing services query users, skills, evidences and reviews | Reused; no duplicate implementation |
| `/hr/bench` page | BROKEN | Separate page contained five hardcoded people and non-functional buttons | Replaced by existing database-backed Bench Readiness view |
| HR → PM recommendation | MISSING | No persisted hand-off between HR discovery and PM allocation | Entity, additive migration, role-scoped API, HR UI, PM UI and notifications implemented |
| Cross-role updates | PARTIAL | Allocation invitation/reply and PM realtime already existed | Preserved; Developer task progress uses existing PM task-change event |
| Existing global RBAC | PARTIAL | Many legacy controllers use `@SkipCheckPermission`; initializer/permission catalog remains broad/incomplete | New recommendation and Developer Task endpoints use explicit role metadata plus ownership checks |

## HR branch comparison

`origin/feat/hr-skill-supply-risk` adds Skill Supply Risk scoring/UI and refactors HR API types. It diverges from the integration branch by 21 files and was not merged or cherry-picked. The current branch already contains Skill Supply Summary, Skill Matrix and Bench Readiness; blindly importing the remote branch would duplicate/refactor working code beyond this task.

## Protected pre-existing changes

`backend/.env.example` and formatting-only changes in `backend/src/modules/users/users.controller.ts` existed before this implementation and were not discarded or overwritten.
