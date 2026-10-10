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
import { Observable, tap } from 'rxjs';
import {
  ConfirmTransferCommandRequest,
  InitiateTransferCommandRequest,
  TRANSFER_API,
  TransferChallengeCommandData,
  TransferCommandData,
  TransferQueryData,
} from '../../core/adapters';

@Injectable({ providedIn: 'root' })
export class TransfersStore {
  private readonly api = inject(TRANSFER_API);
  private readonly destroyRef = inject(DestroyRef);

  readonly challenge = signal<TransferChallengeCommandData | null>(null);
  readonly result = signal<TransferCommandData | null>(null);
  readonly history = signal<TransferQueryData[]>([]);
  readonly historyPage = signal(0);
  readonly historySize = signal(0);
  readonly historyTotalElements = signal(0);
  readonly historyTotalPages = signal(0);
  readonly historyLoading = signal(false);

  initiate(request: InitiateTransferCommandRequest): Observable<TransferChallengeCommandData> {
    return this.api.initiate(request).pipe(tap((challenge) => this.challenge.set(challenge)));
  }

  confirm(
    idempotencyKey: string,
    request: ConfirmTransferCommandRequest,
  ): Observable<TransferCommandData> {
    return this.api.confirm(idempotencyKey, request).pipe(
      tap((result) => {
        this.result.set(result);
        this.challenge.set(null);
      }),
    );
  }

  loadHistory(page: number, size: number): void {
    this.history.set([]);
    this.historyLoading.set(true);
    this.api
      .list(page, size)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.history.set(result.content);
          this.historyPage.set(result.page);
          this.historySize.set(result.size);
          this.historyTotalElements.set(result.totalElements);
          this.historyTotalPages.set(result.totalPages);
          this.historyLoading.set(false);
        },
        error: () => this.historyLoading.set(false),
      });
  }
}
