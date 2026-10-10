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

import static com.tngtech.archunit.core.domain.JavaClass.Predicates.resideInAPackage;
import static com.tngtech.archunit.core.domain.JavaClass.Predicates.resideInAnyPackage;
import static com.tngtech.archunit.core.domain.JavaClass.Predicates.simpleNameEndingWith;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.classes;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.methods;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;
import static com.tngtech.archunit.library.freeze.FreezingArchRule.freeze;
import static org.apache.fineract.consumer.ArchitectureFixtures.ANY_DOMAIN;
import static org.apache.fineract.consumer.ArchitectureFixtures.ANY_REPOSITORY;
import static org.apache.fineract.consumer.ArchitectureFixtures.BASE_PACKAGE;
import static org.apache.fineract.consumer.ArchitectureFixtures.FINERACT_GENERATED;
import static org.apache.fineract.consumer.ArchitectureFixtures.FINERACT_GENERATED_API;
import static org.apache.fineract.consumer.ArchitectureFixtures.MAIN_CLASSES;
import static org.apache.fineract.consumer.ArchitectureFixtures.allFeatures;
import static org.apache.fineract.consumer.ArchitectureFixtures.bothSides;

import com.tngtech.archunit.base.DescribedPredicate;
import com.tngtech.archunit.core.domain.JavaClass;
import com.tngtech.archunit.core.domain.JavaMethod;
import com.tngtech.archunit.lang.ArchCondition;
import com.tngtech.archunit.lang.ConditionEvents;
import com.tngtech.archunit.lang.SimpleConditionEvent;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/** Layering rules from AGENTS.md "Backend conventions" and "Architecture": who may depend on whom inside a feature. */
class LayeringArchitectureTest {

    private static final DescribedPredicate<JavaClass> DOMAIN_OR_REPOSITORY = resideInAnyPackage(ANY_DOMAIN, ANY_REPOSITORY);

    @Test
    void controllersDependOnServiceInterfacesOnly() {
        noClasses().that().resideInAnyPackage(bothSides("api")).should().dependOnClassesThat(DOMAIN_OR_REPOSITORY
                .or(resideInAPackage(BASE_PACKAGE + "..").and(simpleNameEndingWith("Impl"))).as("domain, repository or *Impl classes"))
                .because("AGENTS.md CQRS layout: controllers are dispatchers that depend on the service interface").check(MAIN_CLASSES);
    }

    @Test
    void serviceImplsImplementTheirInterface() {
        classes().that().resideInAPackage(BASE_PACKAGE + "..service..").and().haveSimpleNameEndingWith("Impl").and()
                .areNotInterfaces().should(implementInterfaceNamedWithoutImplFromSamePackage())
                .because("AGENTS.md CQRS layout: services are interface + Impl pairs").check(MAIN_CLASSES);
    }

    @Test
    void dataDoesNotDependOnDomain() {
        noClasses().that().resideInAnyPackage(bothSides("data")).should().dependOnClassesThat().resideInAPackage(ANY_DOMAIN)
                .because("AGENTS.md CQRS layout: enums referenced by an exposed DTO live in the side's data/, not domain/")
                .check(MAIN_CLASSES);
    }

    @Test
    void serviceInterfacesDoNotExposeDomainOrRepositoryTypes() {
        methods().that().areDeclaredInClassesThat().resideInAnyPackage(bothSides("service")).and().areDeclaredInClassesThat()
                .areInterfaces().should(notExposeInSignature(DOMAIN_OR_REPOSITORY))
                .because("AGENTS.md CQRS layout: types in a service signature live in the side's data/; domain/ is module-private")
                .check(MAIN_CLASSES);
    }

    @Test
    void featuresDoNotCallFineractFeignClientsDirectly() {
        freeze(noClasses().that().resideInAnyPackage(allFeatures()).should().dependOnClassesThat()
                .resideInAPackage(FINERACT_GENERATED_API).as("feature classes do not depend on the generated Fineract Feign clients")
                .because("AGENTS.md Architecture: feature services depend on narrow service interfaces, not on Feign clients directly"))
                .check(MAIN_CLASSES);
    }

    @Test
    void fineractShapesDoNotReachTheHttpBoundary() {
        noClasses().that().resideInAnyPackage(Stream.of(bothSides("api"), bothSides("data")).flatMap(Stream::of).toArray(String[]::new))
                .should().dependOnClassesThat().resideInAPackage(FINERACT_GENERATED)
                .because("AGENTS.md Architecture: DTOs at the boundary; never leak Fineract response shapes to the client")
                .check(MAIN_CLASSES);
    }

    @Test
    void servicesDoNotAssembleQueries() {
        noClasses().that().resideInAPackage(BASE_PACKAGE + "..service..").should().dependOnClassesThat()
                .resideInAnyPackage("jakarta.persistence.criteria..").orShould().dependOnClassesThat()
                .haveFullyQualifiedName("jakarta.persistence.EntityManager").orShould().dependOnClassesThat()
                .haveFullyQualifiedName("jakarta.persistence.Query").orShould().dependOnClassesThat()
                .haveFullyQualifiedName("jakarta.persistence.TypedQuery")
                .because("AGENTS.md Repositories: services never assemble JPQL inline; repositories own queries").check(MAIN_CLASSES);
    }

    @Test
    void queryAnnotationsLiveInRepositories() {
        methods().that().areAnnotatedWith(org.springframework.data.jpa.repository.Query.class).should().beDeclaredInClassesThat()
                .resideInAPackage(ANY_REPOSITORY).because("AGENTS.md Persistence: repositories own queries")
                .allowEmptyShould(true).check(MAIN_CLASSES);
    }

    @Test
    void exceptionHandlersLiveInInfrastructure() {
        classes().that().areAnnotatedWith(RestControllerAdvice.class).or().areAnnotatedWith(ControllerAdvice.class).should()
                .resideInAPackage(BASE_PACKAGE + ".infrastructure.exception")
                .because("AGENTS.md API error contract: translation to HTTP happens in consumer.infrastructure.exception; "
                        + "no per-feature exception handlers")
                .check(MAIN_CLASSES);
    }

    private static ArchCondition<JavaClass> implementInterfaceNamedWithoutImplFromSamePackage() {
        return new ArchCondition<>("implement the interface named without 'Impl' from the same package") {
            @Override
            public void check(JavaClass javaClass, ConditionEvents events) {
                String expected = javaClass.getName().substring(0, javaClass.getName().length() - "Impl".length());
                boolean implementsIt = javaClass.getRawInterfaces().stream().anyMatch(iface -> iface.getName().equals(expected));
                events.add(new SimpleConditionEvent(javaClass, implementsIt,
                        javaClass.getDescription() + (implementsIt ? " implements " : " does not implement ") + expected));
            }
        };
    }

    private static ArchCondition<JavaMethod> notExposeInSignature(DescribedPredicate<JavaClass> forbidden) {
        return new ArchCondition<>("not expose " + forbidden.getDescription() + " in their signature") {
            @Override
            public void check(JavaMethod method, ConditionEvents events) {
                Stream.concat(method.getReturnType().getAllInvolvedRawTypes().stream(),
                        method.getParameterTypes().stream().flatMap(type -> type.getAllInvolvedRawTypes().stream()))
                        .filter(forbidden).distinct()
                        .forEach(type -> events.add(SimpleConditionEvent.violated(method,
                                method.getDescription() + " exposes " + type.getName())));
            }
        };
    }
}
