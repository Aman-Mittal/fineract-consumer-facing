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
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

package org.apache.fineract.consumer.audit.query.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.util.List;
import org.apache.fineract.consumer.audit.query.data.AuditEventListQuery;
import org.apache.fineract.consumer.audit.query.exception.AuditQueryDisabledException;
import org.apache.fineract.consumer.audit.query.repository.AuditQueryRepository;
import org.apache.fineract.consumer.infrastructure.access.data.ConsumerAction;
import org.apache.fineract.consumer.infrastructure.access.service.AccessPolicyEvaluator;
import org.apache.fineract.consumer.infrastructure.access.service.UserClientResolver;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;
import org.springframework.security.oauth2.jwt.Jwt;

@ExtendWith(MockitoExtension.class)
class AuditQueryServiceImplTest {

    private static final Long USER_ID = 42L;

    @Mock
    private AccessPolicyEvaluator accessPolicyEvaluator;

    @Mock
    private UserClientResolver userClientResolver;

    @Mock
    private AuditQueryRepository auditQueryRepository;

    private static Jwt jwt() {
        return Jwt.withTokenValue("token").header("alg", "none").subject("subject").build();
    }

    private static AuditEventListQuery query() {
        return AuditEventListQuery.builder().page(0).size(20).build();
    }

    @Test
    void listEventsIsRejectedWhenTheQueryEndpointIsDisabled() {
        AuditQueryServiceImpl service = new AuditQueryServiceImpl(accessPolicyEvaluator, userClientResolver,
                auditQueryRepository, false);

        assertThatThrownBy(() -> service.listEvents(jwt(), query()))
                .isInstanceOf(AuditQueryDisabledException.class);
        verifyNoInteractions(accessPolicyEvaluator, userClientResolver, auditQueryRepository);
    }

    @Test
    void listEventsAuthorizesAndReadsTheCallersEventsWhenEnabled() {
        Jwt jwt = jwt();
        AuditQueryServiceImpl service = new AuditQueryServiceImpl(accessPolicyEvaluator, userClientResolver,
                auditQueryRepository, true);
        when(userClientResolver.resolveUserId(jwt)).thenReturn(USER_ID);
        when(auditQueryRepository.findAllByUserIdOrderByReceivedAtDescIdDesc(eq(USER_ID), any(Pageable.class)))
                .thenReturn(List.of());

        assertThat(service.listEvents(jwt, query())).isEmpty();
        verify(accessPolicyEvaluator).authorize(jwt, ConsumerAction.AUDIT_EVENT_LIST);
    }
}
