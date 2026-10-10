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

import { InjectionToken, Signal, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { NgxTranslateI18nAdapter } from './ngx-translate-i18n.adapter';

/** Interpolation values substituted into a translated string. */
export type TranslateParams = Record<string, unknown>;

/**
 * The translation capability the application depends on, stated in its own terms.
 *
 * Measured rather than guessed: templates translate keys, a handful of services translate in
 * code (toasts, error messages), and the language switcher changes the language. That is the
 * whole surface, so an alternative implementation, such as Angular's own `$localize`, has a
 * finite contract to satisfy.
 */
export interface I18nAdapter {
  /** The language in force, as a signal so templates re-render when it changes. */
  readonly currentLang: Signal<string>;

  /**
   * Resolves a key against the active language, synchronously. Returns the key itself when
   * no translation exists, so a missing key is visible rather than blank.
   */
  translate(key: string, params?: TranslateParams): string;

  /** Switches the active language, completing once its catalogue is loaded. */
  use(lang: string): Observable<void>;
}

/**
 * Injection token for the active {@link I18nAdapter}.
 *
 * Bound to the ngx-translate implementation by default, so a TestBed that provides
 * `provideI18nTesting()` needs nothing further. Overriding in `app.config.ts` or a TestBed
 * wins.
 */
export const I18N = new InjectionToken<I18nAdapter>('I18nAdapter', {
  providedIn: 'root',
  factory: () => inject(NgxTranslateI18nAdapter),
});
