# Business flows and authorization

## HR → PM → Developer

1. HR searches the real Talent/Bench/Skill data.
2. HR creates a recommendation for a Developer and Project, optionally a Sprint and focus skill.
3. The Primary PM receives a notification; Primary/Co-PM can view the recommendation.
4. PM accepts or rejects with a note. HR receives the result.
5. Acceptance is advisory. PM creates the real allocation through the existing allocation flow.
6. PM submits the allocation; Developer receives the existing invitation.
7. Developer accepts/declines. Capacity is rechecked under a per-user DB lock.
8. PM assigns a Task. Developer sees only owned Tasks and updates progress.
9. Existing Task realtime events refresh PM-facing state.
10. Release continues through the existing review/capacity workflow.

## Matrix

| Action | ADMIN | HR | PM | DEVELOPER |
|---|---:|---:|---:|---:|
| Search HR Talent/Bench | existing policy | Yes | No | No |
| Create recommendation | No | Yes | No | No |
| View HR-created recommendations | No | Own | Managed Projects | No |
| Decide recommendation | No | No | Managed Projects | No |
| Create allocation | No | No | Managed Sprint | No |
| Respond to invitation | No | No | No | Own invitation |
| View/update Task progress | No | No | PM workflow | Own Task only |

New role checks are enforced in `JwtAuthGuard` through `@Roles`. Existing PM endpoints retain Project/Sprint/Task ownership enforcement through `PmAccessService`.

## Assumptions

- HR recommends but never performs final allocation.
- PM acceptance means “reviewed/accepted as a candidate,” not “allocated.”
- Developer may update status/progress, but not assignee, timeline, priority or required skills through the Developer API.
