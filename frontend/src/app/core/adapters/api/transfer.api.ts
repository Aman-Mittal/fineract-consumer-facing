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
import { Observable } from 'rxjs';
import type {
  ConfirmTransferCommandRequest,
  InitiateTransferCommandRequest,
  TransferChallengeCommandData,
  TransferCommandData,
  TransferQueryData,
} from '@bff/client';
import { BffTransferApi } from './bff-transfer.api';
import type { Page } from './page';

export type {
  ConfirmTransferCommandRequest,
  InitiateTransferCommandRequest,
  TransferChallengeCommandData,
  TransferCommandData,
  TransferQueryData,
};

/** Transfers between accounts: a two-step, OTP-confirmed command, and the history. */
export interface TransferApi {
  initiate(request: InitiateTransferCommandRequest): Observable<TransferChallengeCommandData>;
  confirm(
    idempotencyKey: string,
    request: ConfirmTransferCommandRequest,
  ): Observable<TransferCommandData>;
  list(page: number, size: number): Observable<Page<TransferQueryData>>;
}

export const TRANSFER_API = new InjectionToken<TransferApi>('TransferApi', {
  providedIn: 'root',
  factory: () => inject(BffTransferApi),
});
