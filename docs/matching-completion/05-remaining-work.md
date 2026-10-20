# Remaining work

## P0 — required before merge

1. Start a disposable/local MariaDB test instance and apply `1792371600000-AddMatchingRecommendations`.
2. Execute authenticated API tests for HR create/list, PM list/accept/reject, Developer owned Task list/update and cross-user 403/404 behavior.
3. Run concurrent allocation create/accept/retry tests against MySQL to prove the pessimistic lock under real contention.
4. Review and stage only intended files; keep the pre-existing `.env.example` and `users.controller.ts` edits separate.

## P1 — repository quality debt

- Repair legacy Nest unit specs by providing repository/service mocks. Current full suite fails after imports are successfully resolved.
- Audit and reduce legacy `@SkipCheckPermission` usage and rebuild the permission initializer/catalog. New endpoints are role/ownership protected, but global legacy RBAC is not fully hardened.
- Add an internal transition from recommendation `ACCEPTED` to `ALLOCATED` only after a real allocation exists; do not expose a manual false-positive state.

## P2 — optional product follow-up

- Review `origin/feat/hr-skill-supply-risk` separately and port only the risk scorer/UI after resolving its large HR API refactor.
- Add socket-specific recommendation events if notification-driven refresh is not sufficient after user testing.
- Code-split the frontend bundle (current production chunk warning is about a ~2.48 MB JS chunk).
