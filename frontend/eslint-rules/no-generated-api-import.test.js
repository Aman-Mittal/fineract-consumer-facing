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

'use strict';

/**
 * Tests for the local no-generated-api-import rule.
 *
 *   npm run test:eslint-rules
 */

const path = require('node:path');
const test = require('node:test');
const { RuleTester } = require('eslint');
const tseslint = require('typescript-eslint');
const rule = require('./no-generated-api-import.js');

const ruleTester = new RuleTester({
  languageOptions: { parser: tseslint.parser, ecmaVersion: 2022, sourceType: 'module' },
});

const options = [{ dir: 'src/openapi-client', aliases: ['@bff/client'], message: 'Use a port.' }];
const restricted = [{ messageId: 'restricted' }];

/** A store two directories below `src/app`, where most data access sits. */
const FEATURE = path.resolve('src/app/features/loans/loans.store.ts');

test('no-generated-api-import', () => {
  ruleTester.run('no-generated-api-import', rule, {
    valid: [
      // Other packages are somebody else's boundary.
      { code: "import { Component } from '@angular/core';", options, filename: FEATURE },
      // A package whose name merely begins with the alias.
      { code: "import { X } from '@bff/client-extras';", options, filename: FEATURE },
      { code: "import { X } from '@bff/clients';", options, filename: FEATURE },
      // The ports, which is where application code is meant to go.
      { code: "import { LOAN_API } from '../../core/adapters';", options, filename: FEATURE },
      // A sibling directory whose name begins with the guarded one.
      { code: "import { Y } from '../../../openapi-client-v2';", options, filename: FEATURE },
      // A re-export with no source has nothing to check and must not throw.
      { code: 'const A = 1; export { A };', options, filename: FEATURE },
      // Not a module specifier, and not the `require` we mean.
      { code: "const p = require.resolve('@bff/client');", options, filename: FEATURE },
      { code: "foo.require('@bff/client');", options, filename: FEATURE },
      // Unconfigured, the rule does nothing rather than guessing.
      { code: "import { Configuration } from '@bff/client';", options: [], filename: FEATURE },
    ],
    invalid: [
      // The alias, which is how the app reaches the client.
      {
        code: "import { LoansQueryControllerService } from '@bff/client';",
        options,
        filename: FEATURE,
        errors: restricted,
      },
      // `import type` counts: a generated type in a signature is the coupling being guarded.
      {
        code: "import type { LoanAccountQueryData } from '@bff/client';",
        options,
        filename: FEATURE,
        errors: restricted,
      },
      // A deep import through the alias.
      {
        code: "import { Configuration } from '@bff/client/configuration';",
        options,
        filename: FEATURE,
        errors: restricted,
      },
      // A relative path into the generated directory, at whatever depth.
      {
        code: "import { Configuration } from '../../../openapi-client';",
        options,
        filename: FEATURE,
        errors: restricted,
      },
      {
        code: "import { Configuration } from '../openapi-client/configuration';",
        options,
        filename: path.resolve('src/app/app.config.ts'),
        errors: restricted,
      },
      // Every other syntax that pulls a module in.
      { code: "export * from '@bff/client';", options, filename: FEATURE, errors: restricted },
      {
        code: "export { Configuration } from '@bff/client';",
        options,
        filename: FEATURE,
        errors: restricted,
      },
      { code: "const m = import('@bff/client');", options, filename: FEATURE, errors: restricted },
      { code: "require('@bff/client');", options, filename: FEATURE, errors: restricted },
    ],
  });
});
