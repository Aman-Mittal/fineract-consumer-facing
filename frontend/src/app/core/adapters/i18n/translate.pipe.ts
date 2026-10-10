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

import { Pipe, PipeTransform, inject } from '@angular/core';
import { I18N, TranslateParams } from './i18n.adapter';

/**
 * Template-side translation: `{{ 'summary.title' | appTranslate }}`.
 *
 * Replaces ngx-translate's `| translate`, so a template names the application's capability
 * rather than the library providing it. Migrating a component is an import swap plus a rename
 * at each call site. Same name as in apache/fineract-backoffice-ui.
 *
 * Impure, as ngx-translate's own pipe is: a pure pipe caches on its inputs, and the key does
 * not change when the language does. The memo keeps the per-change-detection cost to a string
 * comparison.
 */
@Pipe({ name: 'appTranslate', pure: false })
export class TranslatePipe implements PipeTransform {
  private readonly i18n = inject(I18N);

  private memoKey: string | null = null;
  private memoValue = '';

  transform(key: string | null | undefined, params?: TranslateParams): string {
    if (!key) {
      return '';
    }
    // The language is part of the memo key, so a language switch misses and re-resolves.
    const memoKey = `${this.i18n.currentLang()} ${key} ${params ? JSON.stringify(params) : ''}`;
    if (memoKey !== this.memoKey) {
      this.memoKey = memoKey;
      this.memoValue = this.i18n.translate(key, params);
    }
    return this.memoValue;
  }
}
