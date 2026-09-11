# KEP-AEN — Clean Rebuild

This directory is the clean replacement for the current layered frontend.

## Phase 1
- One HTML entry point
- One stylesheet
- One application module
- NAT-style sea-service calculation preserved
- No iframes
- No patch/repair scripts
- No duplicate examination UI
- No browser-local examiner management in the candidate flow

## Phase 2
Supabase will provide:
- Auth
- shared PostgreSQL data
- profiles and roles (`admin`, `teacher`)
- RLS
- examinations and service trips
- immutable audit log

## Data model
- `profiles`
- `examinations`
- `service_trips`
- `audit_log`

## Security rule
The browser must never contain a Supabase service-role/secret key. Only the public client key is used in the frontend; authorization is enforced by Supabase Auth + RLS.

## Migration rule
The existing production frontend is not modified by this branch. The backup branch `backup/pre-supabase-rebuild-2026-09-11` preserves the current production state.
