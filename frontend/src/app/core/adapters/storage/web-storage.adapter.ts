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

import { Injectable } from '@angular/core';
// Type-only: `storage.adapter.ts` names this class as the token's default binding, so a value
// import back would close a runtime cycle. `STORAGE_KEYS` is a value and lives in its own
// module for that reason.
import type { StorageAdapter } from './storage.adapter';
import { STORAGE_KEYS, type StorageKey, type StorageScope } from './storage-keys';

/**
 * {@link StorageAdapter} backed by `localStorage` and `sessionStorage`.
 *
 * The only file permitted to touch Web Storage directly; `eslint.config.js` enforces it.
 */
@Injectable({ providedIn: 'root' })
export class WebStorageAdapter implements StorageAdapter {
  read(key: StorageKey): string | null {
    const { key: name, scope } = STORAGE_KEYS[key];
    try {
      return this.area(scope)?.getItem(name) ?? null;
    } catch {
      return null;
    }
  }

  write(key: StorageKey, value: string): void {
    const { key: name, scope } = STORAGE_KEYS[key];
    try {
      this.area(scope)?.setItem(name, value);
    } catch {
      // Quota exceeded or storage denied: only persistence across a reload is lost.
    }
  }

  remove(key: StorageKey): void {
    const { key: name, scope } = STORAGE_KEYS[key];
    try {
      this.area(scope)?.removeItem(name);
    } catch {
      // Nothing to remove when storage is unreachable.
    }
  }

  private area(scope: StorageScope): Storage | null {
    try {
      return scope === 'session' ? sessionStorage : localStorage;
    } catch {
      // Reading the property itself throws when the origin is denied storage.
      return null;
    }
  }
}
