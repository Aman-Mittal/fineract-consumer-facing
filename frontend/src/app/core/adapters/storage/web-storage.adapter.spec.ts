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

import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { STORAGE, STORAGE_KEYS } from './storage.adapter';
import { WebStorageAdapter } from './web-storage.adapter';

describe('WebStorageAdapter', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
  });

  afterEach(() => vi.restoreAllMocks());

  it('is what STORAGE resolves to by default', () => {
    expect(TestBed.inject(STORAGE)).toBe(TestBed.inject(WebStorageAdapter));
  });

  it('writes, reads and removes under the registered key names', () => {
    const storage = TestBed.inject(STORAGE);

    storage.write('language', 'fr');
    expect(localStorage.getItem(STORAGE_KEYS.language.key)).toBe('fr');
    expect(storage.read('language')).toBe('fr');

    storage.remove('language');
    expect(storage.read('language')).toBeNull();
  });

  it('keeps the names used before the adapter existed', () => {
    expect(STORAGE_KEYS.deviceId.key).toBe('bff.device-id');
    expect(STORAGE_KEYS.language.key).toBe('app.lang');
  });

  it('reads as absent and swallows writes when storage throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('denied', 'SecurityError');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError');
    });
    const storage = TestBed.inject(STORAGE);

    expect(storage.read('deviceId')).toBeNull();
    expect(() => storage.write('deviceId', 'x')).not.toThrow();
  });
});
