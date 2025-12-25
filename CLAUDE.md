# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Plan & Review

### Before starting work

Always in plan mode to make a plan
After get the plan, make sure you Write the plan to .claude/tasks/TASK_NAME.md.
The plan should be a detailed implementation plan and the reasoning behind them, as well as tasks broken down.
plan needs to be written in Chinese
If the task require external knowledge or certain package, also research to get latest knowledge (Use Task tool for research)
Don't over plan it, always think MVP.
Once you write the plan, firstly ask me to review it. Do not continue until I approve the plan.

### While implementing

You should update the plan as you work.
After you complete tasks in the plan, you should update and append detailed descriptions of the changes you made, so following tasks can be easily hand over to other engineers.
Make every task and code change you do as simple as possible. We want to avoid making any massive or complex changes. Every change should impact as little code as possible. Everything is about simplicity.

NOTICE:

- DO NOT BE LAZY. NEVER BE LAZY. IF THERE IS A BUG FIND THE ROOT CAUSE AND FIX IT. NO TEMPORARY FIXES. YOU ARE A SENIOR DEVELOPER. NEVER BE LAZY
- MAKE ALL FIXES AND CODE CHANGES AS SIMPLE AS HUMANLY POSSIBLE. THEY SHOULD ONLY IMPACT NECESSARY CODE RELEVANT TO THE TASK AND NOTHING ELSE. IT SHOULD IMPACT AS LITTLE CODE AS POSSIBLE. YOUR GOAL IS TO NOT INTRODUCE ANY BUGS. IT'S ALL ABOUT SIMPLICITY

## Development Commands

```bash
# Install dependencies
bun install

# Development server (includes API mock server)
bun dev

# Build for production (static export to /out)
bun build

# Lint code
bun lint
```

## Project Architecture

A **static web application** built with Next.js 15 and App Router, configured for static export. The app provides 8 developer tools that run entirely client-side.

### Static Export Configuration

- `next.config.js` sets `output: 'export'` for static generation
- Base path `/web-tools` and asset prefix applied in production
- Build outputs to `/out` directory with `.nojekyll` file for GitHub Pages
- Images are unoptimized (static export limitation)

### Tool Structure Pattern

Each tool follows this pattern:
- Independent route: `/app/[tool]/page.tsx`
- Local state with `useState`
- History tracking via `useHistory` hook (key: `[tool]_history`)
- Shared UI components from `app/components/shared/`
- Tool-specific logic in `app/utils/` and sub-components

### Shared Abstractions

- **Hooks** (`app/hooks/`): `useHistory`, `useLocalStorage`, `useCopyToClipboard`
- **Utils** (`app/utils/`): Business logic for each tool type
- **Components** (`app/components/shared/`): `HistoryPanel`, `CodeInput`, `CodeOutput`, `ToolLayout`
- **Types** (`app/types/`): Centralized TypeScript interfaces
- **Providers** (`app/providers/`): `ThemeProvider`, `ToastProvider`, `I18nProvider`

### Current Tools

1. **jwt** - JWT encode/decode
2. **json** - JSON format/validate
3. **image** - Image conversion
4. **timestamp** - Timestamp conversion
5. **diff** - Text comparison
6. **aisql** - Natural language to SQL
7. **jsonfix** - AI JSON fix
8. **translate** - AI translation

## Important Implementation Details

1. **History Management**: `useHistory` hook manages localStorage persistence (max 100 items)
2. **Theme System**: `ThemeProvider` handles dark/light mode via localStorage
3. **Security**: JSON tool uses `new Function()` fallback for parsing; Diff uses `dangerouslySetInnerHTML`
4. **API Server**: Go-based API server in `server-go/` provides backend functionality for AI features

## Deployment

GitHub Pages workflow in `.github/workflows/deploy.yml` auto-deploys on push to main. Static files served from `/web-tools/` subdirectory.