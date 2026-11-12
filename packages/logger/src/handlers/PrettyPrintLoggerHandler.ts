import { inspect, styleText } from 'node:util'
import { LogEntry, LoggerAttributes, LoggerHandler, LogLevel } from '../types.js'
import { LogLevels } from '../levels.js'

export type LogTextStyle = Exclude<Parameters<typeof styleText>[0], readonly unknown[]>

/** Styles `text` with the given styles (outermost first); returns it unchanged when the terminal has no colors. */
export type LogTextStyler = (styles: LogTextStyle | readonly LogTextStyle[], text: string) => string

export interface PrettyPrintLoggerHandlerOptions {
	logLevel: LogLevel
	formatters: {
		[key: string]: (
			args: { value: any; formattedValue: string; key: string; style: LogTextStyler; attributes: LoggerAttributes },
		) => undefined | string | { line: string }
	}
}

// Same detection as in @contember/cli-common colors.ts (logger cannot depend on it); keep them in sync.
const detectColorSupport = (): boolean => {
	const forceColor = process.env.FORCE_COLOR
	if (forceColor !== undefined) {
		return forceColor !== '0' && forceColor !== 'false'
	}
	// hasColors() honours NO_COLOR, NODE_DISABLE_COLORS and TERM=dumb; Bun's non-TTY stdout has no hasColors.
	const stdout = process.stdout
	return stdout.isTTY === true && (typeof stdout.hasColors !== 'function' || stdout.hasColors())
}

const createStyler = (colors: boolean): LogTextStyler => (styles, text) => {
	if (!colors) {
		return text
	}
	const list: readonly LogTextStyle[] = typeof styles === 'string' ? [styles] : styles
	// validateStream is off because the decision is ours; Bun ignores the option and Node < 22.13 lacks it.
	return list.reduceRight((result, current) => styleText(current, result, { validateStream: false }), text)
}

export class PrettyPrintLoggerHandler implements LoggerHandler {
	private readonly options: PrettyPrintLoggerHandlerOptions
	private readonly style: LogTextStyler = createStyler(detectColorSupport())

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
				? (this.options.formatters[key]({ value, key, formattedValue, style: this.style, attributes: allAttributes }))
				: formattedValue
			if (formattedValue2 === undefined) {
				continue
			}
			if (typeof formattedValue2 === 'string') {
				this.stream.write(indent + this.style('dim', `${key}: ${formattedValue2}\n`))
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
		return this.style('dim', result[1] + 'T') + result[2] + this.style('dim', '.' + result[3] + 'Z')
	}

	private formatLevel(level: LogLevel): string {
		const levelText = `${level.name}${' '.repeat(5 - level.name.length)}`
		if (level.value <= 10) {
			return this.style('dim', levelText)
		}
		if (level.value <= 20) {
			return levelText
		}
		return this.style(level.value <= 30 ? 'yellowBright' : 'redBright', levelText)
	}

	close(): void {
	}
}
