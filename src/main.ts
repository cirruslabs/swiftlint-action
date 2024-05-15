import * as core from '@actions/core'
import * as tc from '@actions/tool-cache'
import * as exec from '@actions/exec'
import path from 'path'

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

    // Fail the workflow run if we're not running on macOS
    if (process.platform !== 'darwin') {
      core.setFailed(
        `Unsupported OS "${process.platform}, only "darwin" is currently supported`
      )

      return
    }

    // Determine the asset URL
    let url: string

    if (version !== 'latest') {
      url = `https://github.com/realm/SwiftLint/releases/download/${version}/portable_swiftlint.zip`
    } else {
      url =
        'https://github.com/realm/SwiftLint/releases/latest/download/portable_swiftlint.zip'
    }

    // Retrieve the SwiftLint binary from the tool cache
    const toolName = `swiftlint-${process.platform}`
    let portableSwiftlintDir = tc.find(toolName, version)

    // Download the SwiftLint binary if not found in the tool cache
    // or we're using the "latest" version
    if (portableSwiftlintDir === '' || version === 'latest') {
      const toolPath = await tc.downloadTool(url)
      const toolDir = await tc.extractZip(toolPath)

      // Cache the SwiftLint binary in the tool cache
      portableSwiftlintDir = await tc.cacheDir(toolDir, toolName, version)
    }

    // Run the SwiftLint binary and capture its standard output
    let stdout = ''

    const swiftlintArgs = ['lint', '--reporter=json']
    if (core.getInput('strict') === 'true') {
      swiftlintArgs.push('--strict')
    }
    const returnCode = await exec.exec(
      path.join(portableSwiftlintDir, 'swiftlint'),
      swiftlintArgs,
      {
        ignoreReturnCode: true,
        listeners: {
          stdout: (data: Buffer) => {
            stdout += data.toString()
          }
        }
      }
    )

    // Parse the SwiftLint's JSON output
    // and emit annotations
    const result: Entry[] = JSON.parse(stdout)

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

      annotationFunc(entry.reason, {
        title: `${entry.type} (${entry.rule_id})`,
        file: entry.file,
        startLine: entry.line,
        startColumn: entry.character
      })
    }

    process.exit(returnCode)
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}
