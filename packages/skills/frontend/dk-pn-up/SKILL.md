---
name: dk-pn-up
description: Actualiza la versión de pnpm usada en este repo (packageManager, engines.pnpm, volta.pnpm en package.json), corre "pnpm i" y maneja los errores ERR_PNPM_TRUST_DOWNGRADE (verifica falso positivo antes de agregar a trustPolicyExclude) y ERR_PNPM_IGNORED_BUILDS (verifica que el paquete sea seguro antes de agregarlo a allowBuilds) en pnpm-workspace.yaml.
user-invocable: true
metadata:
  version: '0.0.1'
---

# Skill: bump-pnpm

## Flujo de ejecución

**Versión objetivo: `11.26.0`** (usa este valor fijo salvo que el usuario indique otra versión explícitamente).

**Alcance:** únicamente `packageManager`, `engines.pnpm` y `volta.pnpm` en `package.json`. No actualizar otras dependencias ni claves de configuración existentes en `pnpm-workspace.yaml`.

### Paso 1: Instalación limpia

```bash
rm -rf node_modules pnpm-lock.yaml
```

### Paso 2: Asegurar `pnpm-workspace.yaml`

Verifica que exista con estas claves de nivel raíz. Si no existe, créalo. Si existe, solo agrega las que falten:

```yaml
blockExoticSubdeps: true
ignoreScripts: true
trustPolicy: no-downgrade
minimumReleaseAge: 2880
minimumReleaseAgeExclude:
  - '@rodbe/*'
```

Preserva entradas existentes como `trustPolicyExclude` o `allowBuilds`.

### Paso 3: Actualizar `package.json`

```json
"packageManager": "pnpm@11.26.0"
"engines": { "pnpm": ">= 11.26.0" }
"volta": { "pnpm": "11.26.0" }
```

Si `engines.pnpm` ya usaba `>=`, mantén ese operador.

### Paso 4: Ejecutar `pnpm i`

Observa la salida:

**Caso A: Éxito** → Continúa al Paso 5.

**Caso B: `ERR_PNPM_TRUST_DOWNGRADE`** (trust downgrade en supply chain). Antes de agregar a `trustPolicyExclude`:

1. Verifica que es dependencia esperada (directa o transitiva) — no un paquete inesperado.
2. Revisa el paquete en https://www.npmjs.com/package/<paquete>/v/<version> (o `npm view <paquete>@<version> --json`) para confirmar:
   - El paquete y el mantenedor son los esperados/conocidos (no un nombre typosquatted).
   - No hay avisos de seguridad recientes (GitHub Advisories, npm audit) sobre esa versión específica.
   - El cambio de trust es explicable (ej. el mantenedor dejó de firmar con provenance en un release, cambio de CI/pipeline de publicación, etc.), no un maintainer nuevo o inesperado.
3. Si no cuadra (mantenedor desconocido, avisos activos, etc.) → detente y reporta al usuario.
4. Si todo cuadra → agrega a `trustPolicyExclude` con el paquete + versión exacta en `pnpm-workspace.yaml`:

```yaml
trustPolicyExclude:
  - <paquete>@<version>
```

5. Reintenta `pnpm i` tras cada adición.

**Caso C: `ERR_PNPM_IGNORED_BUILDS`** (build scripts bloqueados). Antes de agregar a `allowBuilds`:

1. Verifica que es dependencia esperada (directa o transitiva) — no un paquete inesperado.
2. Revisa el paquete en https://www.npmjs.com/package/<paquete>/v/<version> (o `npm view <paquete>@<version> --json`) para confirmar:
   - El paquete y el mantenedor son los esperados/conocidos (no un nombre typosquatted).
   - No hay avisos de seguridad recientes (GitHub Advisories, npm audit) sobre esa versión específica.
   - El build script es explicable (ej. instala un binario nativo precompilado — típico en `esbuild`, `sharp`, `swc`, etc.), no algo inusual para ese tipo de paquete.
3. Verifica que el build script es típico para ese paquete (ej. instala binario nativo).
4. Si no cuadra → detente y reporta al usuario.
5. Si todo cuadra → agrega a `allowBuilds` con paquete@versión como clave con valor `true`:

```yaml
allowBuilds:
  esbuild@0.28.2: true
```

6. Reintenta `pnpm i` tras cada adición.

**Caso D: Otro error** → Detente y reporta el error completo al usuario.

### Paso 5: Confirmar instalación

Verifica que `pnpm-lock.yaml` se regeneró y `node_modules` existe.

### Paso 6: Resumen

Reporta al usuario:

- Versión anterior → `11.26.0`
- Instalación limpia: sí (borró node_modules + pnpm-lock.yaml)
- Archivos modificados: `package.json`, `pnpm-workspace.yaml` (si se agregaron claves), `pnpm-lock.yaml`
- Entradas agregadas a `trustPolicyExclude` o `allowBuilds` (si las hay) con razón de verificación
- Paquetes bloqueados sin excepción (si los hay)

**No hacer commit/push salvo que el usuario lo pida.**
