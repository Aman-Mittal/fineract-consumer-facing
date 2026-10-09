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

package org.apache.fineract.consumer.infrastructure.fineractclient.interceptors;

import feign.RequestInterceptor;
import feign.RequestTemplate;
import lombok.RequiredArgsConstructor;
import org.apache.fineract.consumer.infrastructure.fineractclient.configs.FineractClientProperties;

/**
 * Points every Fineract call at {@code fineract.client.base-url} as resolved at runtime.
 *
 * <p>The generated {@code @FeignClient(url = "${fineract.client.base-url}")} attribute is resolved when bean
 * definitions are built. Under Spring AOT that happens at build time, so a native image would keep calling the
 * build machine's URL and ignore {@code FINERACT_BASE_URL}. Feign's {@code HardCodedTarget} leaves a template
 * that already carries an absolute URL untouched, so setting the target here makes the runtime value win on
 * both the JVM and native images.
 */
@RequiredArgsConstructor
public class FineractBaseUrlInterceptor implements RequestInterceptor {

    private final FineractClientProperties properties;

    @Override
    public void apply(RequestTemplate template) {
        template.target(properties.getBaseUrl());
    }
}
