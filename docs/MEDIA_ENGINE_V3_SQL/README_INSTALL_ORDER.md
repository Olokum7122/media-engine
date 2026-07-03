# ATLX MEDIA ENGINE V3 - SQL INSTALL SPLIT

Objetivo: instalar el DDL V3 acordado sin cambiar arquitectura, tablas, campos, estados ni contratos.

Base objetivo: `ATLX_MediaEngine`  
Schema: `me`  
SQL Server: 2022 Express compatible  
Reglas:
- Sin `GO`.
- Idempotente.
- Ejecutar en SSMS archivo por archivo.
- Si un archivo falla, detenerse y reportar el error antes de continuar.

## Orden de ejecucion

1. `00_CREATE_DATABASE.sql`
2. `01_CREATE_SCHEMA.sql`
3. `02_CATALOGS.sql`
4. `03_TABLES.sql`
5. `04_INDEXES.sql`
6. `05_SEED.sql`
7. `06_VIEWS.sql`
8. `07_PROCEDURES_CORE.sql`
9. `08_PROCEDURES_RIGHTS.sql`
10. `09_PROCEDURES_WORKER.sql`
11. `10_VALIDATE_INSTALL.sql`

## Importante

Estos scripts no redisenan el motor. Solo separan el DDL V3 para que puedas ejecutarlo en Contabo sin depender de un archivo gigante.

Si ya creaste la base manualmente en SSMS, el archivo 00 no la borra ni la modifica agresivamente; solo la crea si no existe y luego selecciona contexto.
