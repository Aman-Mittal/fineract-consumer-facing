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

import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LoanCard, SUMMARY_API, SavingsCard } from '../../core/adapters';
import { byAccountNo } from '../../shared/utils/account-sort';

@Injectable({ providedIn: 'root' })
export class SummaryStore {
  private readonly summaryApi = inject(SUMMARY_API);
  private readonly destroyRef = inject(DestroyRef);

  readonly savingsCards = signal<SavingsCard[]>([]);
  readonly loanCards = signal<LoanCard[]>([]);
  readonly loading = signal(false);

  readonly topSavings = computed(() => this.savingsCards().slice(0, 3));
  readonly topLoans = computed(() => this.loanCards().slice(0, 3));
  readonly savingsCount = computed(() => this.savingsCards().length);
  readonly loansCount = computed(() => this.loanCards().length);

  load(): void {
    this.savingsCards.set([]);
    this.loanCards.set([]);
    this.loading.set(true);
    this.summaryApi
      .get()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (summary) => {
          this.savingsCards.set([...summary.savings].sort(byAccountNo));
          this.loanCards.set([...summary.loans].sort(byAccountNo));
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }
}
