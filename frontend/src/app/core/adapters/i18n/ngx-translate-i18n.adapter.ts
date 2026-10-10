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

import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateService } from '@ngx-translate/core';
import { Observable, map } from 'rxjs';
// Type-only: `i18n.adapter.ts` names this class as the token's default binding, and a value
// import back would close a runtime cycle.
import type { I18nAdapter, TranslateParams } from './i18n.adapter';

/**
 * {@link I18nAdapter} backed by `@ngx-translate/core`.
 *
 * With `app.config.ts`, which configures the loader, and the shared spec setup, this is the
 * only file permitted to import ngx-translate; `eslint.config.js` enforces it.
 */
@Injectable({ providedIn: 'root' })
export class NgxTranslateI18nAdapter implements I18nAdapter {
  // Named for the library so that `translate()` below can be the contract's method.
  private readonly ngxTranslate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly lang = signal(this.ngxTranslate.getCurrentLang() ?? '');
  readonly currentLang = this.lang.asReadonly();

  constructor() {
    // Mirrors language changes made anywhere, including during bootstrap before any adapter
    // method has run.
    this.ngxTranslate.onLangChange
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => this.lang.set(event.lang));
  }

  translate(key: string, params?: TranslateParams): string {
    return this.ngxTranslate.instant(key, params) as string;
  }

  use(lang: string): Observable<void> {
    return this.ngxTranslate.use(lang).pipe(map(() => undefined));
  }
}
