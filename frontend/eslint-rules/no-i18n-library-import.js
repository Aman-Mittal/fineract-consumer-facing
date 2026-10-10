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
 * Keeps the translation library behind the I18N adapter in `src/app/core/adapters/i18n`.
 *
 * A rule of its own rather than another `no-restricted-imports` entry because the migration
 * is ratcheted by `eslint-suppressions.json`, which counts violations per rule id. Sharing an
 * id with the Ionic-controller boundary would let a file trade one kind of violation for the
 * other without the count moving. apache/fineract-backoffice-ui splits its boundaries the
 * same way.
 *
 * Reports any import whose specifier is one of `packages` or a subpath of one. Configure with:
 *
 *   ['error', { packages: ['@ngx-translate/core', '@ngx-translate/http-loader'], message: '…' }]
 *
 * The files allowed to import the library turn the rule off with a `files` override in
 * `eslint.config.js`.
 */
module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Keep imports of the translation library inside the I18N adapter',
      recommended: true,
    },
    schema: [
      {
        type: 'object',
        properties: {
          packages: { type: 'array', items: { type: 'string' } },
          message: { type: 'string' },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      restricted: "'{{source}}' is the translation library. {{message}}",
    },
  },

  create(context) {
    const { packages = [], message = '' } = context.options[0] ?? {};
    if (packages.length === 0) return {};

    function check(node, source) {
      if (typeof source !== 'string') return;
      if (!packages.some((name) => source === name || source.startsWith(name + '/'))) return;
      context.report({ node, messageId: 'restricted', data: { source, message } });
    }

    function fromClause(node) {
      if (!node.source) return;
      check(node.source, node.source.value);
    }

    return {
      ImportDeclaration: fromClause,
      ExportAllDeclaration: fromClause,
      ExportNamedDeclaration: fromClause,
      ImportExpression(node) {
        if (node.source?.type === 'Literal') check(node.source, node.source.value);
      },
    };
  },
};
