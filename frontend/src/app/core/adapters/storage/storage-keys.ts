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

/** Which Web Storage area a key lives in. */
export type StorageScope = 'local' | 'session';

/**
 * Every key the application persists in the browser.
 *
 * Writes go through these names only, so what the origin stores stays reviewable in one
 * place. The stored names are unchanged from before the STORAGE adapter existed, so values
 * already in users' browsers are still found.
 */
export const STORAGE_KEYS = {
  /** The per-browser id sent as `X-Device-Fingerprint`. */
  deviceId: { key: 'bff.device-id', scope: 'local' },
  /** The language the user picked in the language switcher. */
  language: { key: 'app.lang', scope: 'local' },
} as const satisfies Record<string, { key: string; scope: StorageScope }>;

export type StorageKey = keyof typeof STORAGE_KEYS;
