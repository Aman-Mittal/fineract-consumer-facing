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

import com.tngtech.archunit.core.domain.JavaClasses;
import com.tngtech.archunit.core.importer.ClassFileImporter;
import com.tngtech.archunit.core.importer.ImportOption;

/**
 * Shared class imports and package patterns for the ArchUnit tests. Importing once per JVM keeps the architecture
 * tests cheap.
 */
final class ArchitectureFixtures {

    static final String BASE_PACKAGE = "org.apache.fineract.consumer";
    static final String INFRASTRUCTURE = BASE_PACKAGE + ".infrastructure..";
    static final String FINERACT_GENERATED = BASE_PACKAGE + ".infrastructure.fineractclient.generated..";
    static final String ANY_DOMAIN = BASE_PACKAGE + "..domain..";
    static final String ANY_REPOSITORY = BASE_PACKAGE + "..repository..";

    /** Main (production) classes, without the Fineract client openapi-generator writes into build/. */
    static final JavaClasses MAIN_CLASSES = new ClassFileImporter().withImportOption(new ImportOption.DoNotIncludeTests())
            .withImportOption(location -> !location.contains("/fineractclient/generated/")).importPackages(BASE_PACKAGE);

    /** Test classes, without the BFF Java client ({@code consumer.client}) openapi-generator writes into build/. */
    static final JavaClasses TEST_CLASSES = new ClassFileImporter().withImportOption(new ImportOption.OnlyIncludeTests())
            .withImportOption(location -> !location.contains("/org/apache/fineract/consumer/client/"))
            .importPackages(BASE_PACKAGE);

    private ArchitectureFixtures() {}

    /** {@code consumer.<feature>.<side>.<layer>..}, e.g. {@code side("query", "api")}. */
    static String side(String side, String layer) {
        return BASE_PACKAGE + ".*." + side + "." + layer + "..";
    }

    /** {@code consumer.<feature>.<side>..} for one side. */
    static String side(String side) {
        return BASE_PACKAGE + ".*." + side + "..";
    }

    /** The given layer on both CQRS sides of every feature. */
    static String[] bothSides(String layer) {
        return new String[] {side("command", layer), side("query", layer)};
    }
}
