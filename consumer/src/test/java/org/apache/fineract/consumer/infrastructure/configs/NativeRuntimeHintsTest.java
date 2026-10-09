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

package org.apache.fineract.consumer.infrastructure.configs;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.aot.hint.MemberCategory;
import org.springframework.aot.hint.RuntimeHints;
import org.springframework.aot.hint.TypeReference;
import org.springframework.aot.hint.predicate.RuntimeHintsPredicates;

class NativeRuntimeHintsTest {

    private final RuntimeHints hints = new RuntimeHints();

    NativeRuntimeHintsTest() {
        new NativeRuntimeHints().registerHints(hints, getClass().getClassLoader());
    }

    @Test
    void registersTomcatConnectorPropertyAccess() {
        assertThat(RuntimeHintsPredicates.reflection()
                .onType(TypeReference.of("org.apache.coyote.AbstractProtocol"))
                .withMemberCategory(MemberCategory.INVOKE_PUBLIC_METHODS)).accepts(hints);
    }

    @Test
    void registersTheLiquibaseChangeModelUsedForChecksums() {
        assertThat(NativeRuntimeHints.liquibaseChangeModel(getClass().getClassLoader()))
                .contains("liquibase.change.core.CreateTableChange", "liquibase.change.ColumnConfig",
                        "liquibase.change.ConstraintsConfig");
        assertThat(RuntimeHintsPredicates.reflection()
                .onType(TypeReference.of("liquibase.change.core.CreateIndexChange"))
                .withMemberCategories(MemberCategory.INVOKE_PUBLIC_METHODS, MemberCategory.ACCESS_DECLARED_FIELDS))
                .accepts(hints);
    }

    @Test
    void registersTheCaffeineClassesSelectedForTheOwnershipCache() {
        assertThat(RuntimeHintsPredicates.reflection()
                .onType(TypeReference.of("com.github.benmanes.caffeine.cache.SSW"))
                .withMemberCategory(MemberCategory.ACCESS_DECLARED_FIELDS)).accepts(hints);
    }

    @Test
    void registersSpringSecurityJacksonModulesUsedByTheAuthorizationServer() {
        assertThat(NativeRuntimeHints.springSecurityJackson(getClass().getClassLoader()))
                .contains("org.springframework.security.jackson.CoreJacksonModule",
                        "org.springframework.security.oauth2.server.authorization.jackson."
                                + "OAuth2AuthorizationServerJacksonModule");
        assertThat(RuntimeHintsPredicates.reflection()
                .onType(TypeReference.of("org.springframework.security.web.jackson.WebServletJacksonModule"))
                .withMemberCategory(MemberCategory.INVOKE_DECLARED_CONSTRUCTORS)).accepts(hints);
    }

    @Test
    void registersJdkCollectionTypesStoredAsJacksonTypeIds() {
        assertThat(RuntimeHintsPredicates.reflection()
                .onType(TypeReference.of("java.util.Collections$UnmodifiableMap"))).accepts(hints);
    }

    @Test
    void registersArrayTypesInstantiatedReflectively() {
        assertThat(RuntimeHintsPredicates.reflection().onType(UUID[].class)).accepts(hints);
    }
}
