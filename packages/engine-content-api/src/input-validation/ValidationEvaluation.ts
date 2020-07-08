import { Validation } from '@contember/schema'
import ValidationContext from './ValidationContext'

const getValueOrLiteral = (
	context: ValidationContext.AnyContext,
	argument: Validation.PathArgument | Validation.LiteralArgument,
): any => {
	if (argument.type === Validation.ArgumentType.literal) {
		return argument.value
	}
	return getValueFromContext(argument.path ? ValidationContext.changeContext(context, argument.path) : context)
}

const getValueFromContext = (context: ValidationContext.AnyContext): ValidationContext.ValueType | undefined => {
	if (ValidationContext.isUndefinedNodeContext(context)) {
		return undefined
	}
	if (!ValidationContext.isValueContext(context)) {
		throw new Error('ValueContext is required')
	}
	return context.value
}

export const evaluateValidation = (
	context: ValidationContext.AnyContext,
	validator: Validation.Validator,
): boolean | null => {
	return validatorEvaluators[validator.operation](context, ...(validator.args as any[]))
}

const validatorEvaluators: {
	[K in keyof Validation.ValidatorArguments]: (
		context: ValidationContext.AnyContext,
		...args: Validation.ValidatorArguments[K]
	) => boolean | null
} = {
	empty: (context: ValidationContext.AnyContext) => {
		if (ValidationContext.isNodeListContext(context)) {
			return context.nodes.length === 0
		}
		if (ValidationContext.isNodeContext(context) && !ValidationContext.isValueContext(context)) {
			return null
		}
		const value = getValueFromContext(context)
		return !value
	},
	exists: (context: ValidationContext.AnyContext) => {
		if (ValidationContext.isNodeListContext(context)) {
			throw new Error('Unexpected node list')
		}
		return context.node !== undefined
	},
	defined: (context: ValidationContext.AnyContext) => {
		if (ValidationContext.isNodeListContext(context)) {
			throw new Error('Unexpected node list')
		}
		if (ValidationContext.isUndefinedNodeContext(context)) {
			return false
		}
		if (ValidationContext.isValueContext(context)) {
			const value = getValueFromContext(context)
			return value !== null && value !== undefined
		}
		return context.node !== undefined
	},
	not: (context: ValidationContext.AnyContext, { validator }: Validation.ValidatorArgument) => {
		const result = evaluateValidation(context, validator)
		if (result === null) {
			return null
		}
		return !result
	},
	conditional: (
		context: ValidationContext.AnyContext,
		{ validator: condition }: Validation.ValidatorArgument,
		{ validator: rule }: Validation.ValidatorArgument,
	) => {
		const conditionResult = evaluateValidation(context, condition)
		if (conditionResult === null) {
			return null
		}
		if (!conditionResult) {
			return true
		}
		const ruleResult = evaluateValidation(context, rule)
		return ruleResult
	},
	pattern: (context: ValidationContext.AnyContext, patternArgument: Validation.LiteralArgument<[string, string]>) => {
		const value = getValueFromContext(context)
		if (value === undefined || value === null) {
			return null
		}
		if (typeof value !== 'string') {
			throw new Error(`Cannot apply pattern validation on ${typeof value}`)
		}
		return new RegExp(patternArgument.value[0], patternArgument.value[1]).test(value)
	},
	equals: (context: ValidationContext.AnyContext, other: Validation.LiteralArgument | Validation.PathArgument) => {
		const contextValue = getValueFromContext(context)
		const otherValue = getValueOrLiteral(context, other)
		if (otherValue === null) {
			return contextValue === otherValue
		}
		if (contextValue === null || contextValue === undefined) {
			return null
		}
		return contextValue === otherValue
	},
	lengthRange: (
		context: ValidationContext.AnyContext,
		min: Validation.LiteralArgument<number | null>,
		max: Validation.LiteralArgument<number | null>,
	) => {
		let value: number
		if (ValidationContext.isValueContext(context)) {
			value = String(getValueFromContext(context)).length
		} else if (ValidationContext.isNodeListContext(context)) {
			value = context.nodes.length
		} else if (ValidationContext.isUndefinedNodeContext(context)) {
			return null
		} else {
			throw new Error('Value or List context is required for range operation')
		}
		return (min.value === null || min.value <= value) && (max.value === null || max.value >= value)
	},
	range: (
		context: ValidationContext.AnyContext,
		min: Validation.LiteralArgument<number | null>,
		max: Validation.LiteralArgument<number | null>,
	) => {
		if (ValidationContext.isValueContext(context)) {
			const value = getValueFromContext(context)
			if (value === null) {
				return null
			}
			if (typeof value !== 'number') {
				throw new Error(`Cannot apply range validation on ${typeof value}`)
			}
			return (min.value === null || min.value <= value) && (max.value === null || max.value >= value)
		} else if (ValidationContext.isUndefinedNodeContext(context)) {
			return null
		} else {
			throw new Error('Value context is required for range operation')
		}
	},
	and: (context: ValidationContext.AnyContext, ...values: Validation.ValidatorArgument[]) => {
		let result: null | true = true
		for (const val of values) {
			const validationResult = evaluateValidation(context, val.validator)
			if (validationResult === false) {
				return false
			}
			if (validationResult === null) {
				result = null
			}
		}
		return result
	},
	or: (context: ValidationContext.AnyContext, ...values: Validation.ValidatorArgument[]) => {
		let result: null | false = false
		for (const val of values) {
			const validationResult = evaluateValidation(context, val.validator)
			if (validationResult === true) {
				return true
			}
			if (validationResult === null) {
				result = null
			}
		}
		return result
	},
	inContext: (
		context: ValidationContext.AnyContext,
		contextArg: Validation.PathArgument,
		{ validator }: Validation.ValidatorArgument,
	) => {
		return evaluateValidation(ValidationContext.changeContext(context, contextArg.path), validator)
	},
	every: (context: ValidationContext.AnyContext, { validator }: Validation.ValidatorArgument) => {
		if (!ValidationContext.isNodeListContext(context)) {
			throw new Error('NodeListContext expected for "every" operation')
		}
		let result: true | null = true
		for (const node of context.nodes) {
			const validationResult = evaluateValidation(node, validator)
			if (validationResult === false) {
				return false
			}
			if (validationResult === null) {
				result = null
			}
		}
		return result
	},
	any: (context: ValidationContext.AnyContext, { validator }: Validation.ValidatorArgument) => {
		if (!ValidationContext.isNodeListContext(context)) {
			throw new Error('NodeListContext expected for "any" operation')
		}
		let result: false | null = false
		for (const node of context.nodes) {
			const validationResult = evaluateValidation(node, validator)
			if (validationResult === true) {
				return true
			}
			if (validationResult === null) {
				result = null
			}
		}
		return result
	},
	filter: (
		context: ValidationContext.AnyContext,
		{ validator: filter }: Validation.ValidatorArgument,
		{ validator }: Validation.ValidatorArgument,
	) => {
		if (!ValidationContext.isNodeListContext(context)) {
			throw new Error('NodeListContext expected for "filter" operation')
		}
		const filteredContext = ValidationContext.createNodeListContext(
			context.root,
			context.nodes.filter(it => evaluateValidation(it, filter) !== false),
		)
		return evaluateValidation(filteredContext, validator)
	},
}
