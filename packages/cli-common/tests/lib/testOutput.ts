import { Output, OutputStream } from '../../src/index.js'

export class CapturingStream implements OutputStream {
	public chunks: string[] = []

	constructor(public readonly isTty: boolean = false, public readonly columns: number = 80) {}

	public write(text: string): void {
		this.chunks.push(text)
	}

	public get text(): string {
		return this.chunks.join('')
	}

	public get lines(): string[] {
		return this.text.split('\n').filter(it => it !== '')
	}
}

export interface TestOutput {
	output: Output
	stdout: CapturingStream
	stderr: CapturingStream
}

export interface TestOutputOptions {
	stderrTty?: boolean
	stdinTty?: boolean
	/** Lines answered to prompts, in order; once they run out, the input reads as closed. */
	answers?: readonly string[]
}

export const createTestOutput = ({ stderrTty = false, stdinTty = false, answers = [] }: TestOutputOptions = {}): TestOutput => {
	const stdout = new CapturingStream()
	const stderr = new CapturingStream(stderrTty)
	const pending = [...answers]
	return {
		stdout,
		stderr,
		output: new Output({ stdout, stderr, isStdinTty: () => stdinTty, readPromptLine: async () => pending.shift() }),
	}
}
