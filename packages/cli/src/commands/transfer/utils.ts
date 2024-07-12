import { Input } from '@contember/cli-common'
import prompts from 'prompts'


export const confirmImport = async (input: Input<{}, { yes: boolean }>): Promise<boolean> => {
	if (input.getOption('yes')) {
		return true
	}
	if (!process.stdin.isTTY) {
		throw 'TTY not available. Pass --yes option to confirm execution.'
	}
	console.log('This will completely wipe the target project.')
	console.log('(to skip this dialog, you can pass --yes option)')
	console.log('')
	const { ok } = await prompts({
		type: 'confirm',
		name: 'ok',
		message: `Do you want to continue?`,
	})
	return ok
}
