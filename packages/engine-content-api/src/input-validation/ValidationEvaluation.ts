import { Validation } from '@contember/schema'
import ValidationContext from './ValidationContext'
import acceptContextVisitor = ValidationContext.acceptContextVisitor

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

const fixedResult = (value: null | boolean) => () => value

const cannotApplyOnNode = (validationName: string, contextType: string) => () => {
	throw new Error(`Cannot apply ${validationName} in ${contextType} context`)
}

const trinaryOr = (values: Iterable<boolean | null>) => {
	let result: null | false = false
	for (const val of values) {
		if (val === true) {
			return true
		}
		if (val === null) {
			result = null
		}
	}
	return result
}
const trinaryAnd = (values: Iterable<boolean | null>) => {
	let result: null | true = true
	for (const val of values) {
		if (val === false) {
			return false
		}
		if (val === null) {
			result = null
		}
	}
	return result
}

function* validatorListEval(context: ValidationContext.AnyContext, validators: Validation.ValidatorArgument[]) {
	for (const val of validators) {
		yield evaluateValidation(context, val.validator)
	}
}

function* nodeListEval(context: ValidationContext.NodeListContext, { validator }: Validation.ValidatorArgument) {
	for (const node of context.nodes) {
		yield evaluateValidation(node, validator)
	}
}

const validatorEvaluators: {
	[K in keyof Validation.ValidatorArguments]: (
		context: ValidationContext.AnyContext,
		...args: Validation.ValidatorArguments[K]
	) => boolean | null
} = {
	empty: (context: ValidationContext.AnyContext) => {
		return acceptContextVisitor(context, {
			visitNodeContext: fixedResult(false),
			visitNodeListContext: (context: ValidationContext.NodeListContext) => context.nodes.length === 0,
			visitValueContext: (context: ValidationContext.ValueContext) =>
				context.value === undefined || context.value === null || context.value === '',
			visitUndefinedContext: fixedResult(true),
		})
	},
	defined: (context: ValidationContext.AnyContext) => {
		return acceptContextVisitor(context, {
			visitNodeContext: fixedResult(true),
			visitNodeListContext: fixedResult(true),
			visitValueContext: (context: ValidationContext.ValueContext) =>
				context.value !== undefined && context.value !== null,
			visitUndefinedContext: fixedResult(false),
		})
	},
	pattern: (context: ValidationContext.AnyContext, patternArgument: Validation.LiteralArgument<[string, string]>) => {
		return acceptContextVisitor(context, {
			visitNodeContext: cannotApplyOnNode('pattern', 'node'),
			visitNodeListContext: cannotApplyOnNode('pattern', 'node list'),
			visitValueContext: (context: ValidationContext.ValueContext) => {
				if (context.value === undefined || context.value === null) {
					return null
				}
				if (typeof context.value !== 'string') {
					throw new Error(`Cannot apply pattern validation on ${typeof context.value}`)
				}
				return new RegExp(patternArgument.value[0], patternArgument.value[1]).test(context.value)
			},
			visitUndefinedContext: fixedResult(null),
		})
	},
	equals: (context: ValidationContext.AnyContext, other: Validation.LiteralArgument | Validation.PathArgument) => {
		return acceptContextVisitor(context, {
			visitNodeContext: cannotApplyOnNode('equals', 'node'),
			visitNodeListContext: cannotApplyOnNode('equals', 'node list'),
			visitValueContext: (context: ValidationContext.ValueContext) => {
				const otherValue = getValueOrLiteral(context, other)
				if (otherValue === null) {
					return context.value === otherValue
				}
				if (context.value === null || context.value === undefined) {
					return null
				}
				return context.value === otherValue
			},
			visitUndefinedContext: fixedResult(null),
		})
	},
	lengthRange: (
		context: ValidationContext.AnyContext,
		min: Validation.LiteralArgument<number | null>,
		max: Validation.LiteralArgument<number | null>,
	) => {
		const doesMatchRange = (value: number) =>
			(min.value === null || min.value <= value) && (max.value === null || max.value >= value)
		return acceptContextVisitor(context, {
			visitNodeContext: cannotApplyOnNode('length range', 'node'),
			visitNodeListContext: (context: ValidationContext.NodeListContext) => {
				return doesMatchRange(context.nodes.length)
			},
			visitValueContext: (context: ValidationContext.ValueContext) => {
				if (context.value === null || context.value === undefined) {
					return null
				}
				return doesMatchRange(String(context.value).length)
			},
			visitUndefinedContext: fixedResult(null),
		})
	},
	range: (
		context: ValidationContext.AnyContext,
		min: Validation.LiteralArgument<number | null>,
		max: Validation.LiteralArgument<number | null>,
	) => {
		return acceptContextVisitor(context, {
			visitNodeContext: cannotApplyOnNode('range', 'node'),
			visitNodeListContext: cannotApplyOnNode('range', 'node list'),
			visitValueContext: (context: ValidationContext.ValueContext) => {
				if (context.value === null || context.value === undefined) {
					return null
				}
				if (typeof context.value !== 'number') {
					throw new Error(`Cannot apply range validation on ${typeof context.value}`)
				}
				return (min.value === null || min.value <= context.value) && (max.value === null || max.value >= context.value)
			},
			visitUndefinedContext: fixedResult(null),
		})
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
	and: (context: ValidationContext.AnyContext, ...values: Validation.ValidatorArgument[]) => {
		return trinaryAnd(validatorListEval(context, values))
	},
	or: (context: ValidationContext.AnyContext, ...values: Validation.ValidatorArgument[]) => {
		return trinaryOr(validatorListEval(context, values))
	},
	inContext: (
		context: ValidationContext.AnyContext,
		contextArg: Validation.PathArgument,
		{ validator }: Validation.ValidatorArgument,
	) => {
		return evaluateValidation(ValidationContext.changeContext(context, contextArg.path), validator)
	},

	every: (context: ValidationContext.AnyContext, arg: Validation.ValidatorArgument) => {
		return acceptContextVisitor(context, {
			visitNodeContext: cannotApplyOnNode('every', 'node'),
			visitNodeListContext: context => trinaryAnd(nodeListEval(context, arg)),
			visitValueContext: cannotApplyOnNode('every', 'value'),
			visitUndefinedContext: fixedResult(null),
		})
	},
	any: (context: ValidationContext.AnyContext, arg: Validation.ValidatorArgument) => {
		return acceptContextVisitor(context, {
			visitNodeContext: cannotApplyOnNode('any', 'node'),
			visitNodeListContext: context => trinaryOr(nodeListEval(context, arg)),
			visitValueContext: cannotApplyOnNode('any', 'value'),
			visitUndefinedContext: fixedResult(null),
		})
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
