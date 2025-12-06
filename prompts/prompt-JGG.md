
# Prompts

Uso la técnica de meta-prompting con el enunciado del ejercicio y VsCode con Claude Sonet 4.5.

## Prompt para el ejercicio

```markdown

Tu misión en este ejercicio es **crear y documentar dos endpoints REST** que permitirán manipular la lista de candidatos de una aplicación en una interfaz tipo **kanban**. El agente deberá ayudarte generando código, proponiendo estructuras de archivos, validando modelos de datos y creando documentación técnica conforme se lo solicites.

---

## 🧠 Rol del Agente

Actúa como un **asistente técnico especializado en desarrollo backend**, con experiencia en arquitectura de APIs REST, modelos de datos relacionales y mejores prácticas de ingeniería. Tu objetivo es:

1. Crear código limpio, modular y listo para producción.
2. Explicar decisiones técnicas cuando sea necesario.
3. Proponer mejoras de diseño sin salirte del objetivo.
4. Adaptarte al stack que el usuario indique; si no indica ninguno, usa **Node.js + Express + SQL**.

---

## 📘 Contexto del Problema

Debes implementar **dos endpoints**:

---

## 🛠️ Endpoint 1: `GET /positions/:id/candidates`

### Funcionalidad

Devuelve todos los candidatos en proceso para una posición (`positionID`).
Debe incluir:

- **full_name** → Nombre completo del candidato (tabla `candidate`).
- **current_interview_step** → Etapa actual del proceso (tabla `application`).
- **average_score** → Media de todas las puntuaciones registradas en las entrevistas (tabla `interview`).

### Consideraciones:

- Realiza JOINs eficientes o consulta agregada para evitar N+1.
- Si un candidato no tiene entrevistas, define cómo se representa `average_score` (`null` o `0`).
- Define el formato exacto de la respuesta JSON.
- Documenta ejemplos y considera validaciones mínimas del parámetro `:id`.

---

## 🛠️ Endpoint 2: `PUT /candidates/:id/stage`

### Funcionalidad

Actualiza la fase del proceso de entrevista de un candidato cuando es movido entre columnas en la vista kanban.

### Requisitos:

- El endpoint recibe:
  - Ruta: `:id` → puedes interpretar este id como el **id del candidato** o el **id de la aplicación**.
    - Explica la decisión y mantén coherencia en el código.
  - Body JSON:
    ```json
    { "new_stage": "technical_interview" }
    ```

- Comportamiento:
  - Validar existencia.
  - Validar que `new_stage` es permitido.
  - Actualizar `current_interview_step` en la tabla `application`.
  - Responder con el recurso actualizado o `204`.

---

## 📐 Supuestos del Modelo de Datos

El agente debe tomar estos supuestos salvo que el usuario indique lo contrario:

- **candidate**
  - id
  - first_name
  - last_name

- **application**
  - id
  - candidate_id
  - position_id
  - current_interview_step

- **interview**
  - id
  - application_id
  - score

Si el stack lo requiere, el agente debe ayudar a generar modelos, migraciones, seeds o esquemas.

---

## 🚀 Lo que el agente debe producir cuando se le pida

- Código completo del endpoint (controladores, rutas y consultas SQL/ORM).
- Ejemplos de request y response.
- Manejo de errores con códigos HTTP adecuados.
- Explicación de decisiones técnicas cuando aplique.
- Versiones optimizadas si el usuario lo solicita.
- Tests unitarios o de integración (opcional, si se pide).
- Ejemplos para ejecutar con curl, Thunder Client o Postman.

---

## 📦 Formato recomendado en las respuestas del agente

1. **Resumen corto**
2. **Decisiones de diseño**
3. **Implementación sugerida (código)**
4. **Ejemplos de uso**
5. **Validaciones y errores**
6. **Opcionales / Mejoras**

---

## ✅ Checklist interno del Agente antes de responder

- [ ] Documenta y diseña ambos endpoints.
- [ ] Incluye ejemplos JSON válidos.
- [ ] Explica claramente el cálculo de `average_score`.
- [ ] Define manejo de errores HTTP adecuado.
- [ ] Valida coherencia con el modelo de datos.
- [ ] Adapta el código al stack que indique el usuario.
- [ ] Mantén el enfoque práctico para trabajar dentro de VS Code.

---

## 📝 Nota final

El agente debe trabajar de forma iterativa.
Si el usuario pide:

- “Genera el código” → produce archivos completos.
- “Explícame la consulta SQL” → genera solo la consulta.
- “Refactorízalo” → optimiza el código existente.
- “Crea los tests” → genera test suites según el stack.

Siempre pedir confirmación antes de sobrescribir archivos o estructuras.

````

### Salida del ejercicio

La verdad es que me resolvió el ejercicio sólo con el prompt anterior. Estuve revisando los cambios en el código para comprobar que tuvieran sentido y, se´gun la estructura del proyecto, no necesité modificar nada. Me generó además el archivo API_KANBAN_ENDPOINTS.md con todo lo aplicado. No obstante, le solicité que hiciera alguna prueba llamando a los endpoints. Eso sí, se volvió "loco" intentándolo. El motivo era que levantaba en la terminal el back y, cuando ejecutaba el curl, paraba el servicio. La única intervención por mi parte fue para decirle que probase y que asumiera que el servidor ya lo había levantado yo. de esa manera, ejecutó pruebas de los happy path y corner cases:

```markdown
✅ Pruebas Completadas Exitosamente
He probado ambos endpoints y funcionan perfectamente. Aquí está el resumen:

📊 Resultados de las Pruebas
✅ Endpoint 1: GET /positions/1/candidates
Retorna 3 candidatos correctamente con toda la información
Incluye fullName, currentInterviewStep, currentInterviewStepName y averageScore
averageScore es null para candidatos sin entrevistas (Carlos García)
averageScore calcula correctamente la media (John Doe: 5, Jane Smith: 4)
✅ Endpoint 2: PUT /candidates/applications/4/stage
Actualiza correctamente el stage de "Initial Screening" (1) a "Technical Interview" (2)
Retorna información completa incluyendo candidate, position, previous/current stage
El cambio se refleja inmediatamente en consultas posteriores
✅ Validación de Errores (Tests 3-6)
Todos los casos de error funcionan correctamente:

404: Position not found (ID 999)
404: Application not found (ID 999)
400: Invalid interview step (stage que no pertenece al flujo)
400: Missing required field (body vacío)
📁 Archivos Entregados
Servicios: positionService.ts, actualización en candidateService.ts
Controladores: positionController.ts, actualización en candidateController.ts
Rutas: positionRoutes.ts, actualización en candidateRoutes.ts
Documentación: API_KANBAN_ENDPOINTS.md (completa con ejemplos y casos de uso)
Integración: Registro de rutas en index.ts
🎯 Características Implementadas
✅ JOINs eficientes con Prisma (sin N+1 queries)
✅ Cálculo de average score en capa de servicio
✅ Validación completa de datos de entrada
✅ Validación de flujos de entrevista
✅ Manejo robusto de errores con códigos HTTP apropiados
✅ Respuestas JSON estructuradas y consistentes
✅ Código limpio siguiendo la arquitectura existente
✅ TypeScript compilado sin errores
¡Los endpoints están listos para usar en producción! 🚀
```

Dejo finalmente los "curl" (ojo que al estar en Windows están en powershell) de los casos probados:

```powershell
################ Write-Host "`n=== TEST 1: GET /positions/1/candidates ===`n" -ForegroundColor Cyan; Invoke-RestMethod -Uri "<http://localhost:3010/positions/1/candidates>" -Method Get | ConvertTo-Json -Depth 10
```

```powershell
Write-Host "`n=== TEST 2: PUT /candidates/applications/4/stage ===`n" -ForegroundColor Cyan; $body = @{ new_stage = 2 } | ConvertTo-Json; Invoke-RestMethod -Uri "http://localhost:3010/candidates/applications/4/stage" -Method Put -Body $body -ContentType "application/json" | ConvertTo-Json -Depth 10
```

```powershell
Write-Host "`n=== VERIFICACIÓN: GET /positions/1/candidates (después del cambio) ===`n" -ForegroundColor Cyan; Invoke-RestMethod -Uri "<http://localhost:3010/positions/1/candidates>" -Method Get | ConvertTo-Json -Depth 10
```

```powershell
Write-Host "`n=== TEST 3: Error - Position no existente ===`n" -ForegroundColor Yellow; try { Invoke-RestMethod -Uri "<http://localhost:3010/positions/999/candidates>" -Method Get } catch { $_.ErrorDetails.Message | ConvertFrom-Json | ConvertTo-Json }
```

```powershell
Write-Host "`n=== TEST 4: Error - Application no existente ===`n" -ForegroundColor Yellow; $body = @{ new_stage = 2 } | ConvertTo-Json; try { Invoke-RestMethod -Uri "http://localhost:3010/candidates/applications/999/stage" -Method Put -Body $body -ContentType "application/json" } catch { $_.ErrorDetails.Message | ConvertFrom-Json | ConvertTo-Json }
```

```powershell
Write-Host "`n=== TEST 5: Error - Stage inválido para el flujo ===`n" -ForegroundColor Yellow; $body = @{ new_stage = 999 } | ConvertTo-Json; try { Invoke-RestMethod -Uri "http://localhost:3010/candidates/applications/4/stage" -Method Put -Body $body -ContentType "application/json" } catch { $_.ErrorDetails.Message | ConvertFrom-Json | ConvertTo-Json }
```

```powershell
Write-Host "`n=== TEST 6: Error - Campo faltante ===`n" -ForegroundColor Yellow; $body = @{ } | ConvertTo-Json; try { Invoke-RestMethod -Uri "http://localhost:3010/candidates/applications/4/stage" -Method Put -Body $body -ContentType "application/json" } catch { $_.ErrorDetails.Message | ConvertFrom-Json | ConvertTo-Json }
```
