import 'reflect-metadata'
import { Validation } from 'cms-common'
import EnumDefinition from '../content-schema/definition/EnumDefinition'
import { tuple } from '../utils/tuple'

type ContextPath = Validation.ContextPath | string | undefined
type MessageOrString = Validation.Message | string

const parsePath = (path: ContextPath): string[] => {
	if (!path) {
		return []
	}
	if (typeof path === 'string') {
		return path.split('.')
	}
	return path
}
const ArgumentFactory = {
	validator: (validator: Validation.Validator): Validation.ValidatorArgument => ({ type: Validation.ArgumentType.validator, validator }),
	path: (path?: ContextPath): Validation.PathArgument => ({ type: Validation.ArgumentType.path, path: parsePath(path) }),
	literal: (value: any): Validation.LiteralArgument => ({ type: Validation.ArgumentType.literal, value }),
}

type AnyContext = NodeContext | ValueContext | NodeListContext | UndefinedNodeContext

interface ValidationContext {
	root: NodeContext
}

type NodeType = Record<string, any>
type ValueType = any

interface NodeContext extends ValidationContext {
	node: NodeType
}

interface UndefinedNodeContext extends ValidationContext {
	node: undefined
}

interface ValueContext extends NodeContext {
	value: ValueType
}

interface NodeListContext extends ValidationContext {
	nodes: NodeContext[]
}

const getValueOrLiteral = (
	context: AnyContext,
	argument: Validation.PathArgument | Validation.LiteralArgument
): any => {
	if (argument.type === Validation.ArgumentType.literal) {
		return argument.value
	}
	return getValueFromContext(argument.path ? changeContext(context, argument.path) : context)
}

const getValueFromContext = (context: AnyContext): any => {
	if (!isValueContext(context)) {
		throw new Error('ValueContext is required')
	}
	return context.value
}

const ensureNodeListContext = (context: AnyContext): NodeListContext => {
	return isNodeListContext(context)
		? context
		: createNodeListContext(context.root, isUndefinedNodeContext(context) ? [] : [context])
}

const isNodeContext = (context: AnyContext): context is NodeContext => 'node' in context && context.node !== undefined
const isUndefinedNodeContext = (context: AnyContext): context is UndefinedNodeContext =>
	'node' in context && context.node === undefined
const isValueContext = (context: AnyContext): context is ValueContext => isNodeContext(context) && 'value' in context
const isNodeListContext = (context: AnyContext): context is NodeListContext => 'nodes' in context

const createNodeContext = (root: NodeContext, node: NodeType): NodeContext => ({ root, node })
const createUndefinedNodeContext = (root: NodeContext): UndefinedNodeContext => ({ root, node: undefined })
const createValueContext = (root: NodeContext, node: NodeType, value: ValueType): ValueContext => ({
	root,
	node,
	value,
})
const createNodeListContext = (root: NodeContext, nodes: NodeContext[]) => ({ root, nodes })
export const createRootContext = (node: NodeType): NodeContext => {
	const context: any = { node }
	context.root = context
	return context
}

const createSingleNodeContext = (
	parent: NodeContext,
	value: object | null | string | number | boolean
): NodeContext => {
	if (Array.isArray(value)) {
		throw new Error('Nested arrays are not allowed')
	}
	if (typeof value === 'object' && value !== null) {
		return createNodeContext(parent.root, value)
	}
	return createValueContext(parent.root, parent.node, value)
}

const createContext = (context: AnyContext, part: string): AnyContext => {
	if (isNodeListContext(context)) {
		const emptyContext = {
			root: context.root,
			nodes: [],
		}
		return context.nodes
			.map(it => createContext(it, part))
			.map(it => ensureNodeListContext(it))
			.reduce<NodeListContext>(
				(acc, context) => createNodeListContext(acc.root, [...acc.nodes, ...context.nodes]),
				emptyContext
			)
	}
	if (context.node === undefined) {
		return context
	}
	if (typeof context.node[part] === 'undefined') {
		return createUndefinedNodeContext(context.root)
	}
	const value = context.node[part]
	if (Array.isArray(value)) {
		return createNodeListContext(context.root, value.map(it => createSingleNodeContext(context, it)))
	}
	return createSingleNodeContext(context, value)
}

const changeContext = (context: AnyContext, path: Validation.ContextPath): AnyContext => {
	return path.reduce<AnyContext>((result, part) => {
		return createContext(result, part)
	}, context)
}

export const evaluate = (context: AnyContext, validator: Validation.Validator): boolean => {
	return validatorEvaluators[validator.operation](context, ...validator.args)
}

const validatorEvaluators: Record<string, (context: AnyContext, ...args: any[]) => boolean> = {
	empty: (context: AnyContext) => {
		const value = getValueFromContext(context)
		return !value
	},
	exists: (context: AnyContext) => {
		if (isNodeListContext(context)) {
			throw new Error('Unexpected node list')
		}
		return context.node !== undefined
	},
	not: (context: AnyContext, { validator }: Validation.ValidatorArgument) => {
		return !evaluate(context, validator)
	},
	conditional: (
		context: AnyContext,
		{ validator: condition }: Validation.ValidatorArgument,
		{ validator: rule }: Validation.ValidatorArgument
	) => {
		return !evaluate(context, condition) || evaluate(context, rule)
	},
	pattern: (context: AnyContext, patternArgument: Validation.LiteralArgument) => {
		return new RegExp(patternArgument.value).test(getValueFromContext(context))
	},
	equals: (context: AnyContext, other: Validation.LiteralArgument | Validation.PathArgument) => {
		return getValueFromContext(context) === getValueOrLiteral(context, other)
	},
	lengthRange: (context: AnyContext, min: Validation.LiteralArgument<number>, max: Validation.LiteralArgument<number>) => {
		let value: number
		if (isValueContext(context)) {
			value = String(getValueFromContext(context)).length
		} else if (isNodeListContext(context)) {
			value = context.nodes.length
		} else {
			throw new Error('Value or List context is required for range operation')
		}
		return (min.value === undefined || min.value <= value) && (max.value === undefined || max.value >= value)
	},
	and: (context: AnyContext, ...values: Validation.ValidatorArgument[]) => {
		return values.reduce<boolean>((acc, val) => acc && evaluate(context, val.validator), true)
	},
	or: (context: AnyContext, ...values: Validation.ValidatorArgument[]) => {
		return values.reduce<boolean>((acc, val) => acc || evaluate(context, val.validator), false)
	},
	inContext: (
		context: AnyContext,
		contextArg: Validation.PathArgument,
		{ validator }: Validation.ValidatorArgument
	) => {
		return evaluate(changeContext(context, contextArg.path), validator)
	},
	every: (context: AnyContext, { validator }: Validation.ValidatorArgument) => {
		if (!isNodeListContext(context)) {
			throw new Error('NodeListContext expected for "every" operation')
		}
		return context.nodes.reduce<boolean>((acc, context) => acc && evaluate(context, validator), true)
	},
	any: (context: AnyContext, { validator }: Validation.ValidatorArgument) => {
		if (!isNodeListContext(context)) {
			throw new Error('NodeListContext expected for "any" operation')
		}
		return context.nodes.reduce<boolean>((acc, context) => acc || evaluate(context, validator), false)
	},
	filter: (
		context: AnyContext,
		{ validator: filter }: Validation.ValidatorArgument,
		{ validator }: Validation.ValidatorArgument
	) => {
		if (!isNodeListContext(context)) {
			throw new Error('NodeListContext expected for "filter" operation')
		}
		const filteredContext = createNodeListContext(context.root, context.nodes.filter(it => evaluate(it, filter)))
		return evaluate(filteredContext, validator)
	},
}

const RuleMetaKey = Symbol('Rule')

function updateMetadata<T>(
	{ key, target, propertyKey }: { key: symbol; target: any; propertyKey: string | symbol },
	generator: (previous: T) => T,
	initialValue: T
) {
	const metadata = Reflect.hasMetadata(key, target, propertyKey)
		? Reflect.getMetadata(key, target, propertyKey)
		: initialValue

	const newMetadata = generator(metadata)
	Reflect.defineMetadata(key, newMetadata, target, propertyKey)
}

function addRuleToMetadata(target: any, propertyKey: string | symbol, ...rule: Validation.ValidationRule[]) {
	updateMetadata<Validation.ValidationRule[]>({ key: RuleMetaKey, target, propertyKey }, prev => [...rule, ...prev], [])
}

const RequiredMetaKey = Symbol('Required')

function fluent() {
	return new RuleBranch([], [])
}

class RuleBranch {
	constructor(private conditions: Validation.Validator[], private rules: Validation.ValidationRule[]) {}

	public getRules(): Validation.ValidationRule[] {
		return this.rules.map(rule => ({
			validator: rules.conditional(rule.validator, rules.and(...this.conditions)),
			message: rule.message,
		}))
	}

	public assert(validator: Validation.Validator, message: MessageOrString) {
		const messageParsed: Validation.Message = typeof message === 'string' ? { text: message } : message
		const newRules = [...this.rules, { validator, message: messageParsed }]
		const branch = new RuleBranch(this.conditions, newRules)
		const propertyDecorator: PropertyDecorator = (target: any, propertykey: string | symbol) => {
			addRuleToMetadata(target, propertykey, ...branch.getRules())
		}
		return Object.assign(propertyDecorator, branch)
	}

	assertPattern(pattern: string, message: MessageOrString) {
		return this.assert(rules.pattern(pattern), message)
	}

	assertMinLength(minLength: number, message: MessageOrString) {
		return this.assert(rules.minLength(minLength), message)
	}
}

const andOperation = (...conditions: Validation.Validator[]): Validation.Validator => ({
	operation: 'and',
	args: conditions.map(validator => ArgumentFactory.validator(validator)),
})
const orOperation = (...conditions: Validation.Validator[]): Validation.Validator => ({
	operation: 'or',
	args: conditions.map(validator => ArgumentFactory.validator(validator)),
})
const conditionalOperation = (condition: Validation.Validator, rule: Validation.Validator): Validation.Validator => ({
	operation: 'conditional',
	args: [ArgumentFactory.validator(condition), ArgumentFactory.validator(rule)],
})

const patternOperation = (pattern: string): Validation.Validator => ({
	operation: 'pattern',
	args: [ArgumentFactory.literal(pattern)],
})

const lengthRangeOperation = (min?: number, max?: number): Validation.Validator => ({
	operation: 'lengthRange',
	args: [ArgumentFactory.literal(min), ArgumentFactory.literal(max)],
})

const equalsOperation = (value: any): Validation.Validator => ({
	operation: 'equals',
	args: [ArgumentFactory.literal(value)],
})
const notOperation = (validator: Validation.Validator): Validation.Validator => ({
	operation: 'not',
	args: [ArgumentFactory.validator(validator)],
})

const emptyOperation = (): Validation.Validator => ({ operation: 'empty', args: [] })

export const InContextOperation = 'inContext' as const
const onOperation = (path: ContextPath, validator: Validation.Validator): Validation.Validator => ({
	operation: InContextOperation,
	args: [ArgumentFactory.path(path), ArgumentFactory.validator(validator)],
})

const everyOperation = (validator: Validation.Validator): Validation.Validator => ({
	operation: 'every',
	args: [ArgumentFactory.validator(validator)],
})

const anyOperation = (validator: Validation.Validator): Validation.Validator => ({
	operation: 'any',
	args: [ArgumentFactory.validator(validator)],
})

const filterOperation = (filter: Validation.Validator, validator: Validation.Validator): Validation.Validator => ({
	operation: 'filter',
	args: [ArgumentFactory.validator(filter), ArgumentFactory.validator(validator)],
})

export const rules = {
	and: andOperation,
	or: orOperation,
	conditional: conditionalOperation,
	pattern: patternOperation,
	lengthRange: lengthRangeOperation,
	minLength: (min: number) => lengthRangeOperation(min),
	maxLength: (max: number) => lengthRangeOperation(undefined, max),
	equals: equalsOperation,
	not: notOperation,
	['empty']: emptyOperation,
	notEmpty: () => notOperation(emptyOperation()),
	['null']: () => equalsOperation(null),
	notNull: () => notOperation(equalsOperation(null)),
	on: onOperation,
	filter: filterOperation,
	any: anyOperation,
	every: everyOperation,
}

export function when(...conditions: Validation.Validator[]) {
	return new RuleBranch(conditions, [])
}

export function assert(validator: Validation.Validator, message: MessageOrString) {
	return new RuleBranch([], []).assert(validator, message)
}

const requiredOrOptional = (required: boolean): PropertyDecorator => (target, propertyKey) =>
	updateMetadata({ key: RequiredMetaKey, target, propertyKey }, () => required, undefined)

export function optional(): PropertyDecorator {
	return requiredOrOptional(false)
}

export function required(message: MessageOrString): PropertyDecorator {
	return combine(requiredOrOptional(true), assert(rules.notEmpty(), message))
}

export const assertPattern = (pattern: string, message: MessageOrString) => fluent().assertPattern(pattern, message)
export const assertMinLength = (min: number, message: MessageOrString) => fluent().assertMinLength(min, message)

export const combine = (...decorators: PropertyDecorator[]): PropertyDecorator => (target, propertyKey) =>
	decorators.forEach(it => it(target, propertyKey))

export function parseDefinition(definitions: Record<string, EnumDefinition | { new (): any }>): Validation.Schema {
	return Object.entries(definitions)
		.filter((it): it is [string, { new (): any }] => !(it[1] instanceof EnumDefinition))
		.map(([name, definition]) => {
			const target = definition.prototype
			const fields = Object.keys(new definition())
			return tuple(
				name,
				fields
					.map(field => {
						const required: boolean | undefined = Reflect.getMetadata(RequiredMetaKey, target, field)
						const fieldRules: Validation.ValidationRule[] | undefined = Reflect.getMetadata(RuleMetaKey, target, field)
						if (fieldRules === undefined) {
							return tuple(field, [])
						}
						if (required === undefined) {
							throw new Error(`${name}::${field}: You have to specify whether the field is optional or required`)
						}
						const finalRules = !required
							? fieldRules.map(rule => ({ ...rule, validator: rules.conditional(rules.notEmpty(), rule.validator) }))
							: fieldRules
						return tuple(field, finalRules)
					})
					.reduce<Validation.EntityRules>((ruleSet, [field, rules]) => ({ ...ruleSet, [field]: rules }), {})
			)
		})
		.reduce<Validation.Schema>((acc, [name, defs]) => ({ ...acc, [name]: defs }), {})
}
