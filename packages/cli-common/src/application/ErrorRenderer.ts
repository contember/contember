import chalk from 'chalk'
import { ExitCode, isUnexpectedCliError, toCliError } from './CliError.js'
import { escapeTerminalText, Output } from './Output.js'

/**
 * The single place where an error becomes user visible. Always writes to stderr — in json mode as the
 * `{ ok: false, error }` envelope, otherwise as a colored one-liner. Returns the process exit code.
 */
export const renderCliError = (error: unknown, output: Output): ExitCode => {
	const cliError = toCliError(error)
	if (output.isJson) {
		output.writeStderr(serializeError(cliError, isUnexpectedCliError(cliError)))
		return cliError.exitCode
	}
	output.writeStderr(chalk.red(`Error [${escapeTerminalText(cliError.code)}]: ${escapeTerminalText(cliError.message)}`))
	if (cliError.exitCode === ExitCode.InternalError && typeof cliError.details === 'string') {
		output.writeStderr(chalk.gray(escapeTerminalText(cliError.details)))
	}
	return cliError.exitCode
}

const serializeError = (error: ReturnType<typeof toCliError>, unexpected: boolean): string => {
	try {
		return JSON.stringify(
			{
				ok: false,
				error: {
					code: error.code,
					message: unexpected ? 'An unexpected error occurred.' : error.message,
					retryable: error.retryable,
					details: unexpected ? null : error.details ?? null,
				},
			},
			null,
			2,
		)
	} catch {
		return '{"ok":false,"error":{"code":"UNKNOWN","message":"Unable to serialize error","retryable":false,"details":null}}'
	}
}
