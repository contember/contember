import { CliError, ExitCode } from '@contember/cli-common'
import { readStdinText, type StdinReader } from '../../../lib/tenant/stdin.js'

/**
 * Resolves a `--config` / `--config-stdin` option pair into a parsed JSON value. A bare `-` cannot be used
 * as a stdin sentinel here — the parser treats any value starting with `-` as the start of the next flag
 * (`InputParser.tryParseValue`) — so stdin gets its own boolean flag instead. `undefined` in (neither flag
 * given), `undefined` out — lets callers tell "not provided" apart from "explicitly cleared".
 */
export const resolveJsonConfigOption = async (
	value: string | undefined,
	fromStdin: boolean,
	readStdinFn: StdinReader = readStdinText,
): Promise<unknown> => {
	if (value !== undefined && fromStdin) {
		throw new CliError('Pass either --config or --config-stdin, not both.', {
			code: 'CONFIG_CONFLICTING_SOURCE',
			exitCode: ExitCode.InputError,
		})
	}
	if (value === undefined && !fromStdin) {
		return undefined
	}
	const raw = value !== undefined ? value : await readStdinFn()
	try {
		return JSON.parse(raw)
	} catch (e) {
		throw new CliError(`Invalid JSON in --config: ${e instanceof Error ? e.message : String(e)}`, {
			code: 'INVALID_CONFIG_JSON',
			exitCode: ExitCode.InputError,
		})
	}
}
