import { Argument } from './Argument'
import { Option, OptionMode } from './Option'
import { Arguments, Input, Options } from './Input'

export class InputParser {
	constructor(private _arguments: Argument[], private options: Option[]) {}

	parse<Args extends Arguments, Opts extends Options>(args: string[]): Input<Args, Opts> {
		args = args.reduce<string[]>((acc, arg) => [...acc, ...(arg.startsWith('-') ? arg.split('=', 2) : [arg])], [])
		let options: Options = {}
		let argumentValues: Arguments = {}

		let i = 0
		let argumentNumber = 0

		for (; i < args.length; i++) {
			const value = this.tryParseValue(args[i])
			if (value === undefined) {
				break
			}
			const argument = this._arguments[argumentNumber]
			if (!argument) {
				throw new InvalidInputError(`Unresolved argument for value "${value}"`)
			}
			if (argument.validator && !argument.validator(value)) {
				throw new InvalidInputError(`Invalid value "${value}" for argument ${argument.name}`)
			}
			if (argument.variadic) {
				argumentValues[argument.name] = argumentValues[argument.name] || []
				;(argumentValues[argument.name] as Array<string>).push(value)
			} else {
				argumentValues[argument.name] = value
				argumentNumber++
			}
		}
		for (; argumentNumber < this._arguments.length; argumentNumber++) {
			if (!this._arguments[argumentNumber].optional) {
				throw new InvalidInputError(`Argument ${this._arguments[argumentNumber].name} is required`)
			} else {
				argumentValues[this._arguments[argumentNumber].name] = undefined
			}
		}

		for (; i < args.length; i++) {
			let option: Option | undefined
			if (args[i].startsWith('--')) {
				option = this.options.find(it => it.name === args[i].slice(2))
				if (!option) {
					throw new InvalidInputError(`Undefined option ${args[i]}`)
				}
			} else if (args[i].startsWith('-')) {
				option = this.options.find(it => it.shortcut === args[i].slice(1))
				if (!option) {
					throw new InvalidInputError(`Undefined option ${args[i]}`)
				}
			}
			if (!option) {
				throw new InvalidInputError(`Unexpected value "${args[i]}"`)
			}
			if (option) {
				if (option.deprecated) {
					console.warn(`Option ${option.name} is deprecated.`)
				}
				if (option.mode === OptionMode.VALUE_NONE) {
					options[option.name] = true
					continue
				}
				const value = this.tryParseValue(args[i + 1])
				if (value !== undefined) {
					i++
				}
				if (option.mode === OptionMode.VALUE_ARRAY) {
					if (value === undefined) {
						throw new InvalidInputError(`Undefined value for option --${option.name}`)
					}
					options[option.name] = options[option.name] || []
					;(options[option.name] as Array<string>).push(value)
				} else if (option.mode === OptionMode.VALUE_REQUIRED) {
					if (value === undefined) {
						throw new InvalidInputError(`Undefined value for option --${option.name}`)
					}
					options[option.name] = value
				} else if (option.mode === OptionMode.VALUE_OPTIONAL) {
					options[option.name] = value === undefined ? true : value
				}
			}
		}

		for (let option of this.options) {
			if (options[option.name] !== undefined) {
				continue
			}
			if (option.required) {
				throw new InvalidInputError(`Option --${option.name} is required`)
			} else {
				options[option.name] = undefined
			}
		}

		return new Input<Args, Opts>(argumentValues as Args, options as Opts)
	}

	private tryParseValue(arg: string | undefined): string | undefined {
		if (arg === undefined) {
			return undefined
		}
		if (arg.startsWith('-')) {
			return undefined
		}
		if (arg.startsWith('\\-')) {
			return '-' + arg.slice(1)
		}
		return arg
	}
}

export class InvalidInputError extends Error {}
