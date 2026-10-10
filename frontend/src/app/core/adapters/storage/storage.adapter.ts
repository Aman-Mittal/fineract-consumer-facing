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

import { InjectionToken, inject } from '@angular/core';
import { WebStorageAdapter } from './web-storage.adapter';
import type { StorageKey } from './storage-keys';

export { STORAGE_KEYS } from './storage-keys';
export type { StorageKey, StorageScope } from './storage-keys';

/**
 * Key-value persistence, stated as what the application needs rather than as Web Storage.
 *
 * Reads and writes never throw. Web Storage does throw where this app meets real users:
 * private browsing with a zero quota, and browser policies that deny storage to an origin.
 * Neither is a reason to break a screen, so failures read as "no stored value".
 */
export interface StorageAdapter {
  /** Reads a stored string, or `null` when absent or unreachable. */
  read(key: StorageKey): string | null;

  /** Stores a string. Does nothing when storage is unreachable. */
  write(key: StorageKey, value: string): void;

  /** Removes a key. */
  remove(key: StorageKey): void;
}

/** Injection token for the active {@link StorageAdapter}, defaulting to Web Storage. */
export const STORAGE = new InjectionToken<StorageAdapter>('StorageAdapter', {
  providedIn: 'root',
  factory: () => inject(WebStorageAdapter),
});
