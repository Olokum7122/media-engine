# Explorer Strict Development Contract V1

## 1. Reglas absolutas

1. Ninguna feature sin spec.
2. Ningun endpoint sin contrato.
3. Ninguna mutacion sin SP.
4. Ningun mapper passthrough.
5. Ningun componente con fetch directo.
6. Ninguna ruta sin metadata.
7. Ninguna publicacion sin preset.
8. Ningun render sin quality state.
9. Ninguna conexion directa a Antojados DB.
10. Ningun procesamiento pesado duplicado fuera de EngineShared.

## 2. Definition of Done

Una feature queda terminada cuando tiene:

- DB tabla/SP si aplica.
- API route.
- Service.
- Mapper.
- Resolver.
- Tests o script de verificacion.
- Client service.
- Composable si la UI lo necesita.
- Pantalla/componente.
- Metadata de navegacion.
- Estados de loading/error/empty.
- Contrato actualizado.

## 3. Checklist endpoint

- Path versionado.
- Request documentado.
- Response documentado.
- Errores documentados.
- SP definido.
- Mapper definido.
- Auth/permission definido.
- Tenant/instance requerido.

## 4. Checklist UI

- Usa components base.
- No hardcodea tabs.
- No usa fetch directo.
- Maneja loading.
- Maneja error.
- Maneja empty state.
- Respeta permisos.
- Respeta plan limits.
- Probada en desktop y mobile viewport.

## 5. Checklist media

- Upload session.
- Asset registered.
- Quality report.
- Preset seleccionado.
- Render job.
- Render ready.
- Publication/export.

## 6. Orden recomendado de implementacion

1. DB `ATLX_EXPLORER_APP`.
2. SPs core.
3. Explorer API shell.
4. Auth/tenant/instance.
5. Projects.
6. EngineShared client.
7. Upload/render flow.
8. Web shell.
9. Capacitor shell.
10. Antojados connector.
11. Billing/limits.

