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

export const evaluateValidation = (context: ValidationContext.AnyContext, validator: Validation.Validator): boolean => {
	return validatorEvaluators[validator.operation](context, ...(validator.args as any[]))
}

const validatorEvaluators: {
	[K in keyof Validation.ValidatorArguments]: (
		context: ValidationContext.AnyContext,
		...args: Validation.ValidatorArguments[K]
	) => boolean
} = {
	empty: (context: ValidationContext.AnyContext) => {
		if (ValidationContext.isNodeListContext(context)) {
			return context.nodes.length === 0
		}
		if (ValidationContext.isNodeContext(context) && !ValidationContext.isValueContext(context)) {
			return false
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
		return !evaluateValidation(context, validator)
	},
	conditional: (
		context: ValidationContext.AnyContext,
		{ validator: condition }: Validation.ValidatorArgument,
		{ validator: rule }: Validation.ValidatorArgument,
	) => {
		const conditionResult = evaluateValidation(context, condition)
		if (!conditionResult) {
			return true
		}
		const ruleResult = evaluateValidation(context, rule)
		return ruleResult
	},
	pattern: (context: ValidationContext.AnyContext, patternArgument: Validation.LiteralArgument<[string, string]>) => {
		const value = getValueFromContext(context)
		if (value === undefined || value === null) {
			return false
		}
		if (typeof value !== 'string') {
			throw new Error(`Cannot apply pattern validation on ${typeof value}`)
		}
		return new RegExp(patternArgument.value[0], patternArgument.value[1]).test(value)
	},
	equals: (context: ValidationContext.AnyContext, other: Validation.LiteralArgument | Validation.PathArgument) => {
		return getValueFromContext(context) === getValueOrLiteral(context, other)
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
			return false
		} else {
			throw new Error('Value or List context is required for range operation')
		}
		return (min.value === null || min.value <= value) && (max.value === null || max.value >= value)
	},
	and: (context: ValidationContext.AnyContext, ...values: Validation.ValidatorArgument[]) => {
		return values.reduce<boolean>((acc, val) => acc && evaluateValidation(context, val.validator), true)
	},
	or: (context: ValidationContext.AnyContext, ...values: Validation.ValidatorArgument[]) => {
		return values.reduce<boolean>((acc, val) => acc || evaluateValidation(context, val.validator), false)
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
		return context.nodes.reduce<boolean>((acc, context) => acc && evaluateValidation(context, validator), true)
	},
	any: (context: ValidationContext.AnyContext, { validator }: Validation.ValidatorArgument) => {
		if (!ValidationContext.isNodeListContext(context)) {
			throw new Error('NodeListContext expected for "any" operation')
		}
		return context.nodes.reduce<boolean>((acc, context) => acc || evaluateValidation(context, validator), false)
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
			context.nodes.filter(it => evaluateValidation(it, filter)),
		)
		return evaluateValidation(filteredContext, validator)
	},
}
