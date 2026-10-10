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

import { Injectable, inject } from '@angular/core';
import { ToastController } from '@ionic/angular/standalone';
// Type-only: `overlay.adapter.ts` names this class as the token's default binding, and a
// value import back would close a runtime cycle.
import type { OverlayAdapter, ToastRequest } from './overlay.adapter';

/**
 * {@link OverlayAdapter} backed by Ionic's `ToastController`.
 *
 * The only file in the application permitted to import Ionic's overlay controllers;
 * `eslint.config.js` enforces it.
 */
@Injectable({ providedIn: 'root' })
export class IonicOverlayAdapter implements OverlayAdapter {
  private readonly toastController = inject(ToastController);

  async toast(request: ToastRequest): Promise<void> {
    const toast = await this.toastController.create({
      message: request.message,
      duration: request.duration,
      position: request.position,
      buttons: request.dismissLabel ? [{ text: request.dismissLabel, role: 'cancel' }] : [],
    });
    await toast.present();
  }
}
