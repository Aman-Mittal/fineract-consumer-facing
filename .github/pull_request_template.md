<!--
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->

<!-- Commits must be signed to merge — see CONTRIBUTING.md#signing-your-commits if you haven't set this up. -->

<!--
  New feature, or a change to what a consumer can see or do?

  Apache Fineract decides those on its developer mailing list, not in a pull request. A PR
  that arrives with a thread behind it is reviewed on its merits; one that proposes something
  nobody has seen spends its first round of review on the proposal instead of the code.

    Subscribe  dev-subscribe@fineract.apache.org   (blank email)
    Post       dev@fineract.apache.org
    Archive    https://lists.apache.org/list.html?dev@fineract.apache.org
    Chat       https://matrix.to/#/%23apache-fineract-dev:matrix.org

  Bug fixes, refactors and test work need none of this.

  Found a security problem? Do not open a PR or an issue: see SECURITY.md.
-->

## What and why

<!-- One or two sentences explaining what changed and why. -->

Closes #

## Verification

<!-- List what you ran and what you checked. Note whether the change was exercised with unit tests, the Docker stack (Cucumber / Playwright), or both. -->

-

## Screenshots

<!-- Add screenshots or a short recording for UI changes. Write "Not applicable" for non-UI changes. -->

## AI assistance (optional)

<!-- If generative AI materially assisted this contribution, optionally state the tool or model and
the harness or workflow used. The contributor remains responsible for the submitted change. -->

- Tool / model:
- Harness / workflow:

## Checklist

<!-- Check each item, or explain why it does not apply. -->

- [ ] I did not hand-edit generated files under `frontend/src/openapi-client/`.
- [ ] Backend code follows the feature and CQRS layout in [AGENTS.md](AGENTS.md#backend-conventions-consumer) (command and query sides, module boundaries); frontend code goes through the adapters in `frontend/src/app/core/adapters/`.
- [ ] I did not add entries to a lint or architecture baseline (suppressions, frozen violations) to get the build passing.
- [ ] User-facing strings use translation keys.
- [ ] I added or updated tests appropriate to this change, or explained why tests were not needed.
- [ ] UI workflow changes include suitable e2e coverage, including real-backend testing where relevant.
- [ ] Commits are signed — see [Signing your commits](CONTRIBUTING.md#signing-your-commits) in CONTRIBUTING.md.
- [ ] I followed the [AI-assisted contributions guidance](CONTRIBUTING.md#ai-assisted-contributions).
- [ ] If this adds a feature or changes what a consumer can see or do, I raised it on
      [dev@fineract.apache.org](https://lists.apache.org/list.html?dev@fineract.apache.org) first,
      or it is a bug fix, refactor or test change, where that does not apply.
