import { CliError, ExitCode, Output } from '@contember/cli-common'
import prompts from 'prompts'

export interface ConfirmationArgs {
	readonly yes: boolean
	readonly output: Output
	/** What is about to happen, shown above the prompt. */
	readonly warning: string
}

/**
 * The one destructive-action guard of the tenant commands. `--yes` skips the prompt; without a TTY there
 * is nobody to answer it, so the run fails fast instead of hanging a CI job. Declining throws as well, so
 * a caller never has to turn a boolean into an exit code and an agent always gets a typed error.
 */
export const requireConfirmation = async ({ yes, output, warning }: ConfirmationArgs): Promise<void> => {
	if (yes) {
		return
	}
	if (!output.canPrompt()) {
		throw new CliError('TTY not available. Pass --yes to confirm execution.', {
			code: 'TTY_UNAVAILABLE',
			exitCode: ExitCode.InputError,
		})
	}
	output.warn(warning)
	output.info('(to skip this dialog, you can pass the --yes option)')
	const answers: { ok?: unknown } = await prompts({ type: 'confirm', name: 'ok', message: 'Do you want to continue?' })
	if (answers.ok !== true) {
		throw new CliError('Aborted by the user.', { code: 'ABORTED', exitCode: ExitCode.InputError })
	}
}
