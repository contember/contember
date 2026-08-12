import { Option, OptionMode } from './Option.js'

export interface GlobalOptionValues {
	readonly json: boolean
	readonly quiet: boolean
	/** false when --no-color was passed */
	readonly color: boolean
	readonly help: boolean
}

/**
 * Options available on every command. Their names and shortcuts are reserved for the global parser.
 */
export const globalOptions: readonly Option[] = [
	{ name: 'json', required: false, deprecated: false, mode: OptionMode.VALUE_NONE, description: 'Print machine readable JSON to stdout' },
	{
		name: 'quiet',
		shortcut: 'q',
		required: false,
		deprecated: false,
		mode: OptionMode.VALUE_NONE,
		description: 'Print only the resulting data to stdout',
	},
	{ name: 'no-color', required: false, deprecated: false, mode: OptionMode.VALUE_NONE, description: 'Disable colored output' },
	{ name: 'help', shortcut: 'h', required: false, deprecated: false, mode: OptionMode.VALUE_NONE, description: 'Print help of the command' },
]

export interface RawOptionReader {
	getRawOption(name: string): string | boolean | string[] | undefined
}

/**
 * Reads the global options from a parsed input.
 */
export const readGlobalOptions = (input: RawOptionReader): GlobalOptionValues => ({
	json: input.getRawOption('json') === true,
	quiet: input.getRawOption('quiet') === true,
	color: input.getRawOption('no-color') !== true,
	help: input.getRawOption('help') === true,
})

/**
 * Reads the global options straight from argv, before the command parser runs. Only used to pick the
 * rendering mode early (so that a parse error is reported in the requested format) and to detect
 * --help. Nothing is removed from argv, so parsing semantics stay untouched. A token starting with a
 * dash can never be consumed as a value by {@link InputParser}, so this scan cannot misread a value.
 */
export const readGlobalOptionsFromArgs = (args: string[]): GlobalOptionValues => {
	let json = false
	let quiet = false
	let color = true
	let help = false
	for (const arg of args) {
		if (!arg.startsWith('-')) {
			continue
		}
		const token = arg.split('=', 2)[0]
		if (isGlobalOptionToken(token, 'json')) {
			json = true
		} else if (isGlobalOptionToken(token, 'quiet')) {
			quiet = true
		} else if (isGlobalOptionToken(token, 'no-color')) {
			color = false
		} else if (isGlobalOptionToken(token, 'help')) {
			help = true
		}
	}
	return { json, quiet, color, help }
}

const isGlobalOptionToken = (token: string, name: string): boolean => {
	const option = globalOptions.find(item => item.name === name)
	return option !== undefined && (token === `--${option.name}` || (option.shortcut !== undefined && token === `-${option.shortcut}`))
}

export const hasHelpFlag = (args: string[]): boolean => readGlobalOptionsFromArgs(args).help
