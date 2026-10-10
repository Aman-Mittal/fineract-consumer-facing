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
  LoanAccountListItemQueryData,
  LoanAccountQueryData,
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
} from '@bff/client';
import { BffLoanApi } from './bff-loan.api';
import type { Page, TransactionFilter } from './page';

export type {
  LoanAccountListItemQueryData,
  LoanAccountQueryData,
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
};

/**
 * The consumer's loans, the loans they guarantee, and loan applications.
 *
 * Commands take an idempotency key chosen by the caller, so a retried submission is not
 * applied twice.
 */
export interface LoanApi {
  list(): Observable<LoanAccountListItemQueryData[]>;
  get(loanId: number): Observable<LoanAccountQueryData>;
  listCharges(loanId: number): Observable<LoanChargeQueryData[]>;
  listGuarantors(loanId: number): Observable<LoanGuarantorQueryData[]>;
  /** Loans the signed-in consumer guarantees for other borrowers. */
  listObligees(): Observable<UserObligeeQueryData[]>;
  listTransactions(
    loanId: number,
    filter: TransactionFilter,
  ): Observable<Page<LoanTransactionQueryData>>;
  getTransaction(loanId: number, transactionId: number): Observable<LoanTransactionQueryData>;
  getApplicationTemplate(productId?: number): Observable<LoanApplicationTemplateQueryData>;
  previewSchedule(request: LoanSchedulePreviewQueryRequest): Observable<LoanScheduleQueryData>;
  submitApplication(
    idempotencyKey: string,
    request: SubmitLoanApplicationCommandRequest,
  ): Observable<LoanApplicationCommandData>;
  modifyApplication(
    loanId: number,
    idempotencyKey: string,
    request: ModifyLoanApplicationCommandRequest,
  ): Observable<LoanApplicationCommandData>;
  withdrawApplication(
    loanId: number,
    idempotencyKey: string,
    request: WithdrawLoanApplicationCommandRequest,
  ): Observable<LoanApplicationCommandData>;
}

export const LOAN_API = new InjectionToken<LoanApi>('LoanApi', {
  providedIn: 'root',
  factory: () => inject(BffLoanApi),
});
