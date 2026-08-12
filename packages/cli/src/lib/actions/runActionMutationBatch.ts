import { CliError, ExitCode } from '@contember/cli-common'

export interface ActionMutationError {
	readonly code: string
	readonly retryable: boolean
	readonly exitCode: ExitCode
}

export type ActionMutationResult =
	| { readonly id: string; readonly ok: true }
	| { readonly id: string; readonly ok: false; readonly error: ActionMutationError }

export interface ActionMutationBatch {
	readonly results: readonly ActionMutationResult[]
	readonly exitCode: ExitCode
}

/** Runs every requested mutation and keeps transport failures attributable to their input id. */
export const runActionMutationBatch = async (
	ids: readonly string[],
	operation: (id: string) => Promise<boolean>,
	domainFailure: ActionMutationError,
): Promise<ActionMutationBatch> => {
	const results: ActionMutationResult[] = []
	for (const id of ids) {
		try {
			results.push(
				await operation(id)
					? { id, ok: true }
					: { id, ok: false, error: domainFailure },
			)
		} catch (error) {
			results.push({ id, ok: false, error: safeMutationError(error) })
		}
	}
	return { results, exitCode: aggregateExitCode(results) }
}

/** Batch precedence: internal, forbidden, transient, conflict, not-found, then invalid input. */
const exitCodePrecedence: readonly ExitCode[] = [
	ExitCode.InternalError,
	ExitCode.Forbidden,
	ExitCode.Transient,
	ExitCode.Conflict,
	ExitCode.NotFound,
	ExitCode.InputError,
]

const aggregateExitCode = (results: readonly ActionMutationResult[]): ExitCode =>
	exitCodePrecedence.find(exitCode => results.some(result => !result.ok && result.error.exitCode === exitCode)) ?? ExitCode.Success

/** Rejects empty ids locally, before a command invokes the Actions API. */
export const validateActionEventIds = (ids: readonly string[]): void => {
	const position = ids.findIndex(id => id.trim().length === 0)
	if (position === -1) {
		return
	}
	throw new CliError(`Invalid event id at position ${position + 1}: empty value`, {
		code: 'INVALID_EVENT_ID',
		details: { argument: 'eventIds', position: position + 1, reason: 'empty' },
	})
}

const safeMutationError = (error: unknown): ActionMutationError => {
	if (error instanceof CliError) {
		return { code: error.code, retryable: error.retryable, exitCode: error.exitCode }
	}
	return { code: 'ACTIONS_OPERATION_FAILED', retryable: false, exitCode: ExitCode.InternalError }
}
