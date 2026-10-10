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

import { mapPage } from './bff-page';
import { mapAccountsSummary } from './bff-summary.api';
import { mapUserCharges } from './bff-user.api';

describe('BFF adapter mappers', () => {
  describe('mapPage', () => {
    it('passes a complete envelope through', () => {
      expect(
        mapPage({ content: [{ id: 1 }], page: 2, size: 10, totalElements: 21, totalPages: 3 }),
      ).toEqual({ content: [{ id: 1 }], page: 2, size: 10, totalElements: 21, totalPages: 3 });
    });

    it('defaults every absent field', () => {
      expect(mapPage({})).toEqual({
        content: [],
        page: 0,
        size: 0,
        totalElements: 0,
        totalPages: 0,
      });
    });
  });

  describe('mapAccountsSummary', () => {
    it('maps savings and loans to cards, keeping the BFF order', () => {
      expect(
        mapAccountsSummary({
          savings: [
            {
              id: 2,
              accountNo: '002',
              productName: 'Passbook',
              status: 'Active',
              currency: 'USD',
              accountBalance: 50,
            },
            {
              id: 1,
              accountNo: '001',
              productName: 'Passbook',
              status: 'Active',
              currency: 'USD',
              accountBalance: 10,
            },
          ],
          loans: [
            {
              id: 7,
              accountNo: '007',
              productName: 'Personal',
              status: 'Active',
              currency: 'USD',
              loanBalance: 900,
            },
          ],
        }),
      ).toEqual({
        savings: [
          {
            id: 2,
            accountNo: '002',
            productName: 'Passbook',
            status: 'Active',
            currency: 'USD',
            balance: 50,
          },
          {
            id: 1,
            accountNo: '001',
            productName: 'Passbook',
            status: 'Active',
            currency: 'USD',
            balance: 10,
          },
        ],
        loans: [
          {
            id: 7,
            accountNo: '007',
            productName: 'Personal',
            status: 'Active',
            currency: 'USD',
            totalOutstanding: 900,
          },
        ],
      });
    });

    it('drops entries without an id and reads a missing balance as zero', () => {
      const summary = mapAccountsSummary({
        savings: [{ accountNo: 'x' }, { id: 3 }],
        loans: [{ accountNo: 'y' }, { id: 4 }],
      });

      expect(summary.savings).toEqual([{ id: 3, balance: 0 }]);
      expect(summary.loans).toEqual([{ id: 4, totalOutstanding: 0 }]);
    });

    it('treats absent lists as empty', () => {
      expect(mapAccountsSummary({})).toEqual({ savings: [], loans: [] });
    });
  });

  describe('mapUserCharges', () => {
    it('defaults absent charges and total', () => {
      expect(mapUserCharges({})).toEqual({ charges: [], totalFilteredRecords: 0 });
    });

    it('passes present values through', () => {
      expect(mapUserCharges({ charges: [{ id: 1 }], totalFilteredRecords: 9 })).toEqual({
        charges: [{ id: 1 }],
        totalFilteredRecords: 9,
      });
    });
  });
});
