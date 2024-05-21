import * as core from '@actions/core'
import * as tc from '@actions/tool-cache'
import * as tr from '@actions/exec/lib/toolrunner'
import * as exec from '@actions/exec'
import path from 'path'
import * as process from 'node:process'

interface Entry {
  file?: string
  line?: number
  character?: number
  severity: string
  type: string
  rule_id: string
  reason: string
}

export async function run(): Promise<void> {
  try {
    const version: string = core.getInput('version')

    // Determine the asset URL
    let url: string

    if (version !== 'latest') {
      url = `https://github.com/realm/SwiftLint/releases/download/${version}/`
    } else {
      url = 'https://github.com/realm/SwiftLint/releases/latest/download/'
    }

    if (process.platform === 'darwin') {
      // SwiftLint's binaries for Darwin are universal
      url += 'portable_swiftlint.zip'
    } else if (process.platform === 'linux') {
      // SwiftLint's binaries for Linux are x64-only[1]
      //
      // [1]: https://github.com/realm/SwiftLint/issues/4531
      if (process.arch === 'x64') {
        core.setFailed(
          `Unsupported Linux architecture "${process.arch}", only "x64" is currently supported`
        )

        return
      }

      url += 'swiftlint_linux.zip'
    } else {
      core.setFailed(
        `Unsupported OS "${process.platform}", only "darwin" and "linux" are currently supported`
      )

      return
    }

    // Retrieve the SwiftLint binary from the tool cache
    const toolName = `swiftlint-${process.platform}`
    let portableSwiftlintDir = tc.find(toolName, version)

    // Download the SwiftLint binary if not found in the tool cache
    if (portableSwiftlintDir === '') {
      portableSwiftlintDir = await tc.extractZip(await tc.downloadTool(url))

      // Cache the SwiftLint binary in the tool cache
      // if it's not the "latest" version
      if (version !== 'latest') {
        await tc.cacheDir(portableSwiftlintDir, toolName, version)
      }
    }

    // Run the SwiftLint binary and capture its standard output
    const swiftlintArgs = ['lint', '--reporter=json']
    const additionalArgs = core.getInput('args')
    if (additionalArgs) {
      swiftlintArgs.push(...tr.argStringToArray(additionalArgs))
    }
    const output = await exec.getExecOutput(
      path.join(portableSwiftlintDir, 'swiftlint'),
      swiftlintArgs,
      {
        ignoreReturnCode: true
      }
    )

    // Parse the SwiftLint's JSON output
    // and emit annotations
    const result: Entry[] = JSON.parse(output.stdout)

    for (const entry of result) {
      let annotationFunc: (
        message: string | Error,
        properties?: core.AnnotationProperties
      ) => void

      switch (entry.severity.toLowerCase()) {
        case 'warning':
          annotationFunc = core.warning
          break
        case 'error':
        default:
          annotationFunc = core.error
          break
      }

      // relativize the file path to the working directory
      if (entry.file) {
        entry.file = path.relative(
          process.env.GITHUB_WORKSPACE || process.cwd(),
          entry.file
        )
      }

      annotationFunc(entry.reason, {
        title: `${entry.type} (${entry.rule_id})`,
        file: entry.file,
        startLine: entry.line,
        startColumn: entry.character
      })
    }

    process.exit(output.exitCode)
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}
