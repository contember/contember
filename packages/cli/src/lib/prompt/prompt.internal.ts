import { Output, type PromptOutputStream } from '@contember/cli-common'

const answerName = 'value'

export interface ConfirmPromptOptions {
	readonly message: string
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

export interface PromptAnswer {
	readonly value?: unknown
}

export interface ConfirmQuestion {
	readonly type: 'confirm'
	readonly name: typeof answerName
	readonly message: string
	readonly initial?: boolean
	readonly stdout: PromptOutputStream
}

export interface SelectQuestion<T extends string> {
	readonly type: 'select'
	readonly name: typeof answerName
	readonly message: string
	readonly choices: SelectPromptChoice<T>[]
	readonly stdout: PromptOutputStream
}

export type PromptQuestion = ConfirmQuestion | SelectQuestion<string>

type PromptRunner<Q> = (question: Q) => Promise<PromptAnswer>

export const promptConfirmWithRunner = async (
	output: Output,
	options: ConfirmPromptOptions,
	runner: PromptRunner<ConfirmQuestion>,
): Promise<boolean> => {
	const question: ConfirmQuestion = options.initial === undefined
		? { type: 'confirm', name: answerName, message: options.message, stdout: output.promptOutput }
		: { type: 'confirm', name: answerName, message: options.message, initial: options.initial, stdout: output.promptOutput }
	const answer = await runner(question)
	return answer.value === true
}

export const promptSelectWithRunner = async <const T extends string>(
	output: Output,
	options: SelectPromptOptions<T>,
	runner: PromptRunner<SelectQuestion<T>>,
): Promise<T | undefined> => {
	const answer = await runner({
		type: 'select',
		name: answerName,
		message: options.message,
		choices: options.choices.map(choice => ({ title: choice.title, value: choice.value })),
		stdout: output.promptOutput,
	})
	return options.choices.find(choice => choice.value === answer.value)?.value
}
