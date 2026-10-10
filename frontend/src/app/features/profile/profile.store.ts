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
import { Observable } from 'rxjs';
import {
  ChargesFilter,
  ForgotPasswordCommandRequest,
  ResetPasswordCommandRequest,
  USER_API,
  UserChargeQueryData,
  UserImageQueryData,
  UserProfileQueryData,
} from '../../core/adapters';

const IMAGE_MAX_WIDTH = 256;
const IMAGE_MAX_HEIGHT = 256;

@Injectable({ providedIn: 'root' })
export class ProfileStore {
  private readonly api = inject(USER_API);
  private readonly destroyRef = inject(DestroyRef);

  readonly profile = signal<UserProfileQueryData | null>(null);
  readonly charges = signal<UserChargeQueryData[]>([]);
  readonly totalFilteredRecords = signal(0);
  readonly image = signal<UserImageQueryData | null>(null);
  readonly loading = signal(false);

  loadProfile(): void {
    this.profile.set(null);
    this.loading.set(true);
    this.api
      .getProfile()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (profile) => {
          this.profile.set(profile);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  loadCharges(filter: ChargesFilter): void {
    this.charges.set([]);
    this.totalFilteredRecords.set(0);
    this.api
      .listCharges(filter)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.charges.set(result.charges);
          this.totalFilteredRecords.set(result.totalFilteredRecords);
        },
        error: () => {},
      });
  }

  loadImage(): void {
    this.image.set(null);
    this.api
      .getImage(IMAGE_MAX_WIDTH, IMAGE_MAX_HEIGHT)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (image) => this.image.set(image),
        error: () => {},
      });
  }

  forgotPassword(request: ForgotPasswordCommandRequest): Observable<unknown> {
    return this.api.forgotPassword(request);
  }

  resetPassword(request: ResetPasswordCommandRequest): Observable<unknown> {
    return this.api.resetPassword(request);
  }
}
