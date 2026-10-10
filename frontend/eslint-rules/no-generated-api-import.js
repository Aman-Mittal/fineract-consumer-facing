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

const path = require('node:path');

/**
 * Keeps the generated BFF client behind the API adapters in `src/app/core/adapters/api`.
 *
 * The client in `src/openapi-client` is regenerated from the BFF's OpenAPI document by a
 * generator with its own release cadence. Stores, services and components depend on the
 * contracts in `core/adapters` instead, so a change in what the generator emits lands in the
 * adapters and nowhere else. See `docs/frontend/architecture/adapter-boundary.adoc`.
 *
 * Adapted from the rule of the same name in apache/fineract-backoffice-ui, which guards that
 * application's generated Fineract client.
 *
 * ## Matching
 *
 * - A package specifier is reported when it is one of `aliases` or a subpath of one
 *   (`@bff/client`, `@bff/client/model/x`). This is how the app reaches the client today.
 * - A relative specifier is resolved against the importing file and reported when it lands
 *   inside `dir`. Path segments are compared, so a sibling such as `src/openapi-client-v2`
 *   does not match.
 *
 * Configure with:
 *
 *   ['error', { dir: 'src/openapi-client', aliases: ['@bff/client'], message: '…' }]
 *
 * The locations allowed to name the client (the API adapters and the composition root that
 * configures it) turn the rule off with a `files` override, so the allowed set reads in one
 * place in `eslint.config.js`.
 */
module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Keep imports of the generated BFF client inside the API adapter boundary',
      recommended: true,
    },
    schema: [
      {
        type: 'object',
        properties: {
          dir: { type: 'string' },
          aliases: { type: 'array', items: { type: 'string' } },
          message: { type: 'string' },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      restricted: "'{{source}}' reaches into the generated BFF client. {{message}}",
    },
  },

  create(context) {
    const { dir, aliases = [], message = '' } = context.options[0] ?? {};
    if (!dir && aliases.length === 0) return {};

    // `context.cwd` is where ESLint was invoked: the frontend directory for `npm run lint`,
    // the editor integration and CI alike.
    const guarded = dir ? path.resolve(context.cwd, dir) : null;
    const fromDir = path.dirname(path.resolve(context.filename));

    function isGuarded(source) {
      if (source.startsWith('.')) {
        if (!guarded) return false;
        const resolved = path.resolve(fromDir, source);
        return resolved === guarded || resolved.startsWith(guarded + path.sep);
      }
      return aliases.some((alias) => source === alias || source.startsWith(alias + '/'));
    }

    function check(node, source) {
      if (typeof source !== 'string' || !isGuarded(source)) return;
      context.report({ node, messageId: 'restricted', data: { source, message } });
    }

    /** `import x from 'y'`, `export * from 'y'`, `export { x } from 'y'`. */
    function fromClause(node) {
      // A bare `export { x }` re-exports a local binding and has no source.
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

      CallExpression(node) {
        if (node.callee.type !== 'Identifier' || node.callee.name !== 'require') return;
        const [argument] = node.arguments;
        if (argument?.type === 'Literal') check(argument, argument.value);
      },
    };
  },
};
