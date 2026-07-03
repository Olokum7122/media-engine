# 08 - GUARDRAILS FOR CODEX

## Mandatory Instruction

Before any task, Codex must read this package and respond:

```text
ARCHIVOS LEIDOS:
DIAGNOSTICO:
CAMBIOS PROPUESTOS:
RIESGOS:
CONFIRMACION DE CONTRATO:
```

## Absolute Prohibitions

Codex must not:

- Redesign architecture.
- Add tenants to Media Engine.
- Add post/feed/ranking logic to Media Engine.
- Rename tables, columns, SPs, statuses, variants.
- Use direct frontend access to tables.
- Add fallback to original raw media.
- Remove external watermarks.
- Double-watermark external media by default.
- Allow downloads for demo/external content by default.
- Mark media ready without required variants.
- Process heavy final videos in Android/iOS public app.
- Save `content://` as final URL.
- Modify more than 3 files without approval.
- Create new files unless requested.

## Patch Rule

Every implementation must be surgical.

If a change needs a refactor, Codex must stop and ask.

## SQL Rule

All SQL must be:
- idempotent;
- no GO;
- SSMS-compatible;
- schema `me`;
- using `EXEC('CREATE OR ALTER PROCEDURE...')` for SPs.

## API Rule

API must call SPs. No hidden parallel contract.

## UI Rule

UI consumes only ready payloads.
