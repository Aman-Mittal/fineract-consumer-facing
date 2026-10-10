/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

// @ts-check
const eslint = require('@eslint/js');
const { defineConfig } = require('eslint/config');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');
// Published as ESM; under CommonJS the plugin arrives behind `.default`.
const unicorn = require('eslint-plugin-unicorn').default;
const security = require('eslint-plugin-security');
const importX = require('eslint-plugin-import-x');
const { createTypeScriptImportResolver } = require('eslint-import-resolver-typescript');
const cognitiveComplexity = require('./eslint-rules/cognitive-complexity.js');
const noGeneratedApiImport = require('./eslint-rules/no-generated-api-import.js');
const noI18nLibraryImport = require('./eslint-rules/no-i18n-library-import.js');

/**
 * Rules written for this repository, kept here rather than published.
 *
 * `cognitive-complexity` stands in for SonarQube's rule of the same name. The ESLint port of the
 * SonarQube rules, `eslint-plugin-sonarjs`, is LGPL-3.0-only (Apache Category X), so it is not
 * used; see docs/frontend/development/build-and-test.adoc.
 *
 * `no-generated-api-import` holds the adapter boundary (docs/frontend/architecture/
 * adapter-boundary.adoc). The generated BFF client and Ionic's imperative overlay controllers
 * are reached only through the contracts in src/app/core/adapters. The implementations there,
 * and the composition root that configures them, are the only files allowed to import either.
 * Specs are not exempt: a spec mocks the contract, not the generated service or the controller
 * behind it.
 */
const local = {
  rules: {
    'cognitive-complexity': cognitiveComplexity,
    'no-generated-api-import': noGeneratedApiImport,
    'no-i18n-library-import': noI18nLibraryImport,
  },
};

/** Ionic's imperative surface, reached through the OVERLAY adapter. */
const IONIC_CONTROLLERS = [
  'ActionSheetController',
  'AlertController',
  'LoadingController',
  'MenuController',
  'ModalController',
  'PickerController',
  'PopoverController',
  'ToastController',
];

module.exports = defineConfig([
  {
    ignores: ['src/openapi-client/', 'dist/', 'test-results/'],
  },
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommended,
      tseslint.configs.stylistic,
      angular.configs.tsRecommended,
      // `unopinionated` rather than `recommended`: the recommended set carries a large stylistic
      // component (filename casing, abbreviation expansion, `for…of` over `.forEach`) that would
      // rewrite working code to no benefit. The unopinionated set is the correctness half.
      unicorn.configs.unopinionated,
      // eval, unsafe regex, non-literal fs paths, timing-unsafe comparison, pseudo-random.
      security.configs.recommended,
      // Import correctness only. eslint-plugin-import-x rather than eslint-plugin-import, which
      // apache/fineract-backoffice-ui uses: eslint-plugin-import does not support ESLint 10.
      importX.flatConfigs.recommended,
      importX.flatConfigs.typescript,
    ],
    plugins: { local },
    processor: angular.processInlineTemplates,
    settings: {
      'import-x/resolver-next': [createTypeScriptImportResolver({ alwaysTryTypes: true })],
    },
    rules: {
      // SonarQube's default threshold for cognitive complexity. See eslint-rules/.
      'local/cognitive-complexity': ['error', { threshold: 15 }],
      // `@bff/client` maps to src/openapi-client, which is generated from the BFF's OpenAPI spec
      // and not committed; CI lints without it, so the resolver cannot see it there.
      'import-x/no-unresolved': ['error', { ignore: ['^@bff/client(/|$)'] }],

      // --- rules switched off from the sets above, each for a reason -------------------------
      //
      // Off: every report is an `obj[key]` read of a typed option map or route-parameter
      // record, which is the normal way to index one in a typed codebase. Same call as
      // apache/fineract-backoffice-ui.
      'security/detect-object-injection': 'off',
      // Off: `loadComponent: () => import(...).then((m) => m.X)` is Angular's documented
      // lazy-route idiom, and most reports are that shape. Rewriting each as an async function
      // changes working code to satisfy a preference.
      'unicorn/prefer-await': 'off',
      // Off: top-level await changes main.ts's module evaluation semantics, which is a
      // deliberate change to make on its own, not a lint autofix.
      'unicorn/prefer-top-level-await': 'off',
      // Off: `.catch(() => undefined)` and `{ error: () => undefined }` say "swallow this"
      // explicitly; removing the `undefined` makes the intent read as an accident.
      'unicorn/no-useless-undefined': 'off',
      // Off: this is a browser application and `window.location` is the honest name.
      'unicorn/prefer-global-this': 'off',
      // Off: its autofix does not compile here. `Array#toSorted()` needs lib ES2023 and
      // tsconfig targets ES2022, so the fix produces TS2550. Every report already sorts a
      // copy (`[...rows].sort(...)`). Reconsider when the target moves.
      'unicorn/no-array-sort': 'off',
      // Off: whether a ternary, an early return or a negated `if` reads better depends on
      // which branch is the common case, which a rule cannot know. Style, not a defect.
      'unicorn/prefer-ternary': 'off',
      'unicorn/prefer-early-return': 'off',
      'unicorn/no-negated-condition': 'off',

      // --- the adapter boundary ------------------------------------------------------------
      'local/no-generated-api-import': [
        'error',
        {
          dir: 'src/openapi-client',
          aliases: ['@bff/client'],
          message:
            "Depend on a contract from 'core/adapters' instead. See docs/frontend/architecture/adapter-boundary.adoc.",
        },
      ],
      'no-restricted-imports': [
        'error',
        {
          paths: ['@ionic/angular/standalone', '@ionic/angular'].map((name) => ({
            name,
            importNames: IONIC_CONTROLLERS,
            message:
              "Use the OVERLAY adapter from 'core/adapters'. See docs/frontend/architecture/adapter-boundary.adoc.",
          })),
        },
      ],
      // Ratcheted: files that predate the I18N and STORAGE adapters are listed in
      // eslint-suppressions.json, which may only shrink. `npm run lint:prune` removes the
      // entries for a file once it is migrated.
      'local/no-i18n-library-import': [
        'error',
        {
          packages: ['@ngx-translate/core', '@ngx-translate/http-loader'],
          message:
            "Use I18N or the appTranslate pipe from 'core/adapters'; in specs, provideI18nTesting(). See docs/frontend/architecture/adapter-boundary.adoc.",
        },
      ],
      'no-restricted-globals': [
        'error',
        ...['localStorage', 'sessionStorage'].map((name) => ({
          name,
          message:
            "Use the STORAGE adapter from 'core/adapters'. See docs/frontend/architecture/adapter-boundary.adoc.",
        })),
      ],
      'no-empty': ['error', { allowEmptyCatch: true }],
      '@typescript-eslint/no-empty-function': ['error', { allow: ['arrowFunctions'] }],
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: 'app',
          style: 'camelCase',
        },
      ],
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: 'app',
          style: 'kebab-case',
        },
      ],
    },
  },
  {
    // The API adapters map the generated client to the contracts; the composition root and
    // the shared test setup configure it.
    files: [
      'src/app/core/adapters/api/**/*.ts',
      'src/app/app.config.ts',
      'src/app/testing/bff-api-testing.ts',
    ],
    rules: { 'local/no-generated-api-import': 'off' },
  },
  {
    files: ['src/app/core/adapters/overlay/**/*.ts'],
    rules: { 'no-restricted-imports': 'off' },
  },
  {
    // The I18N adapter wraps ngx-translate; the composition root configures its loader and the
    // shared spec setup provides it.
    files: [
      'src/app/core/adapters/i18n/**/*.ts',
      'src/app/app.config.ts',
      'src/app/testing/i18n-testing.ts',
    ],
    rules: { 'local/no-i18n-library-import': 'off' },
  },
  {
    files: ['src/app/core/adapters/storage/**/*.ts'],
    rules: { 'no-restricted-globals': 'off' },
  },
  {
    files: ['**/*.html'],
    extends: [angular.configs.templateRecommended],
    rules: {
      '@angular-eslint/template/eqeqeq': ['error', { allowNullOrUndefined: true }],
    },
  },
]);
