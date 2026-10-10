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
  ConfirmPasswordChangeCommandRequest,
  ForgotPasswordCommandRequest,
  InitiatePasswordChangeCommandRequest,
  ResetPasswordCommandRequest,
  UserChargeQueryData,
  UserImageQueryData,
  UserPasswordChangeChallengeCommandData,
  UserProfileQueryData,
} from '@bff/client';
import { BffUserApi } from './bff-user.api';

export type {
  ConfirmPasswordChangeCommandRequest,
  ForgotPasswordCommandRequest,
  InitiatePasswordChangeCommandRequest,
  ResetPasswordCommandRequest,
  UserChargeQueryData,
  UserImageQueryData,
  UserPasswordChangeChallengeCommandData,
  UserProfileQueryData,
};

/** The status and paging a charges query accepts. */
export interface ChargesFilter {
  status: string;
  page: number;
  size: number;
}

/** One page of the consumer's charges, with the total across all pages. */
export interface UserChargesPage {
  readonly charges: UserChargeQueryData[];
  readonly totalFilteredRecords: number;
}

/** The signed-in consumer's profile, charges and credentials. */
export interface UserApi {
  getProfile(): Observable<UserProfileQueryData>;
  listCharges(filter: ChargesFilter): Observable<UserChargesPage>;
  getImage(maxWidth: number, maxHeight: number): Observable<UserImageQueryData>;
  forgotPassword(request: ForgotPasswordCommandRequest): Observable<unknown>;
  resetPassword(request: ResetPasswordCommandRequest): Observable<unknown>;
  initiatePasswordChange(
    request: InitiatePasswordChangeCommandRequest,
  ): Observable<UserPasswordChangeChallengeCommandData>;
  confirmPasswordChange(request: ConfirmPasswordChangeCommandRequest): Observable<unknown>;
}

export const USER_API = new InjectionToken<UserApi>('UserApi', {
  providedIn: 'root',
  factory: () => inject(BffUserApi),
});
