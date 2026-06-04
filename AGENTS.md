# TimeBlockrr - Monorepo

## Project Structure

```
TimeBlockrr/
├── package.json              # Root workspace config
├── apps/
│   └── web/                  # Primary web application
│       ├── src/
│       │   ├── components/    # React components (single source of truth)
│       │   ├── store/         # Zustand state management
│       │   ├── types/         # Shared TypeScript interfaces
│       │   ├── utils/         # time.ts, defaults.ts
│       │   ├── themes/        # Theme color definitions
│       │   └── App.tsx
│       ├── public/
│       │   └── themes/         # Skin CSS files (glassmorphism, warm-minimalism)
│       ├── index.html
│       ├── package.json
│       └── vite.config.ts
├── server/                   # Express backend
│   ├── src/
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
└── .opencode/               # opencode skill (code-check-please)
```

## Technology Stack

- **Frontend**: React 18 + TypeScript + Vite
- **State**: Zustand
- **Drag & Drop**: @dnd-kit
- **Dates**: date-fns
- **Backend**: Express + TypeScript
- **Workspace**: npm workspaces

## Skins/Themes

The app supports multiple visual skins:
- **glassmorphism** (default): Modern translucent glass effect
- **warm-minimalism**: Soft organic colors and clean design

Skins are complete CSS files loaded dynamically via `<link>` in `App.tsx`.
Themes (light/dark/business) are CSS custom property overrides within each skin.

## Development

```bash
# Install dependencies for all workspaces
npm install

# Run web app
npm run dev:web

# Run backend server
npm run dev:server

# Type check
npm run typecheck
```

## Key Architectural Decisions

1. **Single source of truth**: All shared code lives in `apps/web/src/`. No duplication across projects.
2. **Skin system**: Visual styles are swappable CSS files, not separate projects.
3. **Web-first**: The web app is the primary deployment target.
4. **Backend placeholder**: `server/` is ready for API development (auth, persistence, sharing).

## Code Quality Notes

- Extracted duplicated time math into `src/utils/time.ts`
- Extracted duplicated defaults into `src/utils/defaults.ts`
- No test suite yet (TODO)
- Store uses localStorage (web) - backend migration planned
