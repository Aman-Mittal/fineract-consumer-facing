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

import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, finalize, shareReplay, tap } from 'rxjs';
import {
  AUTH_API,
  LoginChallengeCommandData,
  LoginCommandRequest,
  SessionCommandData,
  VerifyTwoFactorCommandRequest,
} from '../adapters';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(AUTH_API);

  private readonly sessionExpiresAt = signal<string | null>(null);
  readonly isAuthenticated = computed(() => this.sessionExpiresAt() !== null);

  private refreshInFlight: Observable<SessionCommandData> | null = null;

  login(request: LoginCommandRequest): Observable<LoginChallengeCommandData> {
    return this.api.login(request);
  }

  verifyTwoFactor(request: VerifyTwoFactorCommandRequest): Observable<SessionCommandData> {
    return this.api.verifyTwoFactor(request).pipe(tap((session) => this.adoptSession(session)));
  }

  refresh(): Observable<SessionCommandData> {
    if (!this.refreshInFlight) {
      this.refreshInFlight = this.api.refreshSession().pipe(
        tap((session) => this.adoptSession(session)),
        finalize(() => (this.refreshInFlight = null)),
        shareReplay(1),
      );
    }
    return this.refreshInFlight;
  }

  logout(): Observable<unknown> {
    return this.api.logout().pipe(tap(() => this.clearSession()));
  }

  clearSession(): void {
    this.sessionExpiresAt.set(null);
  }

  private adoptSession(session: SessionCommandData): void {
    this.sessionExpiresAt.set(session.expiresAt ?? null);
  }
}
