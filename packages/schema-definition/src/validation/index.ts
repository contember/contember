import { tuple } from '../utils'
import { SchemaDefinition } from '../model'
import 'reflect-metadata'
import { Validation } from '@contember/schema'

type ValidationRuleWithMeta = Validation.ValidationRule & { noOptional?: true }
type MessageOrString = Validation.Message | string

export type ContextPath = Validation.ContextPath | string | undefined
export const parsePath = (path: ContextPath): string[] => {
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

const RequiredMetaKey = Symbol('Required')

export function fluent() {
	return new RuleBranch([], [])
}

class RuleBranch {
	constructor(
		private conditions: Validation.Validator[],
		private branchRules: Validation.ValidationRule[],
		private _noOptional?: true,
	) {}

	public buildRules = (): ValidationRuleWithMeta[] => {
		if (this.conditions.length === 0) {
			return this.branchRules.map(it => ({ ...it, noOptional: this._noOptional }))
		}
		return this.branchRules.map(rule => ({
			validator: rules.conditional(
				this.conditions.length === 1 ? this.conditions[0] : rules.and(...this.conditions),
				rule.validator,
			),
			message: rule.message,
			noOptional: this._noOptional,
		}))
	}

	public assert = (validator: Validation.Validator, message: MessageOrString): RuleBranch & PropertyDecorator => {
		const messageParsed: Validation.Message = typeof message === 'string' ? { text: message } : message
		const newRules = [...this.branchRules, { validator, message: messageParsed }]
		const branch = new RuleBranch(this.conditions, newRules, this._noOptional)
		const propertyDecorator: PropertyDecorator = (target: any, propertykey: string | symbol) => {
			addRuleToMetadata(target, propertykey, ...branch.buildRules())
		}
		return Object.assign(propertyDecorator, branch)
	}

	assertPattern = (pattern: RegExp, message: MessageOrString) => {
		return this.assert(rules.pattern(pattern), message)
	}

	assertMinLength = (minLength: number, message: MessageOrString) => {
		return this.assert(rules.minLength(minLength), message)
	}

	public noOptional = (): RuleBranch & PropertyDecorator => {
		const branch = new RuleBranch(this.conditions, this.branchRules, true)
		const propertyDecorator: PropertyDecorator = (target: any, propertykey: string | symbol) => {
			addRuleToMetadata(target, propertykey, ...branch.buildRules())
		}
		return Object.assign(propertyDecorator, branch)
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
	and: andOperation,
	or: orOperation,
	conditional: conditionalOperation,
	pattern: patternOperation,
	lengthRange: lengthRangeOperation,
	minLength: (min: number) => lengthRangeOperation(min, null),
	maxLength: (max: number) => lengthRangeOperation(null, max),
	range: rangeOperation,
	min: (min: number) => rangeOperation(min, null),
	max: (max: number) => rangeOperation(null, max),
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
	defined: definedOperation,
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
	return combine(requiredOrOptional(true), assert(rules.defined(), message))
}

export function requiredWhen(condition: Validation.Validator, message: MessageOrString) {
	return combine(
		requiredOrOptional(false),
		when(condition)
			.assert(rules.defined(), message)
			.noOptional(),
	)
}

export const assertPattern = (pattern: RegExp, message: MessageOrString) => fluent().assertPattern(pattern, message)
export const assertMinLength = (min: number, message: MessageOrString) => fluent().assertMinLength(min, message)

export const combine = (...decorators: PropertyDecorator[]): PropertyDecorator => (target, propertyKey) =>
	decorators.forEach(it => it(target, propertyKey))

export function parseDefinition(
	definitions: Record<string, SchemaDefinition.EnumDefinition | { new (): any }>,
): Validation.Schema {
	return Object.entries(definitions)
		.filter((it): it is [string, { new (): any }] => !(it[1] instanceof SchemaDefinition.EnumDefinition))
		.map(([name, definition]) => {
			const target = definition.prototype
			const defInstance = new definition()
			const fields = Object.keys(defInstance)
			return tuple(
				name,
				fields
					.map(field => {
						let required: boolean | undefined = Reflect.getMetadata(RequiredMetaKey, target, field)
						const fieldRules: ValidationRuleWithMeta[] | undefined = Reflect.getMetadata(RuleMetaKey, target, field)
						if (fieldRules === undefined) {
							return tuple(field, [])
						}
						const isNotNull = 'nullable' in defInstance[field] ? !defInstance[field].nullable : undefined
						if (required === undefined) {
							required = isNotNull
						}
						if (isNotNull && !required) {
							throw new Error(`${name}::${field}: Cannot make not-null field optional`)
						}
						if (required === undefined) {
							throw new Error(`${name}::${field}: You have to specify whether the field is optional or required`)
						}
						const finalRules = !required
							? fieldRules.map(({ message, validator, noOptional }) =>
									noOptional
										? { message, validator }
										: {
												message,
												validator: rules.conditional(rules.defined(), validator),
										  },
							  )
							: fieldRules
						return tuple(field, finalRules)
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
