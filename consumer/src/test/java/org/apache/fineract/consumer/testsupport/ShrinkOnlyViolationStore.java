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

package org.apache.fineract.consumer.testsupport;

import static java.nio.charset.StandardCharsets.UTF_8;

import com.tngtech.archunit.lang.ArchRule;
import com.tngtech.archunit.library.freeze.ViolationStore;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.HexFormat;
import java.util.List;
import java.util.Locale;
import java.util.Properties;

/**
 * ArchUnit violation store for {@code FreezingArchRule}, configured in {@code archunit.properties}.
 *
 * <p>
 * It differs from ArchUnit's default text store in three ways: one file per rule, named after the rule description
 * (not a random UUID) and holding its violations sorted, so the store is deterministic and diffs cleanly; each file carries the ASF
 * licence header, so Apache RAT needs no exclusion; and an existing rule's file may only shrink, so a frozen rule
 * cannot silently absorb a new violation. A rule seen for the first time is recorded only when
 * {@code freeze.store.default.allowStoreCreation=true} (Gradle: {@code -ParchunitFreezeNewRules}).
 */
public final class ShrinkOnlyViolationStore implements ViolationStore {

    private static final String LICENSE_HEADER = """
            # Licensed to the Apache Software Foundation (ASF) under one
            # or more contributor license agreements.  See the NOTICE file
            # distributed with this work for additional information
            # regarding copyright ownership.  The ASF licenses this file
            # to you under the Apache License, Version 2.0 (the
            # "License"); you may not use this file except in compliance
            # with the License.  You may obtain a copy of the License at
            #
            #   http://www.apache.org/licenses/LICENSE-2.0
            #
            # Unless required by applicable law or agreed to in writing,
            # software distributed under the License is distributed on an
            # "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
            # KIND, either express or implied.  See the License for the
            # specific language governing permissions and limitations
            # under the License.
            #
            # Frozen ArchUnit violations, written by ShrinkOnlyViolationStore. Do not edit by hand.
            # A line disappears on the next test run once its violation is fixed; commit the shrunken file.
            # Adding lines is never allowed: fix new violations instead.
            """;
    private static final String COMMENT = "#";
    private static final String RULE_PREFIX = "# Rule: ";
    private static final String ESCAPED_LINE_BREAK = "\\n";
    private static final String BECAUSE = ", because ";
    private static final int MAX_SLUG_LENGTH = 80;
    private static final int HASH_HEX_LENGTH = 8;

    private Path storeDirectory;
    private boolean allowStoreCreation;
    private boolean allowStoreUpdate;

    @Override
    public void initialize(Properties properties) {
        storeDirectory = Path.of(properties.getProperty("default.path", "src/test/resources/archunit_store"));
        allowStoreCreation = Boolean.parseBoolean(properties.getProperty("default.allowStoreCreation", "false"));
        allowStoreUpdate = Boolean.parseBoolean(properties.getProperty("default.allowStoreUpdate", "true"));
    }

    @Override
    public boolean contains(ArchRule rule) {
        return Files.exists(fileFor(rule));
    }

    @Override
    public void save(ArchRule rule, List<String> violations) {
        Path file = fileFor(rule);
        if (Files.exists(file)) {
            if (!allowStoreUpdate) {
                throw new IllegalStateException("Updating frozen violations is disabled (freeze.store.default.allowStoreUpdate=false): " + file);
            }
            if (!new HashSet<>(getViolations(rule)).containsAll(violations)) {
                throw new IllegalStateException("Frozen violations may only shrink; refusing to add entries to " + file);
            }
        } else if (!allowStoreCreation) {
            throw new IllegalStateException("No frozen violations stored for rule '" + rule.getDescription() + "' at " + file
                    + ". Record them once with ./gradlew test --tests '*Architecture*' -ParchunitFreezeNewRules and commit the file.");
        }
        write(file, rule, violations);
    }

    @Override
    public List<String> getViolations(ArchRule rule) {
        try {
            List<String> violations = new ArrayList<>();
            for (String line : Files.readAllLines(fileFor(rule), UTF_8)) {
                if (!line.isBlank() && !line.startsWith(COMMENT)) {
                    violations.add(line.replace(ESCAPED_LINE_BREAK, "\n"));
                }
            }
            return violations;
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    private void write(Path file, ArchRule rule, List<String> violations) {
        StringBuilder content = new StringBuilder(LICENSE_HEADER);
        for (String descriptionLine : rule.getDescription().split("\n", -1)) {
            content.append(RULE_PREFIX).append(descriptionLine).append('\n');
        }
        content.append('\n');
        violations.stream().map(violation -> violation.replace("\n", ESCAPED_LINE_BREAK)).sorted().distinct()
                .forEach(violation -> content.append(violation).append('\n'));
        try {
            Files.createDirectories(storeDirectory);
            Files.writeString(file, content, UTF_8);
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    /**
     * Named after the rule description up to its {@code because} clause, so rewording the rationale keeps the file;
     * the hash suffix keeps truncated names unique.
     */
    private Path fileFor(ArchRule rule) {
        String description = rule.getDescription();
        int because = description.indexOf(BECAUSE);
        if (because >= 0) {
            description = description.substring(0, because);
        }
        String slug = description.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", "-").replaceAll("^-|-$", "");
        if (slug.length() > MAX_SLUG_LENGTH) {
            slug = slug.substring(0, MAX_SLUG_LENGTH).replaceAll("-$", "");
        }
        return storeDirectory.resolve(slug + "-" + sha256Prefix(description) + ".txt");
    }

    private static String sha256Prefix(String text) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(text.getBytes(UTF_8));
            return HexFormat.of().formatHex(digest).substring(0, HASH_HEX_LENGTH);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
