import { Output } from '@contember/cli-common'

/** Binds a single-line progress reporter to the command's Output instead of writing to stdout directly. */
export const createProgressReporter = (output: Output) => (message: string): void => {
	output.progress(message)
}
