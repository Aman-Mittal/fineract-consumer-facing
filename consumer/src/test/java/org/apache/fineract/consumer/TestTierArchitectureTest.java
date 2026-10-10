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


package org.apache.fineract.consumer;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;
import static org.apache.fineract.consumer.ArchitectureFixtures.TEST_CLASSES;

import com.tngtech.archunit.base.DescribedPredicate;
import com.tngtech.archunit.core.domain.JavaAnnotation;
import java.util.Set;
import org.junit.jupiter.api.Test;

/**
 * Test-tier rule from AGENTS.md "Test tiers": unit tests, {@code @WebMvcTest} slices, and Cucumber E2E only. The
 * Cucumber glue needs no exemption: it drives an already running BFF over HTTP and boots no Spring context.
 */
class TestTierArchitectureTest {

    /** Matched by simple name, so the rule holds across Spring Boot's test-autoconfigure package moves. */
    private static final Set<String> FORBIDDEN_TEST_ANNOTATIONS = Set.of("SpringBootTest", "DataJpaTest");

    @Test
    void testsUseNoFullContextOrDataJpaTier() {
        noClasses().should().beMetaAnnotatedWith(springBootTestAnnotation())
                .because("AGENTS.md Test tiers: no @SpringBootTest or @DataJpaTest tier between unit tests and Cucumber E2E")
                .check(TEST_CLASSES);
    }

    @Test
    void testsUseNoTestcontainers() {
        noClasses().should().dependOnClassesThat().resideInAPackage("org.testcontainers..")
                .because("AGENTS.md Test tiers: no Testcontainers tier between unit tests and Cucumber E2E").check(TEST_CLASSES);
    }

    private static DescribedPredicate<JavaAnnotation<?>> springBootTestAnnotation() {
        return DescribedPredicate.describe("@SpringBootTest or @DataJpaTest",
                annotation -> annotation.getRawType().getPackageName().startsWith("org.springframework.boot")
                        && FORBIDDEN_TEST_ANNOTATIONS.contains(annotation.getRawType().getSimpleName()));
    }
}
