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

import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ToastController } from '@ionic/angular/standalone';
import { IonicOverlayAdapter } from './ionic-overlay.adapter';
import { OVERLAY } from './overlay.adapter';

describe('IonicOverlayAdapter', () => {
  const present = vi.fn(() => Promise.resolve());
  const create = vi.fn(() => Promise.resolve({ present }));

  beforeEach(() => {
    present.mockClear();
    create.mockClear();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: ToastController, useValue: { create } },
      ],
    });
  });

  it('is what OVERLAY resolves to by default', () => {
    expect(TestBed.inject(OVERLAY)).toBe(TestBed.inject(IonicOverlayAdapter));
  });

  it('creates and presents a toast with a cancel-role dismiss button', async () => {
    await TestBed.inject(OVERLAY).toast({
      message: 'Saved',
      duration: 5000,
      position: 'bottom',
      dismissLabel: 'Dismiss',
    });

    expect(create).toHaveBeenCalledWith({
      message: 'Saved',
      duration: 5000,
      position: 'bottom',
      buttons: [{ text: 'Dismiss', role: 'cancel' }],
    });
    expect(present).toHaveBeenCalledTimes(1);
  });

  it('renders no button without a dismiss label', async () => {
    await TestBed.inject(OVERLAY).toast({ message: 'Saved', duration: 3000, position: 'top' });

    expect(create).toHaveBeenCalledWith({
      message: 'Saved',
      duration: 3000,
      position: 'top',
      buttons: [],
    });
  });
});
