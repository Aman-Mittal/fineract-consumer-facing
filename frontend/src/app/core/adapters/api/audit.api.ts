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
  AuditEventCommandRequest,
  AuditEventQueryData,
  SubmitAuditEventsCommandRequest,
} from '@bff/client';
import { BffAuditApi } from './bff-audit.api';

export type { AuditEventCommandRequest, AuditEventQueryData, SubmitAuditEventsCommandRequest };

/**
 * Reading the audit trail.
 *
 * Submitting events is not here: `AuditService` posts them with `fetch` and `keepalive` so a
 * batch survives the page closing, which `HttpClient` and the generated client cannot do.
 */
export interface AuditApi {
  listEvents(page: number, size: number): Observable<AuditEventQueryData[]>;
}

export const AUDIT_API = new InjectionToken<AuditApi>('AuditApi', {
  providedIn: 'root',
  factory: () => inject(BffAuditApi),
});
