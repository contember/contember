namespace Validation {
	export type ContextPath = string[]
	export type ValidatorArgument = { type: 'validator'; validator: Validator }
	export type PathArgument = { type: 'path'; path: ContextPath }
	export type LiteralArgument<V = any> = { type: 'literal'; value: V }

	export type AnyArgument = LiteralArgument | PathArgument | ValidatorArgument

	export type Validator = { operation: string; args: AnyArgument[] }
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
