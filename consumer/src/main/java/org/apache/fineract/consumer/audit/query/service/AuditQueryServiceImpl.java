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

import java.util.List;
import org.apache.fineract.consumer.audit.query.data.AuditEventListQuery;
import org.apache.fineract.consumer.audit.query.data.AuditEventQueryData;
import org.apache.fineract.consumer.audit.query.domain.AuditEventQueryEntity;
import org.apache.fineract.consumer.audit.query.exception.AuditQueryDisabledException;
import org.apache.fineract.consumer.audit.query.repository.AuditQueryRepository;
import org.apache.fineract.consumer.infrastructure.access.data.ConsumerAction;
import org.apache.fineract.consumer.infrastructure.access.service.AccessPolicyEvaluator;
import org.apache.fineract.consumer.infrastructure.access.service.UserClientResolver;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuditQueryServiceImpl implements AuditQueryService {

    // Checked per call rather than with @ConditionalOnProperty on the controller: AOT evaluates bean
    // conditions at build time, so a native image would ignore the runtime setting.
    private static final String QUERY_ENABLED_PROPERTY = "${consumer.audit.query-enabled:false}";

    private final AccessPolicyEvaluator accessPolicyEvaluator;
    private final UserClientResolver userClientResolver;
    private final AuditQueryRepository auditQueryRepository;
    private final boolean queryEnabled;

    @Autowired
    public AuditQueryServiceImpl(AccessPolicyEvaluator accessPolicyEvaluator, UserClientResolver userClientResolver,
            AuditQueryRepository auditQueryRepository, @Value(QUERY_ENABLED_PROPERTY) boolean queryEnabled) {
        this.accessPolicyEvaluator = accessPolicyEvaluator;
        this.userClientResolver = userClientResolver;
        this.auditQueryRepository = auditQueryRepository;
        this.queryEnabled = queryEnabled;
    }

    @Override
    @Transactional(readOnly = true)
    public List<AuditEventQueryData> listEvents(Jwt jwt, AuditEventListQuery query) {
        if (!queryEnabled) {
            throw new AuditQueryDisabledException();
        }
        accessPolicyEvaluator.authorize(jwt, ConsumerAction.AUDIT_EVENT_LIST);
        Long userId = userClientResolver.resolveUserId(jwt);
        return auditQueryRepository
                .findAllByUserIdOrderByReceivedAtDescIdDesc(userId, PageRequest.of(query.getPage(), query.getSize()))
                .stream()
                .map(AuditQueryServiceImpl::toQueryData)
                .toList();
    }

    private static AuditEventQueryData toQueryData(AuditEventQueryEntity event) {
        return AuditEventQueryData.builder()
                .eventType(event.getEventType())
                .severity(event.getSeverity())
                .source(event.getSource())
                .receivedAt(event.getReceivedAt())
                .build();
    }
}
