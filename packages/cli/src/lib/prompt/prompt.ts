import { Output } from '@contember/cli-common'
import prompts from 'prompts'
import {
	type ConfirmPromptOptions,
	type PromptAnswer,
	type PromptQuestion,
	promptConfirmWithRunner,
	promptSelectWithRunner,
	type SelectPromptChoice,
	type SelectPromptOptions,
} from './prompt.internal.js'

export type { ConfirmPromptOptions, SelectPromptChoice, SelectPromptOptions } from './prompt.internal.js'

const runPrompt = async <Q extends PromptQuestion>(question: Q): Promise<PromptAnswer> => {
	const answer: { value?: unknown } = await prompts(question)
	return answer
}

export const promptConfirm = (output: Output, options: ConfirmPromptOptions): Promise<boolean> =>
	promptConfirmWithRunner(output, options, runPrompt)

export const promptSelect = <const T extends string>(output: Output, options: SelectPromptOptions<T>): Promise<T | undefined> =>
	promptSelectWithRunner(output, options, runPrompt)
