import chalk from 'chalk'
import { inspect } from 'node:util'
import { LogEntry, LoggerAttributes, LoggerHandler, LogLevel } from '../types'
import { LogLevels } from '../levels'

export interface PrettyPrintLoggerHandlerOptions {
	logLevel: LogLevel
	formatters: {
		[key: string]: (args: { value: any; formattedValue: string; key: string; chalk: typeof chalk; attributes: LoggerAttributes }) => undefined | string | { line: string }
	}
}

export class PrettyPrintLoggerHandler implements LoggerHandler {
	private readonly options: PrettyPrintLoggerHandlerOptions

	constructor(
		private readonly stream: NodeJS.WritableStream,
		options: Partial<PrettyPrintLoggerHandlerOptions> = {},
	) {
		this.options = {
			logLevel: LogLevels.debug,
			formatters: {},
			...options,
		}
	}

	getMinLevel(): number {
		return this.options.logLevel.value
	}

	handle(entry: LogEntry) {
		if (entry.level.value < this.options.logLevel.value) {
			return
		}
		const startLength = entry.isoTime.length + 7

		this.stream.write(`${this.formatTime(entry.isoTime)} ${this.formatLevel(entry.level)} `)

		const indent = ' '.repeat(startLength)
		this.stream.write(`${entry.message.replaceAll(/\n/g, '\n' + indent)}\n`)
		const allAttributes = { ...entry.loggerAttributes, ...entry.ownAttributes }
		for (const key in allAttributes) {
			const value = allAttributes[key]
			if (typeof key !== 'string' || value === undefined) {
				continue
			}
			const formattedValue = inspect(value, {
				depth: 5,
			}).replaceAll(/\n/g, '\n' + indent)
			const formattedValue2 = this.options.formatters[key]
				? (this.options.formatters[key]({ value, key, formattedValue, chalk, attributes: allAttributes }))
				: formattedValue
			if (formattedValue2 === undefined) {
				continue
			}
			if (typeof formattedValue2 === 'string') {
				this.stream.write(indent + chalk.dim(`${key}: ${formattedValue2}\n`))
			} else {
				this.stream.write(indent + formattedValue2.line + '\n')
			}
		}
		if (entry.error) {
			this.stream.write(inspect(entry.error).replaceAll(/^/gm, indent) + '\n')
		}
	}


	private formatTime(date: string): string {
		const result = date.match(/^([0-9-]+)T([0-9:]+)\.(\d+)Z$/)
		if (!result) {
			return date
		}
		return chalk.dim(result[1] + 'T') + result[2] + chalk.dim('.' + result[3] + 'Z')
	}

	private formatLevel(level: LogLevel): string {
		const levelText = `${level.name}${' '.repeat(5 - level.name.length)}`
		let color: chalk.Chalk = chalk
		if (level.value <= 10) {
			color = color.dim
		} else if (level.value <= 20) {
			// nothhing
		} else if (level.value <= 30) {
			color = color.yellowBright
		} else {
			color = color.redBright
		}
		return color(levelText)
	}

	close(): void {
	}
}
