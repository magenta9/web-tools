# Project Architecture

This document outlines the refactored architecture of the Web Tools project, which addresses the previous issues of code duplication, monolithic components, and lack of shared abstractions.

## Directory Structure

```
app/
├── components/
│   ├── shared/           # Reusable UI components
│   │   ├── HistoryPanel.tsx
│   │   ├── CodeInput.tsx
│   │   ├── CodeOutput.tsx
│   │   └── ToolLayout.tsx
│   ├── image/            # Image converter specific components
│   │   ├── ImageConverterTabs.tsx
│   │   ├── KeyToUrlConverter.tsx
│   │   └── UrlToKeyConverter.tsx
│   ├── json/             # JSON tool specific components
│   │   ├── JsonValidator.tsx
│   │   └── JsonFormatter.tsx
│   ├── jwt/              # JWT tool specific components
│   │   ├── JwtDecoder.tsx
│   │   └── JwtEncoder.tsx
│   ├── timestamp/        # Timestamp converter specific components
│   │   ├── TimestampToDateConverter.tsx
│   │   └── DateToTimestampConverter.tsx
│   ├── layout/           # Layout components
│   │   ├── Header.tsx
│   │   └── Layout.tsx
│   └── ui/               # Additional UI components
├── hooks/                # Custom React hooks
│   ├── useHistory.ts
│   ├── useLocalStorage.ts
│   ├── useCopyToClipboard.ts
│   └── useToggle.ts
├── utils/                # Utility functions
│   ├── formatJson.ts
│   ├── validateJson.ts
│   ├── jwt.ts
│   ├── imageConversion.ts
│   └── timestamp.ts
├── types/                # TypeScript type definitions
│   └── index.ts
├── lib/                  # Shared business logic (future)
├── tools/                # Tool-specific pages
│   ├── image/
│   ├── json/
│   ├── jwt/
│   ├── timestamp/
│   └── diff/
└── providers/            # React context providers
    └── ThemeProvider.tsx
```

## Shared Abstractions

### 1. Types (`app/types/`)
Centralized TypeScript interfaces used across the application:
- `HistoryItem`: Common structure for tool history
- `ValidationResult`: Standardized validation response
- `CopyResult`: Clipboard operation result
- `Theme`: Theme configuration type

### 2. Hooks (`app/hooks/`)
Custom hooks to abstract common functionality:
- `useHistory`: Manages tool history with localStorage persistence
- `useLocalStorage`: Generic localStorage state management
- `useCopyToClipboard`: Clipboard operations with success feedback
- `useToggle`: Toggle state management

### 3. Utils (`app/utils/`)
Pure utility functions for business logic:
- `formatJson`: JSON formatting with different styles
- `validateJson`: JSON validation and statistics
- `jwt`: JWT encoding/decoding utilities
- `imageConversion`: Image processing utilities
- `timestamp`: Timestamp conversion utilities

### 4. Shared Components (`app/components/shared/`)
Reusable UI components:
- `HistoryPanel`: Consistent history display across tools
- `CodeInput`: Input area with copy/clear functionality
- `CodeOutput`: Output display with copy/download options
- `ToolLayout`: Standard layout wrapper for tools

## Component Refactoring

### Before
- Single large components (400-600 lines)
- Mixed concerns (UI, state, business logic)
- Duplicated code across tools
- No reusable abstractions

### After
- Smaller, focused components (50-150 lines)
- Clear separation of concerns
- Shared utilities and hooks
- Consistent patterns across tools

### Examples

#### Image Converter
- **Before**: 597 lines in single file
- **After**:
  - Main component: 70 lines
  - ImageConverterTabs: 40 lines
  - KeyToUrlConverter: 90 lines
  - UrlToKeyConverter: 80 lines

#### JWT Tool
- **Before**: 484 lines in single file
- **After**:
  - Main component: 94 lines
  - JwtDecoder: 120 lines
  - JwtEncoder: 110 lines

## Benefits Achieved

1. **Reduced Code Duplication**
   - Common history functionality extracted to shared hook
   - Reusable UI components for consistent experience
   - Shared utility functions for business logic

2. **Improved Maintainability**
   - Smaller components are easier to understand and modify
   - Clear separation between UI and business logic
   - Centralized types for better type safety

3. **Better Developer Experience**
   - Consistent patterns across tools
   - Reusable abstractions speed up development
   - Better TypeScript support with centralized types

4. **Enhanced Testability**
   - Pure utility functions easy to unit test
   - Custom hooks can be tested in isolation
   - Smaller components with single responsibilities

## Migration Strategy

The refactoring was completed in phases:
1. Created shared directory structure
2. Extracted common types and interfaces
3. Created custom hooks for repeated functionality
4. Extracted utility functions
5. Created shared UI components
6. Refactored each tool into smaller components
7. Updated all components to use shared abstractions

## Future Improvements

1. **Add comprehensive tests** for utilities and hooks
2. **Implement error boundaries** for better error handling
3. **Create component library** for consistent design system
4. **Add internationalization** support
5. **Implement caching** for expensive operations
6. **Add analytics** to track tool usage

## Conventions

1. **File Naming**
   - Components: PascalCase (e.g., `CodeInput.tsx`)
   - Hooks: camelCase with `use` prefix (e.g., `useHistory.ts`)
   - Utils: camelCase (e.g., `formatJson.ts`)

2. **Import Organization**
   - React imports first
   - Third-party libraries
   - Internal imports with @ alias
   - Relative imports last

3. **Component Structure**
   - Props interface at the top
   - Component implementation
   - Default export

This architecture provides a solid foundation for scaling the application with new tools and features while maintaining code quality and developer productivity.