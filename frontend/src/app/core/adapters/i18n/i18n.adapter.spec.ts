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

import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { provideI18nTesting, setTestTranslations } from '../../../testing/i18n-testing';
import { I18N } from './i18n.adapter';
import { NgxTranslateI18nAdapter } from './ngx-translate-i18n.adapter';
import { TranslatePipe } from './translate.pipe';

@Component({
  selector: 'app-translate-host',
  imports: [TranslatePipe],
  template: `<span>{{ 'greeting' | appTranslate: { name: 'Ada' } }}</span>`,
})
class TranslateHostComponent {}

describe('I18N adapter', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), ...provideI18nTesting()],
    });
  });

  it('resolves to the ngx-translate implementation by default', () => {
    expect(TestBed.inject(I18N)).toBe(TestBed.inject(NgxTranslateI18nAdapter));
  });

  it('returns the key for a missing translation', () => {
    expect(TestBed.inject(I18N).translate('no.such.key')).toBe('no.such.key');
  });

  it('switches language, tracks it in currentLang and interpolates params', async () => {
    const i18n = TestBed.inject(I18N);
    setTestTranslations('fr', { greeting: 'Bonjour {{name}}' });

    await firstValueFrom(i18n.use('fr'));

    expect(i18n.currentLang()).toBe('fr');
    expect(i18n.translate('greeting', { name: 'Ada' })).toBe('Bonjour Ada');
  });

  it('re-renders the appTranslate pipe when the language changes', async () => {
    setTestTranslations('en', { greeting: 'Hello {{name}}' });
    setTestTranslations('fr', { greeting: 'Bonjour {{name}}' });
    await firstValueFrom(TestBed.inject(I18N).use('en'));

    const fixture = TestBed.createComponent(TranslateHostComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toBe('Hello Ada');

    await firstValueFrom(TestBed.inject(I18N).use('fr'));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toBe('Bonjour Ada');
  });

  it('renders an empty string for an absent key', () => {
    const pipe = TestBed.runInInjectionContext(() => new TranslatePipe());
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(undefined)).toBe('');
  });
});
