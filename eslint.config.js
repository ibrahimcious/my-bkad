import js from '@eslint/js'
import tseslint from 'typescript-eslint'

/**
 * Business modules under src/modules/. Each module is self-contained and
 * must not import from sibling modules — shared code belongs in
 * src/shared/. Adding a module name here automatically extends the
 * boundary rule to it.
 */
const MODULES = ['budget', 'employee', 'asset']

/**
 * One config block per module. A module may not import from any other
 * module, nor from routes (routes compose modules, never the reverse).
 *
 * Enforcement is by import string, so cross-`src` imports must use the
 * `@/` alias (e.g. `@/modules/budget/...`) rather than relative paths.
 */
const moduleBoundaryConfigs = MODULES.map((moduleName) => {
  const otherModules = MODULES.filter((name) => name !== moduleName)
  return {
    files: [`src/modules/${moduleName}/**/*.{ts,tsx}`],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: otherModules.flatMap((other) => [
                `@/modules/${other}`,
                `@/modules/${other}/**`,
              ]),
              message:
                'Cross-module imports are forbidden. Move shared code to src/shared/.',
            },
            {
              group: ['@/routes', '@/routes/**'],
              message:
                'Modules must not import from routes. Routes compose modules, not the reverse.',
            },
          ],
        },
      ],
    },
  }
})

export default tseslint.config(
  {
    ignores: [
      'dist',
      '.output',
      '.tanstack',
      '.vite',
      'node_modules',
      'src/routeTree.gen.ts',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...moduleBoundaryConfigs,
  {
    // The production server entry is a plain Node ESM script — give it
    // the Node and Web globals it relies on.
    files: ['server.js'],
    languageOptions: {
      globals: {
        process: 'readonly',
        console: 'readonly',
        URL: 'readonly',
        Response: 'readonly',
      },
    },
  },
)
