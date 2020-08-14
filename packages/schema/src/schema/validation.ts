namespace Validation {
	export type ContextPath = string[]

	export enum ArgumentType {
		validator = 'validator',
		path = 'path',
		literal = 'literal',
	}

	export type ValidatorArgument = { type: ArgumentType.validator; validator: Validator }
	export type PathArgument = { type: ArgumentType.path; path: ContextPath }
	export type LiteralArgument<V = any> = { type: ArgumentType.literal; value: V }

	export type ValidatorArguments = {
		and: ValidatorArgument[]
		or: ValidatorArgument[]
		conditional: [ValidatorArgument, ValidatorArgument]
		pattern: [LiteralArgument<[string, string]>]
		lengthRange: [LiteralArgument<number | null>, LiteralArgument<number | null>]
		range: [LiteralArgument<number | null>, LiteralArgument<number | null>]
		equals: [LiteralArgument<any>]
		not: [ValidatorArgument]
		empty: []
		defined: []
		inContext: [PathArgument, ValidatorArgument]
		every: [ValidatorArgument]
		any: [ValidatorArgument]
		filter: [ValidatorArgument, ValidatorArgument]
	}

	export type SpecificValidator<N extends keyof ValidatorArguments> = {
		operation: N
		args: ValidatorArguments[N]
	}

	export type Validator = { [N in keyof ValidatorArguments]: SpecificValidator<N> }[keyof ValidatorArguments]

	export type Message = { text: string; parameters?: (string | number)[] }

	export interface ValidationRule {
		validator: Validator
		message: Message
	}

	export interface EntityRules {
		[field: string]: ValidationRule[]
	}

	export interface Schema {
		[entity: string]: EntityRules
	}
}

export default Validation
