# Plan de Implementación: NestJS Study Platform

## Estado Actual

- **Fase 1**: ✅ Completa — Scaffolding Next.js, UI, catálogo de 15 ejercicios, build exitoso.
- **Fase 2**: ✅ Completa — Motor WebContainer, Jest, NestJS server, endpoint tester, auto-`markSolved`.
- **Fase 3**: ✅ Completa — `ExerciseStatement` integrado (badge + objetivos; las pistas viven en el panel del header) y `CommandPalette` montado con ejecutar tests, ver solución e ir a ejercicio.
- **Fase 4**: ✅ Completa — Tests ocultos reales en `src/data/hidden-tests.ts`, referenciados desde `track.ts`. `demoTests` eliminado. `markSolved` se dispara solo si esos tests pasan.
- **Fase 5**: ✅ Completa — Taller de cine (2 ejercicios), `solutionFiles` cargados en el editor, modo claro y nota de recarga del WebContainer. La UI de objetivos se quitó para dejar el editor a pantalla casi completa.

---

## Fase 3 — Cierre Pendiente

### 3A. CommandPalette ⌘K — Renderizado y acciones reales
- [x] Renderizar `CommandPalette` en `ExerciseWorkspace.tsx` (actualmente importado pero no aparece en JSX).
- [x] Implementar acciones del palette:
    - `ejecutar tests` → llamar al runner `runTests`.
    - `ver solución` → cargar `solutionFiles` del ejercicio.
    - `ir a ejercicio` → navegar a `/exercise/[id]`.
- [x] Remover estado `commandPaletteOpen`/`commandPaletteActions` si no se implementa, o conectarlo plenamente.

### 3B. ExerciseStatement — Verificar integración
- [x] Confirmar que `ExerciseStatement` está renderizado arriba del bloque de objectives en `ExerciseWorkspace.tsx`.
- [x] Revisar que el badge de dificultad y las hints funcionan correctamente.

---

## Fase 4 — Tests Ocultos y Auto-MarkSolved

### 4A. Limpiar y Arreglar `track.ts`
- [x] **Quitar tests placeholder duplicados** en los 14 ejercicios (hoy todos tienen el mismo par `customer.entity.spec.ts` + `orders.service.spec.ts` con imports rotos).
- [x] **Añadir `language: "typescript"`** a cada entry de `tests` (causa los 32 errors TS actuales).
- [x] Revisar que `exercise.tests` no se pise con `demoTests[exercise.id]` en `resolveProjectFiles`/`hiddenTestPaths` (actualmente: `demo ?? own` — decidir si se elimina `demoTests` de `template.ts` o se mantiene como fallback).

### 4B. Escribir Tests Reales por Ejercicio

Hecho en [`src/data/hidden-tests.ts`](src/data/hidden-tests.ts). Cada ejercicio valida solo la habilidad de la tabla:

| Ejercicio | Habilidad a Validar | Archivo de Test (ejemplo) |
|-----------|--------------------|---------------------------|
| `entidades-1` | Estructura de `CustomerEntity` (id, name, email) | `src/customers/entities/customer.entity.spec.ts` |
| `entidades-2` | Estructura de `OrderEntity` y relaciones | `src/orders/entities/order.entity.spec.ts` |
| `entidades-3` | `@OneToMany` configurado correctamente | `src/orders/entities/order.entity.spec.ts` (relación) |
| `repositorios-1` | `create()` con validación de cliente | `src/orders/orders.service.spec.ts` |
| `repositorios-2` | `findAll` con relaciones, `findOne` con 404 | Ya tiene `demoTests["repositorios-2"]` — migrar a `track.ts`. |
| `repositorios-3` | `update` con `merge()`, `remove()` con 404 | `src/orders/orders.service.spec.ts` (merge/remove) |
| `servicios-1` | Inyección de `OrdersService` en otro servicio | `src/orders/orders.service.spec.ts` (injección) |
| `servicios-2` | `markAsReady` con excepciones BadRequest/Conflict | `src/orders/orders.service.spec.ts` (rules) |
| `servicios-3` | `findRecentPending` / `countPending` | `src/orders/orders.service.spec.ts` (queries) |
| `pipes-1` | `ValidationPipe` en create-order dto | `src/orders/orders.controller.spec.ts` (validación) |
| `pipes-2` | `ValidationPipe` en controller | `src/orders/orders.controller.spec.ts` (validación) |
| `pipes-3` | `FilterOrdersQueryDto` con search + limit | `src/orders/orders.controller.spec.ts` (filtros) |
| `pruebas-1` | El ejercicio IS el spec file | Test de compatibilidad con el spec del ejercicio. |
| `pruebas-2` | Mocks para error / creación | `src/orders/orders.service.spec.ts` (mocks) |
| `pruebas-3` | Coordinación `markAsReady` con `OrderRulesService` | `src/orders/orders.service.spec.ts` (coordinación) |

### 4C. Migrar `demoTests` de `template.ts` → `track.ts`
- [x] Mover la definición de `demoTests` actual (solo `repositorios-2`) al campo `tests` del ejercicio correspondiente en `track.ts`.
- [x] Opcional: borrar `demoTests` de `template.ts` una vez migrado todo, para que `resolveProjectFiles` use únicamente `exercise.tests`.

### 4D. Verificar Auto-MarkSolved
- [x] Probar el flujo: completar TODOs en `repositorios-2` → pulsa **Ejecutar tests** → todos pasan → ejercicio se marca resuelto en el sidebar (localStorage).
- [x] Confirmar que `hadHiddenTests` + `markSolved` solo se dispara cuando hay tests ocultos y todos pasan.

---

## Fase 5 — Contenido Integrador y Pulido

### 5A. Módulo Integrador (Taller / Parcial)
- [x] Diseñar un ejercicio final tipo "taller" o "parcial" (p. ej., Room-Screening: un cine con proyecciones, entradas, asientos).
- [x] Definir `solutionFiles` para este ejercicio (lo que el usuario vería al hacer "Ver solución").
- [x] Añadir 1-2 ejercicios más al track (para llegar a un número redondo, p. ej., 16 o 18 total).

### 5B. Toggle Light/Dark Mode
- [x] Añadir contexto de tema (ThemeContext o `next-themes`) al app shell.
- [x] Botón de toggle en el header/sidebar.
- [x] Ajustar tokens de Tailwind v4 (`@theme.colorScheme`) para que ambos modos se vean bien.

### 5C. `solutionFiles` por Ejercicio
- [x] Llenar `solutionFiles` en `track.ts` para cada ejercicio (códigos completos sin TODOs).
- [x] Implementar la acción "Ver solución" en el workspace para reemplazar los archivos editoriales con la solución.

### 5D. Lighthouse / Performance
- [x] Verificar que los Core Web Vitals son aceptables en modo oscuro.
- [x] Revisar que el WebContainer no persiste recargas (documentado) y el flujo de usuario lo contempla.

---

## Definición de Hecho (Done Definition)

- [ ] `npm run build` pasa limpio (0 errors TS).
- [ ] `npm run dev` arranca sin errores de consola críticos (solo warnings menores).
- [ ] Home page carga sin `Maximum update depth exceeded`.
- [ ] Probar al menos 3 ejercicios distintos (1 de cada bloque: entidades, repositorios, servicios) con el flujo completo: editar → Ejecutar tests → tests pasan → markSolved en sidebar.
- [ ] CommandPalette renderizado y funcional (⌘K / Ctrl+K).
- [ ] Light mode toggle operativo (si se decide incluir en la Fase 5).
- [ ] Documentación mínima en `AGENTS.md` actualizada con el estado actual.

---

## Orden de Ejecución Recomendado

1. **Fase 3 → 3A**: Arreglar `CommandPalette` renderizado (bloquea acceso rápido).
2. **Fase 3 → 3B**: Confirmar `ExerciseStatement` integrado.
3. **Fase 4 → 4A**: Arreglar `track.ts` — quitar tests placeholder + añadir `language: "typescript"` (desbloquea build).
4. **Fase 4 → 4B**: Escribir tests reales por ejercicio (validación por comportamiento).
5. **Fase 4 → 4C**: Migrar `demoTests` → `track.ts`, limpiar `template.ts`.
6. **Fase 4 → 4D**: Probar auto-`markSolved` en al menos 2 ejercicios.
7. **Fase 5 → 5A**: Ejercicio integrador + `solutionFiles`.
8. **Fase 5 → 5B**: Toggle light mode.
9. **Fase 5 → 5C**: Revisión final + build + dev limpios.

--- 

*Última actualización: Mon Oct 12 2026 — Fases 1 a 5 cerradas. El editor ocupa el alto principal; los objetivos ya no tienen panel propio.*