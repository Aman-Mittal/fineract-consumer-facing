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
 * Tests for the local no-i18n-library-import rule.
 *
 *   npm run test:eslint-rules
 */

const test = require('node:test');
const { RuleTester } = require('eslint');
const tseslint = require('typescript-eslint');
const rule = require('./no-i18n-library-import.js');

const ruleTester = new RuleTester({
  languageOptions: { parser: tseslint.parser, ecmaVersion: 2022, sourceType: 'module' },
});

const options = [
  { packages: ['@ngx-translate/core', '@ngx-translate/http-loader'], message: 'Use I18N.' },
];
const restricted = [{ messageId: 'restricted' }];

test('no-i18n-library-import', () => {
  ruleTester.run('no-i18n-library-import', rule, {
    valid: [
      { code: "import { Component } from '@angular/core';", options },
      // The adapter barrel, which is where application code is meant to go.
      { code: "import { TranslatePipe, I18N } from '../../core/adapters';", options },
      // A package whose name merely begins with a restricted one.
      { code: "import { X } from '@ngx-translate/core-extras';", options },
      // A different package in the same scope is not configured.
      { code: "import { X } from '@ngx-translate/other';", options },
      // A re-export with no source has nothing to check and must not throw.
      { code: 'const A = 1; export { A };', options },
      // Unconfigured, the rule does nothing.
      { code: "import { TranslatePipe } from '@ngx-translate/core';", options: [] },
    ],
    invalid: [
      { code: "import { TranslatePipe } from '@ngx-translate/core';", options, errors: restricted },
      {
        code: "import type { TranslateService } from '@ngx-translate/core';",
        options,
        errors: restricted,
      },
      {
        code: "import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';",
        options,
        errors: restricted,
      },
      { code: "import { X } from '@ngx-translate/core/sub';", options, errors: restricted },
      { code: "export * from '@ngx-translate/core';", options, errors: restricted },
      { code: "const m = import('@ngx-translate/core');", options, errors: restricted },
    ],
  });
});
