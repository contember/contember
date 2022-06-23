import { JSONValue } from './json.js'

namespace Validation {
	export type ContextPath = readonly string[]

	export enum ArgumentType {
		validator = 'validator',
		path = 'path',
		literal = 'literal',
	}

	export type ValidatorArgument = {
		readonly type: ArgumentType.validator
		readonly validator: Validator
	}
	export type PathArgument = {
		readonly type: ArgumentType.path
		readonly path: ContextPath
	}
	export type LiteralArgument<V = JSONValue> = {
		readonly type: ArgumentType.literal
		readonly value: V
	}

	export type ValidatorArguments = {
		readonly and: readonly ValidatorArgument[]
		readonly or: readonly ValidatorArgument[]
		readonly conditional: readonly [ValidatorArgument, ValidatorArgument]
		readonly pattern: readonly [LiteralArgument<readonly [string, string]>]
		readonly lengthRange: readonly [LiteralArgument<number | null>, LiteralArgument<number | null>]
		readonly range: readonly [LiteralArgument<number | null>, LiteralArgument<number | null>]
		readonly equals: readonly [LiteralArgument<JSONValue>]
		readonly not: readonly [ValidatorArgument]
		readonly empty: readonly[]
		readonly defined: readonly[]
		readonly inContext: readonly [PathArgument, ValidatorArgument]
		readonly every: readonly [ValidatorArgument]
		readonly any: readonly [ValidatorArgument]
		readonly filter: readonly [ValidatorArgument, ValidatorArgument]
	}

	export type SpecificValidator<N extends keyof ValidatorArguments> = {
		readonly operation: N
		readonly args: ValidatorArguments[N]
	}

	export type Validator = {
		readonly [N in keyof ValidatorArguments]: SpecificValidator<N>
	}[keyof ValidatorArguments]

	export type Message = {
		readonly text: string
		readonly parameters?: readonly (string | number)[]
	}

	export type ValidationRule = {
		readonly validator: Validator
		readonly message: Message
	}

	export type EntityRules = {
		readonly [field: string]: readonly ValidationRule[]
	}

	export type Schema = {
		readonly [entity: string]: EntityRules
	}
}

export default Validation
