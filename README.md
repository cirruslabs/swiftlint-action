# SwiftLint Action

Run SwiftLint from your GitHub Actions with ease.

## Usage

```yaml
steps:
  - uses: cirruslabs/swiftlint-action@v1
    with:
      version: latest
```

## Development

After you've cloned the repository to your local machine, install the
dependencies:

```shell
npm install
```

To package the action for distribution after making the changes to the
TypeScript code, run the following command:

```shell
npm run bundle
```
