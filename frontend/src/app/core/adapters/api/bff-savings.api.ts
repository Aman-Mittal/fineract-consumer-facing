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
import { Observable, map } from 'rxjs';
import { SavingsQueryControllerService } from '@bff/client';
import { mapPage } from './bff-page';
import type { Page, TransactionFilter } from './page';
import type {
  SavingsAccountListItemQueryData,
  SavingsAccountQueryData,
  SavingsApi,
  SavingsApplicationTemplateQueryData,
  SavingsChargeQueryData,
  SavingsTransactionQueryData,
} from './savings.api';

@Injectable({ providedIn: 'root' })
export class BffSavingsApi implements SavingsApi {
  private readonly query = inject(SavingsQueryControllerService);

  list(): Observable<SavingsAccountListItemQueryData[]> {
    return this.query.listSavingsAccounts();
  }

  get(savingsId: number): Observable<SavingsAccountQueryData> {
    return this.query.getSavingsAccount(savingsId);
  }

  listCharges(savingsId: number): Observable<SavingsChargeQueryData[]> {
    return this.query.getSavingsCharges(savingsId);
  }

  searchTransactions(
    savingsId: number,
    filter: TransactionFilter,
  ): Observable<Page<SavingsTransactionQueryData>> {
    return this.query
      .searchSavingsTransactions(
        savingsId,
        filter.fromDate,
        filter.toDate,
        filter.page,
        filter.size,
      )
      .pipe(map((response) => mapPage(response)));
  }

  getTransaction(
    savingsId: number,
    transactionId: number,
  ): Observable<SavingsTransactionQueryData> {
    return this.query.getSavingsTransaction(savingsId, transactionId);
  }

  getApplicationTemplate(productId?: number): Observable<SavingsApplicationTemplateQueryData> {
    return this.query.getSavingsApplicationTemplate(productId);
  }
}
