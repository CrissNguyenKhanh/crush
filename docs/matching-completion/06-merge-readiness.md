# Merge readiness

Status: **NOT READY TO MERGE**.

## Ready for code review

- Real skill catalog integration and backend skill validation.
- Weighted matching scorer and tests.
- Transaction/lock changes for allocation create, accept and retry.
- Focused unit tests for all three allocation transaction/lock paths.
- Focused `@Roles` guard allow/deny tests.
- Developer owned-task API/UI.
- Database-backed Bench page.
- HR recommendation entity/API/UI and PM response UI.
- Jest alias/ESM test configuration improvement.

## Blocking evidence still required

- The local database was unavailable on `localhost:3306`, so the new migration and real APIs were not executed.
- Concurrency behavior is implemented but not proven against MySQL.
- Full backend Jest remains red because legacy specs do not construct services with required providers.
- Authenticated browser workflows were not exercised.

## Git safety

- No commit created.
- No remote push.
- No merge/cherry-pick.
- No database writes or destructive commands.
