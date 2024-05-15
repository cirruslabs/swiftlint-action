Run [SwiftLint](https://github.com/realm/SwiftLint) from your GitHub Actions with ease and annotations.

<img width="1010" alt="SwiftLintDemoPR" src="https://github.com/cirruslabs/swiftlint-action/assets/989066/70f99351-4889-4a72-bbbf-e6cc9ab9b25f">

Works with GitHub-managed runners, self-hosted runners and runners from services like [Cirrus Runners](https://cirrus-runners.app/).

## Usage

```yaml
steps:
  - uses: cirruslabs/swiftlint-action@v1
    with:
      version: latest
```

Here is a full example of a workflow file:

```yaml
# .github/workflows/swiftlint.yml
name: SwiftLint

on:
  push:
    branches: [ "main" ]
  pull_request:
    branches: [ "main" ]

jobs:
  SwiftLint:
    runs-on: ghcr.io/cirruslabs/macos-runner:sonoma
    steps:
      - uses: actions/checkout@v4
      - uses: cirruslabs/swiftlint-action@v1
        with:
          version: latest
```