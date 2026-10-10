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
import {
  LoansCommandControllerService,
  LoansQueryControllerService,
  UserQueryControllerService,
} from '@bff/client';
import { mapPage } from './bff-page';
import type {
  LoanAccountListItemQueryData,
  LoanAccountQueryData,
  LoanApi,
  LoanApplicationCommandData,
  LoanApplicationTemplateQueryData,
  LoanChargeQueryData,
  LoanGuarantorQueryData,
  LoanScheduleQueryData,
  LoanSchedulePreviewQueryRequest,
  LoanTransactionQueryData,
  ModifyLoanApplicationCommandRequest,
  SubmitLoanApplicationCommandRequest,
  UserObligeeQueryData,
  WithdrawLoanApplicationCommandRequest,
} from './loan.api';
import type { Page, TransactionFilter } from './page';

/** The BFF's loan state-transition endpoint takes the transition as a path segment. */
const WITHDRAW_COMMAND = 'withdraw';

@Injectable({ providedIn: 'root' })
export class BffLoanApi implements LoanApi {
  private readonly query = inject(LoansQueryControllerService);
  private readonly command = inject(LoansCommandControllerService);
  private readonly userQuery = inject(UserQueryControllerService);

  list(): Observable<LoanAccountListItemQueryData[]> {
    return this.query.listLoanAccounts();
  }

  get(loanId: number): Observable<LoanAccountQueryData> {
    return this.query.getLoanAccount(loanId);
  }

  listCharges(loanId: number): Observable<LoanChargeQueryData[]> {
    return this.query.getLoanCharges(loanId);
  }

  listGuarantors(loanId: number): Observable<LoanGuarantorQueryData[]> {
    return this.query.getLoanGuarantors(loanId);
  }

  listObligees(): Observable<UserObligeeQueryData[]> {
    return this.userQuery.getUserObligees();
  }

  listTransactions(
    loanId: number,
    filter: TransactionFilter,
  ): Observable<Page<LoanTransactionQueryData>> {
    return this.query
      .listLoanTransactions(
        loanId,
        filter.page,
        filter.size,
        undefined,
        filter.fromDate,
        filter.toDate,
      )
      .pipe(map((response) => mapPage(response)));
  }

  getTransaction(loanId: number, transactionId: number): Observable<LoanTransactionQueryData> {
    return this.query.getLoanTransaction(loanId, transactionId);
  }

  getApplicationTemplate(productId?: number): Observable<LoanApplicationTemplateQueryData> {
    return this.query.getLoanApplicationTemplate(productId);
  }

  previewSchedule(request: LoanSchedulePreviewQueryRequest): Observable<LoanScheduleQueryData> {
    return this.query.previewLoanSchedule(request);
  }

  submitApplication(
    idempotencyKey: string,
    request: SubmitLoanApplicationCommandRequest,
  ): Observable<LoanApplicationCommandData> {
    return this.command.submitLoanApplication(idempotencyKey, request);
  }

  modifyApplication(
    loanId: number,
    idempotencyKey: string,
    request: ModifyLoanApplicationCommandRequest,
  ): Observable<LoanApplicationCommandData> {
    return this.command.modifyLoanApplication(idempotencyKey, loanId, request);
  }

  withdrawApplication(
    loanId: number,
    idempotencyKey: string,
    request: WithdrawLoanApplicationCommandRequest,
  ): Observable<LoanApplicationCommandData> {
    return this.command.withdrawLoanApplication(idempotencyKey, loanId, WITHDRAW_COMMAND, request);
  }
}
