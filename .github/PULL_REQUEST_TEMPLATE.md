## What changed

<!-- A short description of the change. What does this do, and why? -->

## Related issue

<!-- e.g. Closes #12 — or "None" -->

## Type of change

- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (existing behaviour changes)
- [ ] Documentation
- [ ] Refactor / chore (no behaviour change)

## How it was verified

<!-- The steps you actually took. Screenshots or a short clip are welcome for UI changes. -->

## Checklist

- [ ] `vendor/bin/pint --test` passes
- [ ] `php artisan test` passes
- [ ] `npm run lint` passes
- [ ] `npm run typecheck` passes
- [ ] `npm run build` succeeds
- [ ] Tests added or updated for the new behaviour
- [ ] Ownership-sensitive endpoints have negative tests (non-owner gets `403`)
- [ ] `src/types.ts` updated if an API resource changed
- [ ] Checked at both mobile and desktop breakpoints (UI changes)
- [ ] Documentation in `docs/` updated if behaviour or the API changed
