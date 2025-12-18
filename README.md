# Web Tools

A collection of useful web tools built with Next.js and TypeScript.

## Features

- **JWT Tool**: Encode and decode JSON Web Tokens
- **JSON Tool**: Format, validate, and manipulate JSON data
- **Image Tool**: Convert and resize images
- **Timestamp Tool**: Convert timestamps between different formats
- **Diff Tool**: Compare text and find differences

## Tech Stack

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- Font Awesome Icons

## Getting Started

First, install the dependencies:

```bash
bun install
```

Then, run the development server:

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Build for Production

To build the project for production:

```bash
bun build
```

The static files will be generated in the `out` directory, ready for deployment.

## Available Scripts

- `bun dev` - Start the development server
- `bun run build` - Build for production (creates .nojekyll for GitHub Pages)
- `bun run build:analyze` - Build with bundle analyzer
- `bun run start` - Start production server
- `bun run lint` - Run ESLint
- `bun run lint:fix` - Fix ESLint issues automatically
- `bun run format` - Format code with Prettier
- `bun run format:check` - Check code formatting
- `bun run type-check` - Run TypeScript type checking without emitting files

## Code Quality

This project uses:

- **TypeScript**: Enabled with strict mode for type safety
- **ESLint**: For linting JavaScript/TypeScript code
- **Prettier**: For code formatting
- **Husky**: For Git hooks
- **lint-staged**: For running linters on staged files

### Pre-commit Hooks

The project automatically runs:
- ESLint with auto-fix on staged files
- Prettier formatting on staged files

## Deployment

This project is configured for static export and can be deployed to:

- GitHub Pages (automatically creates .nojekyll file)
- Netlify
- Vercel
- Any static hosting service

## License

MIT License