# 📊 Finanzapp — Estado Actual del Proyecto

**Última actualización:** 17 julio 2026

---

## 📅 Changelog (Log de Cambios)

### 17 julio 2026
- ✅ **Fix parseAmount():** Importador ahora parsea correctamente montos con códigos de moneda (EUR, GBP, etc.)
  - Problema: "3.65EUR" se rechazaba como NaN
  - Solución: regex mejorada que elimina letras de moneda al inicio y final
  - Prueba: imagin 2025-2026.csv se importa correctamente
  - Commit: `02b0010` — "fix: parseAmount ahora elimina códigos de moneda"

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
| **Vercel** | 🔄 Pendiente | Próxima conexión automática desde GitHub |
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
- Actualmente deshabilitado en dev (relax para pruebas)
- **TODO:** Implementar RLS en producción
  - Cada usuario solo ve sus propias transacciones
  - Inserción/actualización solo del propietario

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
- **Hosting:** Vercel (https://finanzapp.vercel.app)
- **Supabase Project:** Proemote DB

---

## 📋 Historial de Versiones

| Versión | Fecha | Cambios Principales | Status |
|---------|-------|-------------------|--------|
| 0.1.0 | 1 jul | MVP: import CSV, dashboard, categorización IA | ✅ Stable |
| 0.2.0 | 7 jul | Edición/eliminación, undo, importador visual columnas | ✅ Stable |
| 0.3.0 | 16 jul | Documentación completa, estructura RecurringPanel, conexión GitHub | 🚀 En Deploy |
| 0.4.0 | TBD | [ROADMAP] Completar movimientos recurrentes, autogeneración | 🔄 En desarrollo |

---

## 🔗 Enlaces Útiles

- **GitHub:** https://github.com/Proemote/finanzapp
- **Supabase Dashboard:** https://app.supabase.com/projects
- **Vercel Dashboard:** https://vercel.com/dashboard (próximo deploy)
- **Desarrollador:** Carlos Molina Márquez (Proemote)
- **Email:** contactoproemote@gmail.com

---

**Última actualización:** 16 julio 2026 · Carlos Molina · Proemote  
**Próxima acción:** Deploy a Vercel desde GitHub
