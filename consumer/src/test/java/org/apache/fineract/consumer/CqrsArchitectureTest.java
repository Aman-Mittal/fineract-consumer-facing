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

import static com.tngtech.archunit.core.domain.JavaCall.Predicates.target;
import static com.tngtech.archunit.core.domain.JavaClass.Predicates.assignableTo;
import static com.tngtech.archunit.core.domain.properties.HasName.Predicates.nameMatching;
import static com.tngtech.archunit.core.domain.properties.HasOwner.Predicates.With.owner;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.classes;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.methods;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noMethods;
import static org.apache.fineract.consumer.ArchitectureFixtures.BASE_PACKAGE;
import static org.apache.fineract.consumer.ArchitectureFixtures.MAIN_CLASSES;
import static org.apache.fineract.consumer.ArchitectureFixtures.side;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.tngtech.archunit.base.DescribedPredicate;
import com.tngtech.archunit.base.HasDescription;
import com.tngtech.archunit.core.domain.JavaAnnotation;
import com.tngtech.archunit.core.domain.JavaClass;
import com.tngtech.archunit.core.domain.JavaMethod;
import com.tngtech.archunit.core.domain.properties.HasAnnotations;
import com.tngtech.archunit.lang.ArchCondition;
import com.tngtech.archunit.lang.ConditionEvents;
import com.tngtech.archunit.lang.SimpleConditionEvent;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import org.hibernate.annotations.Immutable;
import org.junit.jupiter.api.Test;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.repository.Repository;
import org.springframework.transaction.annotation.Transactional;

/** CQRS rules from AGENTS.md "Backend conventions": side separation and a read-only query side. */
class CqrsArchitectureTest {

    private static final String JAKARTA_TRANSACTIONAL = "jakarta.transaction.Transactional";
    private static final Pattern FEATURE_SIDE_PACKAGE = Pattern
            .compile("^" + Pattern.quote(BASE_PACKAGE) + "\\.([^.]+)\\.(command|query)(\\.|$)");

    private static final Set<String> FEATURES = discoverFeatures();
    private static final DescribedPredicate<JavaClass> DOMAIN_PACKAGE = JavaClass.Predicates
            .resideInAPackage(ArchitectureFixtures.ANY_DOMAIN);

    private static Set<String> discoverFeatures() {
        return MAIN_CLASSES.stream().map(JavaClass::getPackageName).map(FEATURE_SIDE_PACKAGE::matcher).filter(Matcher::find)
                .map(matcher -> matcher.group(1)).filter(feature -> !"infrastructure".equals(feature)).collect(Collectors.toSet());
    }

    @Test
    void discoversFeatureModules() {
        assertTrue(FEATURES.containsAll(Set.of("user", "registration", "identity")),
                "feature discovery is broken; found only: " + FEATURES);
    }

    @Test
    void commandSideMustNotDependOnSameFeatureQuerySide() {
        for (String feature : FEATURES) {
            noClasses().that().resideInAPackage(sidePackage(feature, "command")).should().dependOnClassesThat()
                    .resideInAPackage(sidePackage(feature, "query")).allowEmptyShould(true).check(MAIN_CLASSES);
        }
    }

    @Test
    void querySideMustNotDependOnSameFeatureCommandSide() {
        for (String feature : FEATURES) {
            noClasses().that().resideInAPackage(sidePackage(feature, "query")).should().dependOnClassesThat()
                    .resideInAPackage(sidePackage(feature, "command")).allowEmptyShould(true).check(MAIN_CLASSES);
        }
    }

    @Test
    void querySideTransactionsAreReadOnly() {
        classes().that().resideInAPackage(side("query")).should(onlyDeclareReadOnlyTransactions())
                .because("AGENTS.md CQRS layout: queries read and must not mutate; @Transactional(readOnly = true) on queries")
                .check(MAIN_CLASSES);
    }

    @Test
    void queryEntitiesAreImmutable() {
        classes().that().resideInAPackage(side("query")).and().areAnnotatedWith(jakarta.persistence.Entity.class).should()
                .beAnnotatedWith(Immutable.class)
                .because("AGENTS.md CQRS layout: the query side maps the table with its own read-only @Immutable entity")
                .check(MAIN_CLASSES);
    }

    @Test
    void querySideDoesNotCallRepositoryWriteMethods() {
        noClasses().that().resideInAPackage(side("query")).should()
                .callMethodWhere(target(owner(assignableTo(Repository.class))).and(target(nameMatching("(save|delete|flush).*"))))
                .because("AGENTS.md CQRS layout: queries read and must not mutate").check(MAIN_CLASSES);
    }

    @Test
    void queryRepositoriesDeclareNoModifyingQueries() {
        noMethods().that().areDeclaredInClassesThat().resideInAPackage(side("query")).should()
                .beAnnotatedWith(Modifying.class).because("AGENTS.md CQRS layout: queries read and must not mutate")
                .allowEmptyShould(true).check(MAIN_CLASSES);
    }

    @Test
    void commandServicesDoNotReturnEntities() {
        methods().that().areDeclaredInClassesThat().resideInAPackage(side("command", "service")).and().arePublic()
                .should(notReturnDomainTypes())
                .because("AGENTS.md CQRS layout: commands return only an acknowledgement or identifier, never the mutated entity")
                .check(MAIN_CLASSES);
    }

    private static ArchCondition<JavaMethod> notReturnDomainTypes() {
        return new ArchCondition<>("not return domain types") {
            @Override
            public void check(JavaMethod method, ConditionEvents events) {
                method.getReturnType().getAllInvolvedRawTypes().stream()
                        .filter(type -> type.getPackageName().startsWith(BASE_PACKAGE) && DOMAIN_PACKAGE.test(type))
                        .forEach(type -> events.add(SimpleConditionEvent.violated(method,
                                method.getDescription() + " returns domain type " + type.getName())));
            }
        };
    }

    private static ArchCondition<JavaClass> onlyDeclareReadOnlyTransactions() {
        return new ArchCondition<>("only declare @Transactional(readOnly = true)") {
            @Override
            public void check(JavaClass javaClass, ConditionEvents events) {
                Stream.concat(Stream.of(javaClass), Stream.concat(javaClass.getMethods().stream(), javaClass.getConstructors().stream()))
                        .forEach(element -> checkElement(element, events));
            }

            private void checkElement(HasAnnotations<?> element, ConditionEvents events) {
                String description = ((HasDescription) element).getDescription();
                if (element.isAnnotatedWith(JAKARTA_TRANSACTIONAL)) {
                    events.add(SimpleConditionEvent.violated(element,
                            description + " uses jakarta.transaction.Transactional, which cannot be read-only"));
                }
                element.tryGetAnnotationOfType(Transactional.class.getName()).ifPresent(annotation -> {
                    if (!isReadOnly(annotation)) {
                        events.add(SimpleConditionEvent.violated(element, description + " is @Transactional without readOnly = true"));
                    }
                });
            }
        };
    }

    private static boolean isReadOnly(JavaAnnotation<?> annotation) {
        return annotation.get("readOnly").map(Boolean.TRUE::equals).orElse(false);
    }

    private static String sidePackage(String feature, String side) {
        return BASE_PACKAGE + "." + feature + "." + side + "..";
    }
}
