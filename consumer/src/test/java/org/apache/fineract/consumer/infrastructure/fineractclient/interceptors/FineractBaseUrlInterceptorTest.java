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

import static org.assertj.core.api.Assertions.assertThat;

import feign.Request;
import feign.RequestTemplate;
import feign.Target;
import java.util.Map;
import org.apache.fineract.consumer.infrastructure.fineractclient.configs.FineractClientProperties;
import org.junit.jupiter.api.Test;

class FineractBaseUrlInterceptorTest {

    private static final String RUNTIME_BASE_URL = "http://fineract:8080/fineract-provider/api";
    private static final String BUILD_TIME_BASE_URL = "http://localhost:8888/fineract-provider/api";

    private final FineractBaseUrlInterceptor interceptor = new FineractBaseUrlInterceptor(
            new FineractClientProperties(RUNTIME_BASE_URL, "user", "secret", "default"));

    // Feign resolves the template's expressions before running interceptors; mirror that.
    private static RequestTemplate template() {
        RequestTemplate template = new RequestTemplate();
        template.method(Request.HttpMethod.GET);
        template.uri("/v1/loans/7");
        return template.resolve(Map.of());
    }

    @Test
    void prefixesTheRuntimeBaseUrl() {
        RequestTemplate template = template();

        interceptor.apply(template);

        assertThat(template.url()).isEqualTo(RUNTIME_BASE_URL + "/v1/loans/7");
    }

    @Test
    void runtimeBaseUrlWinsOverTheUrlBakedIntoTheFeignTarget() {
        RequestTemplate template = template();
        Target<Object> bakedTarget = new Target.HardCodedTarget<>(Object.class, "loans", BUILD_TIME_BASE_URL);

        interceptor.apply(template);
        Request request = bakedTarget.apply(template);

        assertThat(request.url()).isEqualTo(RUNTIME_BASE_URL + "/v1/loans/7");
    }
}
