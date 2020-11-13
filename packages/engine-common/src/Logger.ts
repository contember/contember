export class Logger {
	private indentLvl = 0

	private buffer: { message: string; level: number }[] = []

	constructor(private readonly logger: (msg: string) => void) {}

	group(message?: string) {
		this.indentLvl++
		if (message) {
			this.add(message, 1)
		}
	}

	groupEnd() {
		this.indentLvl--
		this.buffer = this.buffer.filter(it => it.level <= this.indentLvl)
	}

	breadcrumb(message: string) {
		this.add(message)
	}

	write(message: string) {
		this.add(message)
		this.flush()
	}

	private add(message: string, indentSub: number = 0) {
		this.buffer.push({ message: '  '.repeat(this.indentLvl - indentSub) + message, level: this.indentLvl })
	}

	private flush() {
		if (this.buffer.length) {
			this.buffer.map(it => this.logger(it.message))
			this.buffer = []
		}
	}
}
