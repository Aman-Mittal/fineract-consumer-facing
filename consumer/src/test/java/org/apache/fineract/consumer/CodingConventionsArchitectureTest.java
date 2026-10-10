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

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.classes;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;
import static org.apache.fineract.consumer.ArchitectureFixtures.BASE_PACKAGE;
import static org.apache.fineract.consumer.ArchitectureFixtures.MAIN_CLASSES;
import static org.apache.fineract.consumer.ArchitectureFixtures.bothSides;

import com.tngtech.archunit.core.domain.JavaClass;
import com.tngtech.archunit.core.domain.JavaField;
import com.tngtech.archunit.core.domain.JavaModifier;
import com.tngtech.archunit.lang.ArchCondition;
import com.tngtech.archunit.lang.ConditionEvents;
import com.tngtech.archunit.lang.SimpleConditionEvent;
import java.util.Optional;
import java.util.Set;
import org.apache.fineract.consumer.infrastructure.exception.AbstractConsumerException;
import org.junit.jupiter.api.Test;
import org.springframework.data.repository.Repository;

/** Code-shape rules from AGENTS.md "Backend conventions" and "API error contract". */
class CodingConventionsArchitectureTest {

    private static final String NAMED_INTERFACE = "org.springframework.modulith.NamedInterface";
    private static final String APPLICATION_MODULE = "org.springframework.modulith.ApplicationModule";

    @Test
    void springDataRepositoriesCarryNoRepositoryAnnotation() {
        noClasses().that().areInterfaces().and().areAssignableTo(Repository.class).should()
                .beAnnotatedWith(org.springframework.stereotype.Repository.class)
                .because("AGENTS.md Repositories: Spring Data interfaces carry no @Repository annotation (redundant)")
                .check(MAIN_CLASSES);
    }

    @Test
    void noRecords() {
        noClasses().that().resideInAPackage(BASE_PACKAGE + "..").should().beRecords()
                .because("AGENTS.md Lombok shape: data-carrying classes are Lombok classes, not Java records").check(MAIN_CLASSES);
    }

    @Test
    void dataClassesAreFinalWithPrivateFinalFields() {
        classes().that().resideInAnyPackage(bothSides("data")).and().areTopLevelClasses().and().areNotEnums().and()
                .areNotInterfaces().should().haveModifier(JavaModifier.FINAL).andShould(havePrivateFinalInstanceFields())
                .because("AGENTS.md Lombok shape: final class, private final fields").check(MAIN_CLASSES);
    }

    @Test
    void featureExceptionsExtendAbstractConsumerException() {
        classes().that().resideInAnyPackage(bothSides("exception")).and().areTopLevelClasses().should()
                .beAssignableTo(AbstractConsumerException.class)
                .because("AGENTS.md API error contract: feature exceptions live in <feature>.<side>.exception/ and extend "
                        + "AbstractConsumerException")
                .check(MAIN_CLASSES);
    }

    @Test
    void concreteConsumerExceptionsDeclareCode() {
        classes().that().areAssignableTo(AbstractConsumerException.class).and().doNotHaveModifier(JavaModifier.ABSTRACT)
                .should(declarePublicStaticFinalStringCode())
                .because("AGENTS.md API error contract: each concrete exception declares its code as public static final String CODE")
                .check(MAIN_CLASSES);
    }

    @Test
    void moduleBoundariesAreNotDeclaredPerPackage() {
        noClasses().should(beInOrAnnotateAModulithPackage())
                .because("AGENTS.md CQRS layout: detection is configured centrally in ConsumerModuleDetectionStrategy; "
                        + "no package-info.java / @NamedInterface")
                .check(MAIN_CLASSES);
    }

    private static ArchCondition<JavaClass> havePrivateFinalInstanceFields() {
        return new ArchCondition<>("have only private final instance fields") {
            @Override
            public void check(JavaClass javaClass, ConditionEvents events) {
                for (JavaField field : javaClass.getFields()) {
                    Set<JavaModifier> modifiers = field.getModifiers();
                    if (!modifiers.contains(JavaModifier.STATIC) && !modifiers.contains(JavaModifier.SYNTHETIC)
                            && !(modifiers.contains(JavaModifier.PRIVATE) && modifiers.contains(JavaModifier.FINAL))) {
                        events.add(SimpleConditionEvent.violated(field, field.getDescription() + " is not private final"));
                    }
                }
            }
        };
    }

    private static ArchCondition<JavaClass> declarePublicStaticFinalStringCode() {
        return new ArchCondition<>("declare public static final String CODE") {
            @Override
            public void check(JavaClass javaClass, ConditionEvents events) {
                Optional<JavaField> code = javaClass.tryGetField("CODE");
                boolean satisfied = code.isPresent()
                        && code.get().getModifiers().containsAll(Set.of(JavaModifier.PUBLIC, JavaModifier.STATIC, JavaModifier.FINAL))
                        && code.get().getRawType().isEquivalentTo(String.class);
                events.add(new SimpleConditionEvent(javaClass, satisfied,
                        javaClass.getDescription() + (satisfied ? " declares" : " does not declare") + " public static final String CODE"));
            }
        };
    }

    private static ArchCondition<JavaClass> beInOrAnnotateAModulithPackage() {
        return new ArchCondition<>("be annotated with, or reside in a package annotated with, @NamedInterface or @ApplicationModule") {
            @Override
            public void check(JavaClass javaClass, ConditionEvents events) {
                boolean classAnnotated = javaClass.isAnnotatedWith(NAMED_INTERFACE) || javaClass.isAnnotatedWith(APPLICATION_MODULE);
                boolean packageAnnotated = javaClass.getPackage().isAnnotatedWith(NAMED_INTERFACE)
                        || javaClass.getPackage().isAnnotatedWith(APPLICATION_MODULE);
                if (classAnnotated || packageAnnotated) {
                    events.add(SimpleConditionEvent.satisfied(javaClass, javaClass.getDescription()
                            + (classAnnotated ? " is annotated" : " resides in an annotated package") + " with a Modulith boundary annotation"));
                }
            }
        };
    }
}
