import { CliError, ExitCode, Input, Output } from '@contember/cli-common'
import prompts from 'prompts'

export const confirmImport = async (input: Input<{}, { yes: boolean }>, output: Output): Promise<boolean> => {
	if (input.getOption('yes')) {
		return true
	}
	if (!output.canPrompt()) {
		throw new CliError('TTY not available. Pass --yes to confirm execution.', {
			code: 'TTY_UNAVAILABLE',
			exitCode: ExitCode.InputError,
		})
	}
	output.warn('This will completely wipe the target project.')
	output.info('(to skip this dialog, you can pass --yes option)')
	output.info('')
	const { ok } = await prompts({
		type: 'confirm',
		name: 'ok',
		message: `Do you want to continue?`,
	})
	return ok
}
