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
import {
  type SendOtpCommandData,
  type SendOtpCommandRequest,
  type SubmitRegistrationCommandData,
  type SubmitRegistrationCommandRequest,
  VerifyOtpCommandData,
  type VerifyOtpCommandRequest,
} from '@bff/client';
import { BffRegistrationApi } from './bff-registration.api';

// A value export, not `export type`: the registration screen compares against its status
// constants, which the generated client emits as a namespace beside the interface.
export { VerifyOtpCommandData };
export type {
  SendOtpCommandData,
  SendOtpCommandRequest,
  SubmitRegistrationCommandData,
  SubmitRegistrationCommandRequest,
  VerifyOtpCommandRequest,
};

/** Self-registration: identity, then a one-time password that binds the account. */
export interface RegistrationApi {
  submit(request: SubmitRegistrationCommandRequest): Observable<SubmitRegistrationCommandData>;
  sendOtp(request: SendOtpCommandRequest): Observable<SendOtpCommandData>;
  verifyOtp(request: VerifyOtpCommandRequest): Observable<VerifyOtpCommandData>;
}

export const REGISTRATION_API = new InjectionToken<RegistrationApi>('RegistrationApi', {
  providedIn: 'root',
  factory: () => inject(BffRegistrationApi),
});
