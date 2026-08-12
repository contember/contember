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

export const createTestOutput = ({ stderrTty = false, stdinTty = false }: { stderrTty?: boolean; stdinTty?: boolean } = {}): TestOutput => {
	const stdout = new CapturingStream()
	const stderr = new CapturingStream(stderrTty)
	return {
		stdout,
		stderr,
		output: new Output({ stdout, stderr, isStdinTty: () => stdinTty }),
	}
}
