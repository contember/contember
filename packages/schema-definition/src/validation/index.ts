import { tuple } from '../utils/index.js'
import { SchemaDefinition } from '../model/index.js'
import 'reflect-metadata'
import { Validation } from '@contember/schema'
import { filterEntityDefinition } from '../utils/index.js'

type MessageOrString = Validation.Message | string

export type ContextPath = Validation.ContextPath | string | undefined
export const parsePath = (path: ContextPath): readonly string[] => {
	if (!path) {
		return []
	}
	if (typeof path === 'string') {
		return path.split('.')
	}
	return path
}

const ArgumentFactory = {
	validator: (validator: Validation.Validator): Validation.ValidatorArgument => ({
		type: Validation.ArgumentType.validator,
		validator,
	}),
	path: (path?: ContextPath): Validation.PathArgument => ({
		type: Validation.ArgumentType.path,
		path: parsePath(path),
	}),
	literal: <V = any>(value: V): Validation.LiteralArgument<V> => ({ type: Validation.ArgumentType.literal, value }),
}

const RuleMetaKey = Symbol('Rule')

function updateMetadata<T>(
	{ key, target, propertyKey }: { key: symbol; target: any; propertyKey: string | symbol },
	generator: (previous: T) => T,
	initialValue: T,
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

export function fluent() {
	return new RuleBranch([], [])
}

class RuleBranch {
	constructor(private conditions: Validation.Validator[], private branchRules: Validation.ValidationRule[]) {}

	public buildRules = (): Validation.ValidationRule[] => {
		if (this.conditions.length === 0) {
			return this.branchRules
		}
		return this.branchRules.map(rule => ({
			validator: rules.conditional(
				this.conditions.length === 1 ? this.conditions[0] : rules.and(...this.conditions),
				rule.validator,
			),
			message: rule.message,
		}))
	}

	public assert = (validator: Validation.Validator, message: MessageOrString): RuleBranch & PropertyDecorator => {
		const messageParsed: Validation.Message = typeof message === 'string' ? { text: message } : message
		const newRules = [...this.branchRules, { validator, message: messageParsed }]
		const branch = new RuleBranch(this.conditions, newRules)
		const propertyDecorator: PropertyDecorator = (target: any, propertykey: string | symbol) => {
			addRuleToMetadata(target, propertykey, ...branch.buildRules())
		}
		return Object.assign(propertyDecorator, branch)
	}

	assertPattern = (pattern: RegExp, message: MessageOrString) => this.assert(rules.pattern(pattern), message)
	assertEquals = (value: any, message: MessageOrString) => this.assert(rules.equals(value), message)
	assertDefined = (message: MessageOrString) => this.assert(rules.defined(), message)
	assertNotEmpty = (message: MessageOrString) => this.assert(rules.notEmpty(), message)
	assertMinLength = (minLength: number, message: MessageOrString) => this.assert(rules.minLength(minLength), message)
	assertMaxLength = (minLength: number, message: MessageOrString) => this.assert(rules.maxLength(minLength), message)
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

const patternOperation = (pattern: RegExp): Validation.Validator => ({
	operation: 'pattern',
	args: [ArgumentFactory.literal([pattern.source, pattern.flags])],
})

const lengthRangeOperation = (min: number | null, max: number | null): Validation.Validator => ({
	operation: 'lengthRange',
	args: [ArgumentFactory.literal(min), ArgumentFactory.literal(max)],
})

const rangeOperation = (min: number | null, max: number | null): Validation.Validator => ({
	operation: 'range',
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
const definedOperation = (): Validation.Validator => ({ operation: 'defined', args: [] })

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
	equals: equalsOperation,
	in: (...value: any[]) => orOperation(...value.map(it => equalsOperation(it))),
	pattern: patternOperation,

	lengthRange: lengthRangeOperation,
	minLength: (min: number) => lengthRangeOperation(min, null),
	maxLength: (max: number) => lengthRangeOperation(null, max),

	range: rangeOperation,
	min: (min: number) => rangeOperation(min, null),
	max: (max: number) => rangeOperation(null, max),

	defined: definedOperation,
	['empty']: emptyOperation,
	notEmpty: () => notOperation(emptyOperation()),
	['null']: () => equalsOperation(null),
	notNull: () => notOperation(equalsOperation(null)),

	and: andOperation,
	or: orOperation,
	not: notOperation,

	conditional: conditionalOperation,
	on: onOperation,

	filter: filterOperation,
	any: anyOperation,
	every: everyOperation,
}

export function when(...conditions: Validation.Validator[]) {
	return new RuleBranch(conditions, [])
}

export const assert = (validator: Validation.Validator, message: MessageOrString) => fluent().assert(validator, message)
/** alias for assertDefined */
export const required = (message: MessageOrString) => fluent().assertDefined(message)
export const assertDefined = (message: MessageOrString) => fluent().assertDefined(message)
export const assertNotEmpty = (message: MessageOrString) => fluent().assertNotEmpty(message)
export const assertPattern = (pattern: RegExp, message: MessageOrString) => fluent().assertPattern(pattern, message)
export const assertMinLength = (min: number, message: MessageOrString) => fluent().assertMinLength(min, message)
export const assertMaxLength = (min: number, message: MessageOrString) => fluent().assertMaxLength(min, message)

export const combine =
	(...decorators: PropertyDecorator[]): PropertyDecorator =>
		(target, propertyKey) =>
			decorators.forEach(it => it(target, propertyKey))

export function parseDefinition(
	definitions: Record<string, any>,
): Validation.Schema {
	return filterEntityDefinition(definitions)
		.map(([name, definition]) => {
			const target = definition.prototype
			const defInstance = new definition()
			const fields = Object.keys(defInstance)
			return tuple(
				name,
				fields
					.map(field => {
						const fieldRules: Validation.ValidationRule[] | undefined = Reflect.getMetadata(RuleMetaKey, target, field)
						if (fieldRules === undefined) {
							return tuple(field, [])
						}
						return tuple(field, fieldRules)
					})
					.reduce<Validation.EntityRules>(
						(ruleSet, [field, rules]) => (rules.length > 0 ? { ...ruleSet, [field]: rules } : ruleSet),
						{},
					),
			)
		})
		.reduce<Validation.Schema>(
			(acc, [name, defs]) => (Object.keys(defs).length > 0 ? { ...acc, [name]: defs } : acc),
			{},
		)
}
