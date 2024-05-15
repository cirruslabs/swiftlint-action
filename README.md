Run [SwiftLint](https://github.com/realm/SwiftLint) from your GitHub Actions with ease and annotations.

Works with GitHub-managed runners, self-hosted runners and runners from services like [Cirrus Runners](https://cirrus-runners.app/).

## Usage

```yaml
steps:
  - uses: cirruslabs/swiftlint-action@v1
    with:
      version: latest
```
