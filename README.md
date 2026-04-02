# gastos.guidowain.com

Dashboard de gastos personales. PWA mobile-first. Next.js 14 + Google Sheets.

## Setup

```bash
cd ~/Documents/gastos
npm install
cp .env.local.example .env.local
# completar variables en .env.local
npm run dev
```

## Variables de entorno

| Variable | Valor |
|----------|-------|
| `PIN` | PIN de 4 dígitos |
| `SPREADSHEET_ID` | ID del Google Sheet |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Email del service account |
| `GOOGLE_PRIVATE_KEY` | Private key del service account (con `\n` escapados) |

## Google Sheet — estructura esperada

El sheet necesita 3 hojas:

### Gastos RAW
| A: Fecha | B: Categoría | C: Subcategoría | D: Monto |
|----------|-------------|-----------------|---------|
| 02/04/2026 | Comida | Almuerzo | 3500 |

### Gastos CATEGORÍAS
| A: Mes y Año | B: Categoría | C: Monto total |
|-------------|-------------|----------------|
| abril 2026 | Comida | 0 |

### Gastos MENSUALES
| A: Mes y Año | B: Monto total |
|-------------|----------------|
| abril 2026 | 0 |

> Las hojas CATEGORÍAS y MENSUALES pueden usar SUMIFS sobre Gastos RAW.

## Deploy

```bash
# Agregar alias en ~/.zshrc:
alias deploy-gastos="cd ~/Documents/gastos && NODE_TLS_REJECT_UNAUTHORIZED=0 vercel --prod --token $VERCEL_TOKEN"
```

Configurar las mismas variables de entorno en Vercel dashboard.

## Sheet ID para delete

En `src/app/api/gastos-delete/route.ts`, actualizar `GASTOS_RAW_SHEET_ID` con el gid
numérico de la hoja "Gastos RAW" (se ve en la URL del sheet: `...#gid=XXXXXXXX`).

## PWA

La app se puede instalar en el home screen desde Chrome/Safari mobile.
El manifest está en `/public/manifest.json`.
Agregar íconos `icon-192.png` e `icon-512.png` en `/public/`.
