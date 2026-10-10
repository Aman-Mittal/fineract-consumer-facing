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
import { SummaryQueryControllerService } from '@bff/client';
import type { AccountsSummaryQueryData } from '@bff/client';
import type { AccountsSummary, SummaryApi } from './summary.api';

/**
 * Maps the BFF's summary to cards. Entries without an id are dropped because a card links to
 * the account by id, and a missing balance reads as zero.
 */
export function mapAccountsSummary(summary: AccountsSummaryQueryData): AccountsSummary {
  return {
    savings: (summary.savings ?? [])
      .filter((item) => item.id != null)
      .map((item) => ({
        id: item.id!,
        accountNo: item.accountNo,
        productName: item.productName,
        status: item.status,
        currency: item.currency,
        balance: item.accountBalance ?? 0,
      })),
    loans: (summary.loans ?? [])
      .filter((item) => item.id != null)
      .map((item) => ({
        id: item.id!,
        accountNo: item.accountNo,
        productName: item.productName,
        status: item.status,
        currency: item.currency,
        totalOutstanding: item.loanBalance ?? 0,
      })),
  };
}

@Injectable({ providedIn: 'root' })
export class BffSummaryApi implements SummaryApi {
  private readonly query = inject(SummaryQueryControllerService);

  get(): Observable<AccountsSummary> {
    return this.query.getAccountsSummary().pipe(map((summary) => mapAccountsSummary(summary)));
  }
}
