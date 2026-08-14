# 📊 Finanzapp — Estado Actual del Proyecto

**Última actualización:** 10 agosto 2026

---

## 📅 Changelog (Log de Cambios)

### 10 agosto 2026 - Sesión 5: Auditoría de bugs, filtros avanzados en Movimientos, fix crítico de persistencia

#### 🚨 **0. Incidente: 504 en Vercel (`MIDDLEWARE_INVOCATION_TIMEOUT`)**
- **Síntoma:** la web en producción devolvía 504 al entrar, con el middleware colgándose
- **Causa:** el proyecto de Supabase (`zgvwarryenikpodmdknz`) estaba **pausado por inactividad** (plan gratuito, ~1 semana sin uso). `middleware.ts` llama a `supabase.auth.getUser()` en cada request; contra un proyecto pausado (Cloudflare 521) la llamada se queda colgada hasta que Vercel corta por timeout
- **Solución:** reactivado manualmente desde el dashboard de Supabase. No fue un fix de código — apunte para el futuro: si vuelve a pasar tras una temporada sin usar la app, revisar primero si el proyecto está pausado antes de tocar el middleware

#### 🐛 **1. Fix crítico: se perdía todo lo importado al refrescar la página**
- **Problema:** importar un CSV/Excel solo dejaba los movimientos en memoria del navegador — nunca se guardaban en Supabase automáticamente, y la app tampoco cargaba nada al abrir. Refrescar la página = perder la importación si no habías pulsado "Guardar" a mano
- **Solución** (`src/context/finanzapp-context.tsx`): auto-guardado en Supabase justo tras clasificar una importación, auto-carga de lo ya guardado al abrir la app (`useEffect` en el mount), y el mismo fix aplicado a añadir/editar/recategorizar manualmente (antes solo borrar sincronizaba al momento)
- Los botones "Guardar"/"Cargar" siguen para forzar una sincronización manual si hace falta

#### 📊 **2. Exportar Excel respeta la cuenta filtrada**
- **Problema:** el botón "Exportar Excel" ignoraba el filtro de cuenta activo (`ControlBar`) y exportaba siempre todos los movimientos
- **Solución** (`src/lib/export.ts`, `finanzapp-context.tsx`): `exportMasterExcel` ahora recibe los movimientos ya filtrados (`visible`) y el nombre de archivo incluye la cuenta cuando hay una seleccionada

#### 🔍 **3. Movimientos: filtros de mes, fecha e importe**
- `TransactionsTable.tsx`: filtro por mes (desplegable), rango de fechas (desde/hasta), rango de importe (mín/máx en valor absoluto), con botón "Limpiar filtros"

#### 🔁 **4. Recurrentes: marcar como "ya no es recurrente"**
- **Problema:** la detección automática (`detectRecurring`) no distinguía patrones que ya habían dejado de repetirse — quedaban para siempre en la lista
- **Solución** (`RecurringPanel.tsx`): botón por fila para descartar una serie, persistido en `localStorage`, con deshacer y contador de "N descartados · restaurar todos"

#### 🧹 **5. "Vaciar todo"**
- Nuevo botón en `ControlBar.tsx` con confirmación en dos pasos que borra todos los movimientos, local y en Supabase (`deleteAllTransactions` en `src/lib/supabase.ts`) — pensado para reimportar un archivo maestro sin arrastrar duplicados de importaciones solapadas anteriores
- ⚠️ Mismo aviso que en la sección de Seguridad: mientras `transactions_mvp` no aísle por `user_id`, este botón borra los datos de cualquiera que use la app, no solo los propios

#### 🔎 **6. Movimientos: filtros de cuenta/categoría/tipo, ordenación, selección múltiple**
- **Filtro por cuenta y por categoría** (selector múltiple nuevo, `src/components/MultiSelectFilter.tsx`, reutilizable) — usan los valores reales presentes en los datos, no listas fijas
- **Filtro por tipo:** Ingreso / Gasto / Transferencia interna — nueva categoría `"Transferencia interna"` en `src/lib/categories.ts` (`TRANSFER_CATEGORY`), asignable a mano igual que cualquier otra categoría (se decidió no usar heurística automática de detección de pares, por el mismo riesgo de falsos positivos que ya dio Recurrentes)
- **Ordenación** por Fecha e Importe, ascendente/descendente, con indicador de dirección en la cabecera
- **Selección múltiple de filas** con acciones en lote: recategorizar (`handleBulkCategoryChange`, un solo guardado en Supabase) y eliminar (`handleDeleteTransactions`, un solo deshacer conjunto para todo el lote) — nuevas funciones en `finanzapp-context.tsx` y `deleteTransactions` (borrado en lote) en `src/lib/supabase.ts`
- Paginación: se mantuvo el "Cargar más" existente (decisión explícita, no se cambió a scroll infinito ni páginas numeradas)
- Sin librerías nuevas — todo hecho a mano (`useState`/`useMemo`), siguiendo el patrón ya existente en el archivo

#### 🩹 **7. Fixes de la auditoría (Fase 1)**
- **`AccountModal.tsx`:** el botón "Importar" ya no permite enviar con el nombre de cuenta vacío (antes caía en `"Sin cuenta"` en silencio sin que el usuario se diera cuenta)
- **Aviso de clasificación IA corregido:** cuando Gemini falla (429 por cuota, o sin `GEMINI_API_KEY`), el mensaje decía "clasificación por reglas" — **falso**: esos movimientos caen en la categoría genérica "Otros ingresos/gastos" (`defaultCategory`), no se reclasifican por reglas. El aviso ahora lo dice explícitamente y cuenta cuántos movimientos se vieron afectados
- **Nuevo estado visual "warning"** (ámbar, token `--warn` en `globals.css` para los 4 modos de tema): antes este aviso se mostraba en verde, indistinguible de un import 100% exitoso
- **`AnalyticsPanel.tsx`:** la variación % mes a mes mostraba cifras absurdas (ej. +6030,2% en abril 2026) cuando el mes anterior tenía una base casi nula (1,99€, un único movimiento). Se limita la cifra mostrada a 999%, con el valor real calculado disponible en el tooltip al pasar el ratón
- **Nota de datos pendiente de revisar:** marzo 2026 solo tenía un movimiento (1,99€) en la base de datos — puede ser una importación incompleta de ese mes, no solo un bug de fórmula

#### 🚀 **Commits**
- `bfe9e95` — fix: exportar Excel por cuenta filtrada, filtros de movimientos, recurrentes descartables y auto-guardado
- `9e21231` — feat: filtros avanzados en Movimientos + fix de 3 bugs auditados
- Pusheados a `master`, auto-deploy activado en Vercel

---

### 29 julio 2026 - Sesión 4: Fix IA, rutas reales, Excel rediseñado, modo claro/oscuro

#### 🔑 **1. Fix clasificación IA (Gemini 401)**
- **Problema:** al clasificar movimientos, la IA fallaba con `Gemini 401: Request had invalid authentication credentials`
- **Causa:** `GEMINI_API_KEY` en `.env.local` no tenía formato de API key válida (caducada/mal copiada)
- **Solución:** generada key nueva desde Google AI Studio, actualizada en `.env.local` y en Vercel (Production + Preview), redeploy y verificado con llamada real a `/api/classify` (`aiUsed: true`)

#### 🧭 **2. Menú con rutas reales (antes anclas en una sola página)**
- **Antes:** Dashboard/Movimientos/Analytics/Recurrentes/Cuentas eran secciones `#ancla` dentro de `src/app/page.tsx`
- **Ahora:** rutas Next.js independientes bajo `src/app/(app)/` — `/`, `/movimientos`, `/analytics`, `/recurrentes`, `/cuentas` — cada una con su propio archivo `page.tsx`
- **Estado compartido:** nuevo `src/context/finanzapp-context.tsx` (`FinanzappProvider`/`useFinanzapp`) en `src/app/(app)/layout.tsx`, para que navegar entre secciones no pierda los movimientos cargados
- **Componentes nuevos:** `Topbar.tsx` (búsqueda + import), `ControlBar.tsx` (acciones globales + banner de estado + filtro de cuentas), `EmptyState.tsx`
- **Eliminado:** `src/app/page.tsx` (lógica movida al layout + context)
- **Archivos:** `src/app/(app)/*`, `src/context/finanzapp-context.tsx`, `src/components/{Topbar,ControlBar,EmptyState,Sidebar}.tsx`

#### 📊 **3. Excel maestro rediseñado con `exceljs`**
- **Problema:** `xlsx` (SheetJS free) no permite aplicar estilos; el Excel exportado era texto plano sin formato
- **Solución:** reescrito `src/lib/export.ts` con `exceljs` — cabecera azul marino con texto blanco, filas TOTAL en salmón, movimientos agrupados por mes, formato de moneda y colores por ingreso/gasto, cabecera congelada
- **Referencia de estilo:** cuadrante contable de Carlos (adaptado a los campos reales de Finanzapp, sin IVA/retención/proveedor)
- **Dependencia nueva:** `exceljs`

#### 🎨 **4. Rediseño visual soft UI + modo claro/oscuro**
- **Antes:** tema oscuro fijo (`:root` único en `globals.css`), sin modo claro
- **Ahora:** tokens de tema completos para claro y oscuro vía `[data-theme]` en `<html>`, con fallback a `prefers-color-scheme`
- **Toggle:** `src/components/ThemeToggle.tsx` en el Topbar, persistido en `localStorage`, sin flash de tema incorrecto (script inline en `layout.tsx` + `suppressHydrationWarning`)
- **Estilo:** fondo con degradado violeta sutil, tarjetas más redondeadas (20px) con sombra suave tintada de morado, chips de icono más suaves, barras de progreso por categoría (donut de gastos) y por cuenta
- **Paleta del donut:** antes escala de morados sobre morado (poco distinguible); ahora paleta categórica con morado líder + 5 tonos, validada contra daltonismo (skill `dataviz`, `scripts/validate_palette.js`) — `--chart-1..6` en `globals.css`
- **Fix cross-tema:** varios `hover:bg-white/[...]` (invisibles en modo claro) cambiados a `hover:bg-foreground/[...]`, y el botón "Exportar Excel" (blanco/negro fijo) pasó a morado sólido de marca
- **Archivos:** `src/app/globals.css`, `src/app/layout.tsx`, `src/components/ThemeToggle.tsx`, `src/components/ChartsPanel.tsx`, `src/components/{SummaryCards,RecurringPanel,AccountsPanel,Sidebar,ControlBar}.tsx`

#### ⚠️ **Hallazgo pendiente (no corregido esta sesión): datos no aislados por usuario**
- La tabla `transactions_mvp` sigue con RLS "open access" (`using (true)`) y ninguna query filtra por `user_id`, pese a que ya hay login real. Cualquier usuario autenticado ve/edita/borra las transacciones de todos los demás. Ver sección **Seguridad & Permisos** más abajo.

#### 🚀 **Deploys a Vercel (producción)**
- Deploy 1: fix de `GEMINI_API_KEY`
- Deploy 2: rutas reales + Excel rediseñado
- **Commits:** `7809394` (rutas + Excel), `eed1db4` (rediseño visual) — pusheados a `master`
- **Pendiente:** el rediseño visual (`eed1db4`) está en GitHub pero aún no desplegado a Vercel producción

---

### 17 julio 2026 - Sesión 3: Auth completo + Signup + Email confirmation

#### 🔧 **1. Fix parseAmount() para importación de archivos**
- **Problema:** Archivos con códigos de moneda (EUR, GBP, etc.) fallaban en importación
  - Ejemplo: `"3.65EUR"` se rechazaba como NaN
  - Causa: regex no eliminaba letras de moneda, solo símbolos
- **Solución:** Regex mejorada en `src/lib/parse.ts` línea 40-42
  - Antes: `.replace(/[€$\s]/g, "")`
  - Después: `.replace(/^[€$\s\p{L}]+/gu, "").replace(/[€$\s\p{L}]+$/gu, "")`
  - Ahora elimina letras de moneda al inicio y final
- **Prueba exitosa:** Archivo imagin 2025-2026.csv importa correctamente
- **Archivos modificados:** `src/lib/parse.ts`
- **Commit:** `02b0010` — "fix: parseAmount ahora elimina códigos de moneda"

#### 🔐 **2. Sistema de Autenticación Supabase + Login UI**
- **Componentes nuevos:**
  - `src/components/SignIn.tsx` — UI de login con canvas animado
  - `src/app/login/page.tsx` — Página de login
  - `src/app/auth/callback/route.ts` — Callback para Google OAuth
  - `src/hooks/useAuth.ts` — Hook para manejar sesiones
  - `src/app/forgot-password/page.tsx` — Página recuperar contraseña
  - `src/components/ForgotPassword.tsx` — UI recuperar contraseña
  - `middleware.ts` — Protección de rutas

- **Características:**
  - ✅ Login con email/contraseña
  - ✅ Google OAuth integrado
  - ✅ Recuperación de contraseña ("¿Olvidaste tu contraseña?")
  - ✅ Middleware que redirige sin autenticación → `/login`
  - ✅ Rutas públicas: `/login`, `/forgot-password`
  - ✅ Rutas protegidas: `/` (dashboard) + todas las demás

- **Dependencias instaladas:**
  - `framer-motion@11.x` — animaciones suaves
  - `@supabase/ssr@0.x` — SSR support para middleware
  - `react-is@18.x` — utilidad para recharts

- **Diseño:**
  - Lado izquierdo: canvas animado con mapa y puntos (DotMap)
  - Lado derecho: formulario de autenticación
  - Animaciones entrada/salida suave
  - Validación con mensajes de error claros
  - Botón Google con logo oficial
  - Responsive (mobile: formulario full-width)

- **Archivos modificados:** `src/app/login/page.tsx`, `package.json`, `package-lock.json`
- **Commit:** `b6054f8` — "feat: Sistema de autenticación con Supabase + login UI"

#### 📝 **3. Sign Up con Confirmación de Email + Términos**
- **Componente nuevo:**
  - `src/components/AuthCard.tsx` — Reemplaza SignIn, agregando Signup
  - Tabs: "Iniciar sesión" | "Crear cuenta"
  - Transiciones suaves entre tabs con AnimatePresence

- **Formulario Sign Up:**
  - Email (con validación)
  - Contraseña (mínimo 6 caracteres)
  - Confirmar contraseña (deben coincidir)
  - ✅ **Casilla de privacidad:** "Acepto los términos y condiciones + política de privacidad"
  - Botón "Crear cuenta" (deshabilitado hasta aceptar términos)

- **Validaciones:**
  - Email requerido y validado
  - Contraseña: mínimo 6 caracteres
  - Contraseñas deben coincidir (error: "Las contraseñas no coinciden")
  - Términos deben aceptarse (error: "Debes aceptar los términos")
  - Cada campo tiene validación individual con mensajes de error

- **Flujo Signup:**
  1. Usuario completa formulario + acepta términos
  2. Click en "Crear cuenta"
  3. Supabase crea la cuenta automáticamente
  4. **Supabase envía email de confirmación** (automático)
  5. Pantalla de éxito: "¡Cuenta creada!" + "Hemos enviado un enlace..."
  6. Usuario confirma en el email (link con callback → `/auth/callback`)
  7. Puede iniciar sesión normalmente

- **Pantalla de Confirmación:**
  - Icono de check en verde
  - Mensaje: "Hemos enviado un enlace de confirmación a: [email]"
  - Instrucción: "Abre el enlace en tu correo para confirmar tu cuenta"
  - Botón "Volver al inicio" (regresa a login)

- **Diseño consistente:**
  - Mismo mapa animado en lado izquierdo
  - Mismos estilos, colores y animaciones que login
  - Iconografía con lucide-react
  - Estados de carga (spinner) en botones

- **Archivos nuevos:** `src/components/AuthCard.tsx`
- **Archivos eliminados:** `src/components/SignIn.tsx` (reemplazado)
- **Archivos modificados:** `src/app/login/page.tsx`
- **Commits:**
  - `67baa1a` — "feat: Agregar Sign Up con confirmación de email y términos"
  - `70ac7cf` — "docs: Actualizar APP_STATUS con signup feature"

#### 📊 **Resumen de cambios (17 julio)**
| Elemento | Antes | Después |
|----------|-------|---------|
| Importador | Fallaba con EUR | ✅ Funciona perfectamente |
| Autenticación | No existía | ✅ Supabase + Google OAuth |
| Login | No existía | ✅ Página completa + UI |
| Sign Up | No existía | ✅ Con términos + email confirmation |
| Rutas protegidas | No | ✅ Middleware automático |
| Dependencias nuevas | 0 | +3 (framer-motion, @supabase/ssr, react-is) |
| Archivos nuevos | - | 8 componentes/rutas/hooks |

#### 🚀 **Estado Actual**
- ✅ Build: exitoso (sin errores TypeScript)
- ✅ Servidor: corriendo en puerto 3001
- ✅ Rutas: `/login` + `/forgot-password` + `/` protegido
- ✅ Email confirmation: funcionando (Supabase automático)
- ⏳ Próximo: Conectar Vercel para deploy

### 16 julio 2026
- ✅ **Repositorio GitHub conectado:** `https://github.com/Proemote/finanzapp.git`
- ✅ **Commit:** `dac72e6` — "feat: Documentación APP_STATUS y estructura de RecurringPanel"
- ✅ **Push a master:** Código subido a GitHub (rama sincronizada)
- ✅ **Variables Supabase configuradas en .env.local:**
  - `NEXT_PUBLIC_SUPABASE_URL` ✓
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` ✓
- 🚀 **Próximo paso:** Conectar Vercel a GitHub para deploy automático
- 📝 **Documento creado:** APP_STATUS.md (contexto completo del proyecto)

### 15 julio 2026
- 🚧 **Inicio de RecurringPanel.tsx** — estructura de componente creada
- 📝 **Creación de lib/recurring.ts** — lógica de movimientos recurrentes (en desarrollo)
- 📝 **Modificaciones:** src/app/page.tsx y src/components/Sidebar.tsx actualizadas

### 1-7 julio 2026
- ✅ MVP completo de Finanzapp
- ✅ Importación CSV/Excel con mapeo visual
- ✅ Clasificación automática por IA
- ✅ Dashboard con gráficos (Recharts)
- ✅ Gestión de cuentas bancarias
- ✅ Edición/eliminación de movimientos + undo
- ✅ Exportación a Excel multi-hoja

---

## 🚀 Despliegue & Configuración (16 julio)

### Estado de Infraestructura

| Componente | Estado | Detalles |
|-----------|--------|---------|
| **GitHub** | ✅ Conectado | Repo: `Proemote/finanzapp` · Branch: `master` |
| **Supabase** | ✅ Configurado | Variables en `.env.local` · BD PostgreSQL activa |
| **Vercel** | ✅ Desplegado | https://finanzapp-money.vercel.app (Production + Preview) |
| **Node.js** | ✅ 18+ | Versión compatible |
| **Next.js** | ✅ 16.2.9 | App Router activo |

### Variables de Entorno (Configuradas)

```env
NEXT_PUBLIC_SUPABASE_URL=https://zgvwarryenikpodmdknz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_O-Oekoc_ehfo6kDLyLdQag_3sZRi7YS
```

✅ Ambas variables están configuradas en `.env.local` y listas para producción.

### Deploy Automático (Próximo paso)

1. Ir a https://vercel.com/dashboard
2. Hacer clic en "Add New" → "Project"
3. Importar `Proemote/finanzapp` desde GitHub
4. Vercel detectará Next.js automáticamente
5. **Añadir variables de entorno:**
   - Copiar `NEXT_PUBLIC_SUPABASE_URL`
   - Copiar `NEXT_PUBLIC_SUPABASE_ANON_KEY`
6. Hacer clic en "Deploy"

**Resultado esperado:** App en vivo en `finanzapp.vercel.app` (URL asignada por Vercel)

---

## 🎯 ¿Qué es Finanzapp?

**Finanzapp** es una aplicación web de gestión financiera personal diseñada para pequeños negocios y autónomos. Permite:

- ✅ **Importar operaciones** desde CSV/Excel (con mapeo inteligente de columnas)
- ✅ **Clasificar automáticamente** transacciones por categorías (IA)
- ✅ **Gestionar múltiples cuentas bancarias** (asignación al importar)
- ✅ **Dashboard analítico** con resumen mensual y visualizaciones
- ✅ **Alta manual de movimientos** (efectivo, transferencias, etc.)
- ✅ **Editar/eliminar transacciones** con opción de deshacer
- ✅ **Exportar a Excel** con todos los datos procesados
- ✅ **Gestionar movimientos recurrentes** (próxima feature)

**Objetivo estratégico:** Ser la herramienta de escritorio financiero para clientes de Proemote, integrada como parte del sistema de automatización/LeadFlow.

**Tecnología:** Next.js 16 + React 19 + Supabase + TypeScript + Tailwind CSS + Recharts

---

## 🏗️ Arquitectura

### Stack Tecnológico

| Capa | Herramienta | Versión |
|------|------------|---------|
| **Frontend** | Next.js App Router | 16.2.9 |
| **UI/Rendering** | React 19 + TypeScript | 19.2.4 |
| **Styling** | Tailwind CSS 4 | 4.0 |
| **Backend** | Supabase (PostgreSQL) | v2 |
| **Charts** | Recharts | 3.9.2 |
| **Imports** | Papa Parse + XLSX | 5.5.4 / 0.18.5 |
| **Icons** | Lucide React | 1.23.0 |
| **Hosting** | Vercel | - |

### Estructura de Carpetas

```
finanzapp/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Vista principal (dashboard)
│   │   └── layout.tsx            # Layout global
│   ├── components/               # Componentes React
│   │   ├── Sidebar.tsx           # Panel lateral con navegación
│   │   ├── SummaryCards.tsx      # Tarjetas de resumen (totales, balance)
│   │   ├── TransactionsTable.tsx # Tabla de movimientos
│   │   ├── AddTransactionModal.tsx # Modal alta manual
│   │   ├── AccountModal.tsx      # Modal gestión de cuentas
│   │   ├── ColumnMapperModal.tsx # Mapeo de columnas (import)
│   │   ├── UploadZone.tsx        # Zona de drag & drop
│   │   ├── ChartsPanel.tsx       # Gráficos (gastos por categoría)
│   │   ├── AnalyticsPanel.tsx    # Panel analítico mensual
│   │   ├── AccountsPanel.tsx     # Gestión de cuentas bancarias
│   │   └── RecurringPanel.tsx    # [NUEVO] Gestión de recurrentes
│   └── lib/
│       ├── types.ts             # Tipos TypeScript (Transaction, Account, etc.)
│       ├── supabase.ts          # Cliente Supabase + CRUD
│       ├── parse.ts            # Parsers CSV/Excel + mapeo
│       ├── categories.ts        # Clasificación IA + categorías
│       ├── analytics.ts         # Cálculos de resúmenes, totales
│       ├── export.ts            # Exportación a Excel
│       └── recurring.ts         # [NUEVO] Lógica de recurrentes
├── supabase/
│   └── migrations/              # Migraciones de BD
├── public/                       # Assets estáticos
├── .env.local                    # Variables de entorno (Supabase URL, KEY)
└── package.json                  # Dependencias

```

---

## 📊 Base de Datos (Supabase)

### Tabla: `transactions`

| Campo | Tipo | Descripción |
|-------|------|------------|
| `id` | UUID | Identificador único |
| `date` | DATE | Fecha de la transacción |
| `description` | TEXT | Concepto/descripción |
| `category` | TEXT | Categoría asignada (manual o IA) |
| `amount` | DECIMAL | Monto (negativo=gasto, positivo=ingreso) |
| `account` | TEXT | Cuenta bancaria (ej: "Bankia", "Efectivo") |
| `notes` | TEXT | Notas adicionales |
| `is_classified` | BOOL | True si se clasificó automáticamente |
| `created_at` | TIMESTAMP | Fecha de creación en BD |
| `updated_at` | TIMESTAMP | Última modificación |

### Tabla: `accounts` (próxima)

| Campo | Tipo | Descripción |
|-------|------|------------|
| `id` | UUID | ID único |
| `user_id` | UUID | Propietario (Supabase auth) |
| `name` | TEXT | Nombre (ej: "Bankia", "Bizum") |
| `type` | TEXT | Tipo (bank/cash/card/other) |
| `balance` | DECIMAL | Saldo actual |
| `created_at` | TIMESTAMP | Fecha creación |

### Tabla: `recurring_transactions` (próxima)

| Campo | Tipo | Descripción |
|-------|------|------------|
| `id` | UUID | ID único |
| `user_id` | UUID | Propietario |
| `description` | TEXT | Concepto |
| `category` | TEXT | Categoría |
| `amount` | DECIMAL | Monto |
| `frequency` | TEXT | Periodicidad (monthly/quarterly/yearly) |
| `start_date` | DATE | Fecha de inicio |
| `end_date` | DATE | Fecha final (nullable) |
| `next_date` | DATE | Próxima ejecución |
| `created_at` | TIMESTAMP | Fecha creación |

---

## ✅ Features Implementadas

### 1. **Importación de Datos** (Julio 2025)
- Drag & drop de archivos CSV/Excel
- Detección automática de columnas (español/inglés, con/sin tildes)
- Modal de mapeo visual: usuario elige qué columna es "Fecha", "Concepto", etc.
- Asignación automática de cuenta al importar
- Deduplicación de contactos por email + teléfono
- Límite: 5.000 movimientos por importación

### 2. **Clasificación Automática (IA)** (Julio 2025)
- Reglas automáticas por palabras clave (ej: "Mercadona" → Supermercados)
- Fallback a categoría "Sin clasificar" si no hay match
- Opción de reclasificación manual
- Categorías predefinidas: Alimentación, Transporte, Vivienda, Servicios, etc.

### 3. **Dashboard Analítico** (Julio 2025)
- **Tarjetas resumen:** Total ingresos, gastos, balance
- **Gráfico de gastos por categoría** (Pie Chart con Recharts)
- **Resumen mensual:** tabla con ingresos/gastos/balance por mes
- **Filtros:** Por cuenta, por rango de fechas
- **Búsqueda:** Búsqueda en tiempo real en concepto + notas

### 4. **Gestión de Cuentas** (Julio 2025)
- Crear/editar/eliminar cuentas bancarias
- Filtrado de transacciones por cuenta
- Vista "Todas las cuentas" (agregado)
- Asignación de cuenta al importar

### 5. **Alta Manual de Movimientos** (Julio 2025)
- Modal para agregar transacciones manuales
- Campos: fecha, concepto, cantidad, categoría, cuenta, notas
- Validaciones básicas

### 6. **Edición y Eliminación** (Julio 2025)
- ✏️ Editar transacciones existentes
- 🗑️ Borrar transacciones con confirmación
- ↩️ Botón "Deshacer" en notificación tras borrar
- Toast/feedback visual de operación

### 7. **Exportación a Excel** (Julio 2025)
- Botón "Descargar Excel" en dashboard
- Genera archivo con:
  - Hoja 1: Listado completo de movimientos
  - Hoja 2: Resumen mensual
  - Hoja 3: Totales por categoría
- Formatos: fechas localizadas, números con decimales

### 8. **Sistema de Visualización** (Julio 2025)
- **Tabla de movimientos:** paginación, ordenamiento, búsqueda
- **Cards de resumen:** totales agregados
- **Charts:** Pie chart de gastos por categoría, evolución mensual
- **Sidebar:** navegación con iconos, estado activo
- **Responsive:** adaptable a mobile/tablet/desktop

---

## 🚧 Features en Desarrollo

### **RecurringPanel.tsx** (En construcción - Iniciado 15 julio, actualizado 16 julio)

**Estado:** Archivos creados, estructura base lista, lógica en desarrollo

**Archivos nuevos:**
- `src/components/RecurringPanel.tsx` — UI para gestionar movimientos recurrentes
  - Panel con formulario de creación
  - Listado de recurrentes activos
  - Acciones: Editar, eliminar, vista de próximos vencimientos
- `src/lib/recurring.ts` — Lógica de cálculo y generación automática
  - Funciones: crear, editar, eliminar, generar automáticos
  - Cálculo de próximas fechas según frecuencia

**Funcionalidad prevista:**
- ✅ Crear movimientos recurrentes (mensual, trimestral, anual)
- ✅ Editar/eliminar recurrentes
- ✅ Generar automáticamente movimientos a su vencimiento
- ✅ Mostrar próximo vencimiento
- ✅ Historial de generaciones
- 🔄 Integración con tabla `recurring_transactions` (Supabase)

**Cambios asociados (16 julio):**
- `src/app/page.tsx` — Import de RecurringPanel (línea 20) ✓
- `src/components/Sidebar.tsx` — Nuevo item "Recurrentes" en navegación ✓
- **Commit:** `dac72e6` (subido a GitHub)

**Próximas acciones:**
- Completar lógica en `recurring.ts`
- Testear flujo completo de recurrentes
- Crear tabla `recurring_transactions` en Supabase
- Implementar generación automática de movimientos

---

## 📝 Estado del Repositorio (Git)

**Rama:** `master`  
**Remote:** `https://github.com/Proemote/finanzapp.git`  
**Sincronización:** ✅ Todos los cambios pusheados a GitHub

### Últimos Commits

| Commit | Fecha | Mensaje |
|--------|-------|---------|
| `9e21231` | 10 ago | ✅ feat: Filtros avanzados en Movimientos + fix de 3 bugs auditados |
| `bfe9e95` | 10 ago | ✅ fix: Excel por cuenta filtrada, filtros de movimientos, recurrentes descartables, auto-guardado |
| `eed1db4` | 29 jul | ✅ feat: Rediseño visual soft UI con modo claro/oscuro |
| `7809394` | 29 jul | ✅ feat: Rutas reales en el sidebar y Excel maestro rediseñado |
| `38a8387` | 17 jul | ✅ fix: Usar createBrowserClient de @supabase/ssr en vez de supabase-js |
| `dac72e6` | 16 jul | ✅ feat: Documentación APP_STATUS y estructura de RecurringPanel |
| `9603637` | 7 jul | ✅ Editar/borrar movimientos con deshacer e importador visual de columnas |
| `6506f27` | 7 jul | ✅ Analytics mensual y alta manual de movimientos (efectivo) |
| `cf4f07d` | 7 jul | ✅ Cuentas bancarias: asignación al importar, filtro, panel |
| `b3b1a3d` | 1 jul | ✅ MVP inicial de Finanzapp |

**Estado actual:** Working tree limpio (sin cambios pendientes)

---

## 🔄 Flujo de Datos Típico

### Importación → Clasificación → Almacenamiento

```
1. Usuario sube CSV/Excel
   ↓
2. UploadZone detecta archivos
   ↓
3. ColumnMapperModal pide mapeo (Fecha, Concepto, Monto, etc.)
   ↓
4. parseWithMapping() normaliza datos
   ↓
5. classifyByRules() clasifica por IA
   ↓
6. saveTransactions() guarda en Supabase
   ↓
7. Dashboard actualiza automáticamente
```

### Alta Manual

```
1. Usuario abre AddTransactionModal
   ↓
2. Completa: fecha, concepto, monto, categoría, cuenta
   ↓
3. saveTransactions() guarda
   ↓
4. Estado "ok" + notificación
```

---

## 🎨 Componentes Principales

### Layout Global (`src/app/layout.tsx`)
- Estructura base: Sidebar + Main Content
- Tailwind CSS + estilos globales
- Font: Geist (Vercel)

### Página Principal (`src/app/page.tsx`)
- Gestor de estado central (transactions, status, query)
- Orquestación de componentes
- Manejo de drag & drop, uploads, modales
- Integración Supabase

### Sidebar (`src/components/Sidebar.tsx`)
- Navegación entre vistas
- Items: Dashboard, Cuentas, Recurrentes, Exportar
- Estado activo (highlight)

### SummaryCards (`src/components/SummaryCards.tsx`)
- 3 tarjetas: Total Ingresos, Total Gastos, Balance
- Números grandes, colores: verde (ingreso), rojo (gasto), azul (balance)

### TransactionsTable (`src/components/TransactionsTable.tsx`)
- Tabla con columnas: Fecha, Concepto, Categoría, Monto, Cuenta
- Acciones: Editar, Borrar
- Paginación (últimas 10)
- Búsqueda en vivo

### AnalyticsPanel (`src/components/AnalyticsPanel.tsx`)
- Resumen mensual: tabla mes/ingresos/gastos/balance
- Gráfico de evolución (line chart)

### ChartsPanel (`src/components/ChartsPanel.tsx`)
- Pie chart: gastos por categoría
- Leyenda con colores
- Interactividad (hover)

### AddTransactionModal (`src/components/AddTransactionModal.tsx`)
- Formulario modal para alta manual
- Validación básica de campos
- Submit a Supabase

### ColumnMapperModal (`src/components/ColumnMapperModal.tsx`)
- Interfaz de mapeo: usuario elige columnas
- 4 pasos: archivo → columnas → opciones → resumen
- Preview de datos

### AccountsPanel (`src/components/AccountsPanel.tsx`)
- CRUD de cuentas bancarias
- Modal para crear/editar
- Listado con estado

---

## 🔧 Stack Técnico Detallado

### Frontend
- **Next.js 16:** App Router (no Pages Router)
- **React 19:** Hooks (useState, useCallback, useMemo, useRef)
- **TypeScript:** Tipado completo
- **Tailwind CSS 4:** Utility-first styling
- **Lucide React:** Icons (CloudDownload, Plus, Search, Wallet, etc.)

### Backend & Base de Datos
- **Supabase:** PostgreSQL + Auth + Realtime
- **Supabase JS Client:** Query builder + RLS
- **Environment Variables:** `.env.local` (SUPABASE_URL, SUPABASE_ANON_KEY)

### Datos & Procesamiento
- **Papa Parse:** CSV parsing
- **XLSX:** Excel reading/writing
- **Recharts:** Visualizaciones (Pie, Line, Legend)
- **Tipado custom:** `Transaction`, `Account`, `Row`, etc. en `lib/types.ts`

---

## 📈 Métricas & Analíticos

### Disponibles en Dashboard
- **Total de ingresos:** suma de amount > 0
- **Total de gastos:** suma de amount < 0
- **Balance:** ingresos - gastos
- **Gastos por categoría:** agrupación + pie chart
- **Resumen mensual:** desglose mes a mes

### Exportados a Excel
- Listado completo (todas las columnas)
- Resumen mensual (3 columnas: mes, ingresos, gastos, balance)
- Totales por categoría

---

## 🔐 Seguridad & Permisos

### Supabase Row-Level Security (RLS)
- **⚠️ Confirmado 29 jul:** `transactions_mvp` tiene RLS activado pero con política "open access" (`using (true)`) y `src/lib/supabase.ts` no filtra por `user_id` en ninguna query. Con el login real ya activo, esto significa que **todos los usuarios autenticados comparten los mismos datos** (ven/editan/borran las transacciones de cualquier otro usuario)
- **TODO (prioritario):** Implementar RLS real en producción
  - Cada usuario solo ve sus propias transacciones
  - Inserción/actualización solo del propietario
  - Unificar el cliente Supabase: `lib/supabase.ts` usa `@supabase/supabase-js` clásico (sin sesión), mientras que el login usa `@supabase/ssr` — hay que pasar las queries de transacciones al cliente con sesión antes de poder filtrar por `auth.uid()`
- **⚠️ Añadido 10 ago:** el botón "Vaciar todo" (`ControlBar.tsx`) y el borrado en lote de la tabla de Movimientos (`handleDeleteTransactions`) heredan el mismo problema — mientras no haya `user_id`, borran los datos de **todos** los usuarios, no solo los propios. Priorizar el RLS real antes de dar acceso a un segundo usuario.

### Variables de Entorno
```
SUPABASE_URL=https://...supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
```

### Autenticación
- Supabase Auth (Google, email/password)
- **TODO:** Integrar login con Supabase (ahora es anónimo)

---

## 🐛 Conocidos / TODO

### Inmediato (Esta semana)
- [ ] Completar `RecurringPanel.tsx` y `recurring.ts`
  - Lógica de creación
  - Generación automática mensual
  - Edición/eliminación
- [ ] Testear flujo completo recurrentes
- [ ] Commitear cambios en rama `feature/recurring`

### Corto plazo (Próximas 2 semanas)
- [ ] Integración de autenticación Supabase (login real)
- [ ] Activar RLS en producción
- [ ] Test de importación con datos reales (5000+ registros)
- [ ] Mobile responsiveness (actualmente web-first)

### Mediano plazo (Próximo mes)
- [ ] Dashboard de KPIs históricos
- [ ] Reportes PDF exportables
- [ ] Integración con banca abierta (Open Banking API)
- [ ] Webhooks de eventos financieros
- [ ] Predicción de flujo de caja (IA)

### Largo plazo (Roadmap 2026)
- [ ] Integración con LeadFlow CRM (notificaciones, historial)
- [ ] API pública para terceros
- [ ] Mobile app (React Native)
- [ ] Integración con contador/asesor fiscal
- [ ] Presupuestos y alertas de límite

---

## 🚀 Cómo Ejecutar Localmente

### Requisitos
- Node.js 18+
- npm / yarn / pnpm
- Supabase cuenta activa

### Setup

```bash
# 1. Clonar / entrar al directorio
cd finanzapp

# 2. Instalar dependencias
npm install

# 3. Crear .env.local (copiar de .env.example o desde Supabase dashboard)
# SUPABASE_URL=https://...
# SUPABASE_ANON_KEY=eyJ...

# 4. Iniciar servidor de desarrollo
npm run dev

# 5. Abrir navegador
# http://localhost:3000
```

### Build & Deploy
```bash
# Build
npm run build

# Test en producción local
npm start

# Deploy a Vercel (automático desde push a main)
git push origin main
```

---

## 📞 Contacto & Recursos

- **Desarrollador:** Carlos Molina (Proemote)
- **Email:** contactoproemote@gmail.com
- **Repo:** GitHub (Proemote-Tech/finanzapp)
- **Hosting:** Vercel (https://finanzapp-money.vercel.app)
- **Supabase Project:** Proemote DB

---

## 📋 Historial de Versiones

| Versión | Fecha | Cambios Principales | Status |
|---------|-------|-------------------|--------|
| 0.1.0 | 1 jul | MVP: import CSV, dashboard, categorización IA | ✅ Stable |
| 0.2.0 | 7 jul | Edición/eliminación, undo, importador visual columnas | ✅ Stable |
| 0.3.0 | 16 jul | Documentación completa, estructura RecurringPanel, conexión GitHub | ✅ Stable |
| 0.4.0 | 17 jul | Auth completo: login/signup, Google OAuth, recuperar contraseña | ✅ Stable |
| 0.5.0 | 29 jul | Rutas reales, Excel rediseñado (exceljs), modo claro/oscuro, fix IA | ✅ Stable |
| 0.6.0 | 10 ago | Fix persistencia (auto-guardado/carga), filtros avanzados en Movimientos, selección en lote, "Vaciar todo", recurrentes descartables, fix aviso IA y % en Analytics | ✅ Stable |
| 0.7.0 | TBD | [ROADMAP] RLS real por usuario, tabla `recurring_transactions` con generación automática | 🔄 En desarrollo |

---

## 🔗 Enlaces Útiles

- **GitHub:** https://github.com/Proemote/finanzapp
- **Supabase Dashboard:** https://app.supabase.com/projects
- **Vercel Dashboard:** https://vercel.com/dashboard · App: https://finanzapp-money.vercel.app
- **Desarrollador:** Carlos Molina Márquez (Proemote)
- **Email:** contactoproemote@gmail.com

---

**Última actualización:** 10 agosto 2026 · Carlos Molina · Proemote  
**Próxima acción:** Implementar RLS real por usuario · revisar si marzo 2026 tiene datos incompletos · completar tabla `recurring_transactions` con generación automática
