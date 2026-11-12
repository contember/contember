import { Output, style } from '@contember/cli-common'

export interface ConfirmPromptOptions {
	readonly message: string
	/** The answer for an empty line. */
	readonly initial?: boolean
}

export interface SelectPromptChoice<T extends string> {
	readonly title: string
	readonly value: T
}

export interface SelectPromptOptions<T extends string> {
	readonly message: string
	readonly choices: readonly SelectPromptChoice<T>[]
}

/** Asks a yes/no question until it gets `y`, `yes`, `n`, `no` or an empty line. A closed input answers no. */
export const promptConfirm = async (output: Output, { message, initial = false }: ConfirmPromptOptions): Promise<boolean> => {
	const question = `${style('bold', message)} ${style('dim', initial ? '(Y/n)' : '(y/N)')} `
	for (;;) {
		const answer = await output.prompt(question)
		if (answer === undefined) {
			return false
		}
		const normalized = answer.trim().toLowerCase()
		if (normalized === '') {
			return initial
		}
		if (normalized === 'y' || normalized === 'yes') {
			return true
		}
		if (normalized === 'n' || normalized === 'no') {
			return false
		}
	}
}

/** Lists the choices with numbers and asks until one is picked. There is no default; a closed input picks nothing. */
export const promptSelect = async <const T extends string>(output: Output, { message, choices }: SelectPromptOptions<T>): Promise<T | undefined> => {
	if (choices.length === 0) {
		return undefined
	}
	const list = choices.map((choice, index) => `  ${style('cyan', String(index + 1))}) ${choice.title}\n`).join('')
	const ask = `${style('dim', `Choose 1-${choices.length}:`)} `
	let question = `${style('bold', message)}\n${list}${ask}`
	for (;;) {
		const answer = await output.prompt(question)
		if (answer === undefined) {
			return undefined
		}
		const trimmed = answer.trim()
		const choice = /^\d+$/.test(trimmed) ? choices[Number(trimmed) - 1] : undefined
		if (choice) {
			return choice.value
		}
		question = `${style('dim', `Enter a number from 1 to ${choices.length}:`)} `
	}
}
