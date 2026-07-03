# Media Engine — Documentación Oficial

## 📁 Estructura

```
docs/
├── README.md                    ← Este archivo
├── MEDIA_ENGINE_V3/             ← Specs y contratos de Media Engine V3
│   ├── 00_README.md
│   ├── 01_ARCHITECTURE_SPEC.md
│   ├── 02_DATA_MODEL_SPEC.md
│   ├── 03_PROCESSING_PIPELINE_SPEC.md
│   ├── 04_RIGHTS_ORIGIN_POLICY_SPEC.md
│   ├── 05_CLIENT_CONSUMPTION_SPEC.md
│   ├── 06_API_CONTRACT.md
│   ├── 07_DATABASE_CONTRACT.md
│   ├── 08_GUARDRAILS_FOR_CODEX.md
│   ├── 09_DEVELOPER_CHECKLIST.md
│   ├── 10_CHANGELOG.md
│   └── diagrams/
│       ├── pipeline.md
│       ├── processing_flow.md
│       └── state_machine.md
└── MEDIA_ENGINE_V3_SQL/         ← Scripts SQL de instalación
    ├── 00_CREATE_DATABASE.sql
    ├── 01_CREATE_SCHEMA.sql
    ├── 02_CATALOGS.sql
    ├── 03_TABLES.sql
    ├── 04_INDEXES.sql
    ├── 05_SEED.sql
    ├── 06_VIEWS.sql
    ├── 07_PROCEDURES_CORE.sql
    ├── 08_PROCEDURES_RIGHTS.sql
    ├── 09_PROCEDURES_WORKER.sql
    ├── 10_VALIDATE_INSTALL.sql
    └── README_INSTALL_ORDER.md
```

## 📋 Documentos por categoría

### Specs (especificaciones técnicas)
| Doc | Descripción |
|---|---|
| `MEDIA_ENGINE_V3/01_ARCHITECTURE_SPEC.md` | Arquitectura del sistema |
| `MEDIA_ENGINE_V3/02_DATA_MODEL_SPEC.md` | Modelo de datos |
| `MEDIA_ENGINE_V3/03_PROCESSING_PIPELINE_SPEC.md` | Pipeline de procesamiento multimedia |
| `MEDIA_ENGINE_V3/04_RIGHTS_ORIGIN_POLICY_SPEC.md` | Política de derechos y origen |
| `MEDIA_ENGINE_V3/05_CLIENT_CONSUMPTION_SPEC.md` | Consumo desde clientes |

### Contracts (contratos de interfaz)
| Doc | Descripción |
|---|---|
| `MEDIA_ENGINE_V3/06_API_CONTRACT.md` | Contrato de API REST |
| `MEDIA_ENGINE_V3/07_DATABASE_CONTRACT.md` | Contrato de base de datos |

### Operativos
| Doc | Descripción |
|---|---|
| `MEDIA_ENGINE_V3/08_GUARDRAILS_FOR_CODEX.md` | Reglas guardrail para desarrollo |
| `MEDIA_ENGINE_V3/09_DEVELOPER_CHECKLIST.md` | Checklist de desarrollo |
| `MEDIA_ENGINE_V3/10_CHANGELOG.md` | Historial de cambios |

### Diagramas
| Doc | Descripción |
|---|---|
| `MEDIA_ENGINE_V3/diagrams/pipeline.md` | Diagrama del pipeline |
| `MEDIA_ENGINE_V3/diagrams/processing_flow.md` | Diagrama de flujo de procesamiento |
| `MEDIA_ENGINE_V3/diagrams/state_machine.md` | Diagrama de máquina de estados |

---

> **Nota:** Los contratos de integración con Explorer App se encuentran en  
> `explorer-app/docs/EXPLORER_APP_V1/api-contracts/`
