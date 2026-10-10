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
  SavingsAccountListItemQueryData,
  SavingsAccountQueryData,
  SavingsApplicationTemplateQueryData,
  SavingsChargeQueryData,
  SavingsTransactionQueryData,
} from '@bff/client';
import { BffSavingsApi } from './bff-savings.api';
import type { Page, TransactionFilter } from './page';

export type {
  SavingsAccountListItemQueryData,
  SavingsAccountQueryData,
  SavingsApplicationTemplateQueryData,
  SavingsChargeQueryData,
  SavingsTransactionQueryData,
};

/** The consumer's savings accounts. Read-only. */
export interface SavingsApi {
  list(): Observable<SavingsAccountListItemQueryData[]>;
  get(savingsId: number): Observable<SavingsAccountQueryData>;
  listCharges(savingsId: number): Observable<SavingsChargeQueryData[]>;
  searchTransactions(
    savingsId: number,
    filter: TransactionFilter,
  ): Observable<Page<SavingsTransactionQueryData>>;
  getTransaction(savingsId: number, transactionId: number): Observable<SavingsTransactionQueryData>;
  getApplicationTemplate(productId?: number): Observable<SavingsApplicationTemplateQueryData>;
}

export const SAVINGS_API = new InjectionToken<SavingsApi>('SavingsApi', {
  providedIn: 'root',
  factory: () => inject(BffSavingsApi),
});
