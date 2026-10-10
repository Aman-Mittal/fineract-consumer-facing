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
  BeneficiaryChallengeCommandData,
  BeneficiaryCommandData,
  BeneficiaryQueryData,
  ConfirmAddBeneficiaryCommandRequest,
  ConfirmUpdateBeneficiaryCommandRequest,
  InitiateAddBeneficiaryCommandRequest,
  InitiateUpdateBeneficiaryCommandRequest,
} from '@bff/client';
import { BffBeneficiaryApi } from './bff-beneficiary.api';

export type {
  BeneficiaryChallengeCommandData,
  BeneficiaryCommandData,
  BeneficiaryQueryData,
  ConfirmAddBeneficiaryCommandRequest,
  ConfirmUpdateBeneficiaryCommandRequest,
  InitiateAddBeneficiaryCommandRequest,
  InitiateUpdateBeneficiaryCommandRequest,
};

/** Transfer beneficiaries. Adding and updating one is a two-step, OTP-confirmed command. */
export interface BeneficiaryApi {
  list(): Observable<BeneficiaryQueryData[]>;
  initiateAdd(
    request: InitiateAddBeneficiaryCommandRequest,
  ): Observable<BeneficiaryChallengeCommandData>;
  confirmAdd(request: ConfirmAddBeneficiaryCommandRequest): Observable<BeneficiaryCommandData>;
  initiateUpdate(
    publicId: string,
    request: InitiateUpdateBeneficiaryCommandRequest,
  ): Observable<BeneficiaryChallengeCommandData>;
  confirmUpdate(
    publicId: string,
    request: ConfirmUpdateBeneficiaryCommandRequest,
  ): Observable<BeneficiaryCommandData>;
  remove(publicId: string): Observable<unknown>;
}

export const BENEFICIARY_API = new InjectionToken<BeneficiaryApi>('BeneficiaryApi', {
  providedIn: 'root',
  factory: () => inject(BffBeneficiaryApi),
});
