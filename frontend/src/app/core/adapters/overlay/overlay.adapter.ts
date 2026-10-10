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
import { IonicOverlayAdapter } from './ionic-overlay.adapter';

/** Where a toast appears relative to the viewport. */
export type ToastPosition = 'top' | 'middle' | 'bottom';

/** A framework-neutral toast request. */
export interface ToastRequest {
  readonly message: string;
  /** Milliseconds before auto-dismissal. */
  readonly duration: number;
  readonly position: ToastPosition;
  /** Label for the dismiss button. Omit for no button. */
  readonly dismissLabel?: string;
}

/**
 * The overlay capability the application depends on, stated without reference to the
 * component library that renders it.
 *
 * Ionic's `<ion-*>` components are presentational and stay in templates. Its imperative
 * controllers are different: they are singletons reached from services and interceptors,
 * and they are what a component-library upgrade breaks. Only toasts are used today; add
 * modals here when a screen needs one, rather than injecting `ModalController`.
 */
export interface OverlayAdapter {
  /** Presents a toast and resolves once it is shown, not once it is dismissed. */
  toast(request: ToastRequest): Promise<void>;
}

/**
 * Injection token for the active {@link OverlayAdapter}.
 *
 * Bound to the Ionic implementation by default, so a TestBed needs no provider unless it
 * wants to assert on toasts. Overriding in `app.config.ts` or a TestBed wins.
 */
export const OVERLAY = new InjectionToken<OverlayAdapter>('OverlayAdapter', {
  providedIn: 'root',
  factory: () => inject(IonicOverlayAdapter),
});
