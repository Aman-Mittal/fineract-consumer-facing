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
  LOAN_API,
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
  TransactionFilter,
  UserObligeeQueryData,
  WithdrawLoanApplicationCommandRequest,
} from '../../core/adapters';
import { byAccountNo } from '../../shared/utils/account-sort';

@Injectable({ providedIn: 'root' })
export class LoansStore {
  private readonly api = inject(LOAN_API);
  private readonly destroyRef = inject(DestroyRef);

  readonly loans = signal<LoanAccountListItemQueryData[]>([]);
  readonly selected = signal<LoanAccountQueryData | null>(null);
  readonly charges = signal<LoanChargeQueryData[]>([]);
  readonly guarantors = signal<LoanGuarantorQueryData[]>([]);
  readonly obligees = signal<UserObligeeQueryData[]>([]);
  readonly transactions = signal<LoanTransactionQueryData[]>([]);
  readonly transactionsPage = signal(0);
  readonly transactionsSize = signal(0);
  readonly transactionsTotalElements = signal(0);
  readonly transactionsTotalPages = signal(0);
  readonly selectedTransaction = signal<LoanTransactionQueryData | null>(null);
  readonly template = signal<LoanApplicationTemplateQueryData | null>(null);
  readonly schedulePreview = signal<LoanScheduleQueryData | null>(null);
  readonly draft = signal<LoanApplicationCommandData | null>(null);
  readonly loading = signal(false);

  loadLoans(): void {
    this.loans.set([]);
    this.loading.set(true);
    this.api
      .list()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (rows) => {
          this.loans.set([...rows].sort(byAccountNo));
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  loadLoan(loanId: number): void {
    this.selected.set(null);
    this.loading.set(true);
    this.api
      .get(loanId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (account) => {
          this.selected.set(account);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  loadCharges(loanId: number): void {
    this.charges.set([]);
    this.api
      .listCharges(loanId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (rows) => this.charges.set(rows),
        error: () => {},
      });
  }

  loadGuarantors(loanId: number): void {
    this.guarantors.set([]);
    this.api
      .listGuarantors(loanId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (rows) => this.guarantors.set(rows),
        error: () => {},
      });
  }

  loadObligees(): void {
    this.obligees.set([]);
    this.api
      .listObligees()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (rows) => this.obligees.set(rows),
        error: () => {},
      });
  }

  loadTransactions(loanId: number, filter: TransactionFilter = {}): void {
    this.transactions.set([]);
    this.loading.set(true);
    this.api
      .listTransactions(loanId, filter)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (page) => {
          this.transactions.set(page.content);
          this.transactionsPage.set(page.page);
          this.transactionsSize.set(page.size);
          this.transactionsTotalElements.set(page.totalElements);
          this.transactionsTotalPages.set(page.totalPages);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  loadTransaction(loanId: number, transactionId: number): void {
    this.selectedTransaction.set(null);
    this.api
      .getTransaction(loanId, transactionId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (tx) => this.selectedTransaction.set(tx),
        error: () => {},
      });
  }

  loadTemplate(productId?: number): void {
    this.template.set(null);
    this.api
      .getApplicationTemplate(productId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (template) => this.template.set(template),
        error: () => {},
      });
  }

  previewSchedule(request: LoanSchedulePreviewQueryRequest): Observable<LoanScheduleQueryData> {
    return this.api
      .previewSchedule(request)
      .pipe(tap((schedule) => this.schedulePreview.set(schedule)));
  }

  submit(
    idempotencyKey: string,
    request: SubmitLoanApplicationCommandRequest,
  ): Observable<LoanApplicationCommandData> {
    return this.api
      .submitApplication(idempotencyKey, request)
      .pipe(tap((draft) => this.draft.set(draft)));
  }

  modify(
    loanId: number,
    idempotencyKey: string,
    request: ModifyLoanApplicationCommandRequest,
  ): Observable<LoanApplicationCommandData> {
    return this.api
      .modifyApplication(loanId, idempotencyKey, request)
      .pipe(tap((draft) => this.draft.set(draft)));
  }

  withdraw(
    loanId: number,
    idempotencyKey: string,
    request: WithdrawLoanApplicationCommandRequest,
  ): Observable<LoanApplicationCommandData> {
    return this.api
      .withdrawApplication(loanId, idempotencyKey, request)
      .pipe(tap(() => this.draft.set(null)));
  }
}
