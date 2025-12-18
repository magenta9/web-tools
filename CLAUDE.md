# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Install dependencies
bun install

# Development server
bun dev

# Build for production (static export)
bun build

# Lint code
bun lint
```

## Project Architecture

This is a **static web application** built with Next.js 15 and App Router, configured for static export. The application provides 5 developer tools that run entirely client-side.

### Key Architecture Decisions

1. **Static Export Configuration**:
   - `next.config.js` sets `output: 'export'` for static generation
   - Base path (`/web-tools`) and asset prefix are automatically added in production
   - Build outputs to `/out` directory with `.nojekyll` file for GitHub Pages

2. **Client-Side Processing**:
   - All tool pages use `'use client'` directive
   - No API routes or server-side processing
   - All data processing happens in the browser for privacy

3. **Tool Structure Pattern**:
   Each tool follows the same pattern:
   - Independent page in `/app/[tool]/page.tsx`
   - Local state management with useState
   - History tracking via localStorage (key: `[tool]_history`)
   - Shared UI components (Layout, Header)
   - Tool-specific CSS in `tools.css`

### Important Implementation Details

1. **History Management**:
   - Each tool maintains its own history in localStorage
   - History items include: type, input, output, timestamp, and mode
   - Maximum 100 history items per tool

2. **Theme System**:
   - `ThemeProvider.tsx` manages dark/light mode
   - Theme state persisted in localStorage
   - Direct DOM manipulation for theme switching

3. **Security Considerations**:
   - JSON tool uses `new Function()` fallback for parsing (security risk)
   - Diff tool uses `dangerouslySetInnerHTML` for HTML rendering
   - All inputs should be sanitized when working with these areas

### Current Technical Debt

1. **Code Duplication**: History management, clipboard operations, and UI components are duplicated across tools
2. **Type Safety**: Uses `any` types in several places, particularly in JSON parsing functions
3. **Accessibility**: Missing ARIA labels and keyboard navigation
4. **Error Handling**: Uses browser alerts instead of user-friendly error UI

### Deployment

- GitHub Pages workflow in `.github/workflows/deploy.yml`
- Automatic deployment on push to main branch
- Static files served from `/web-tools/` subdirectory