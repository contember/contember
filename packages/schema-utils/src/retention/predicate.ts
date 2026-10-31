import { Input, Model } from '@contember/schema'
import { isColumn } from '../model/index.js'

const intervalPart = /^(\d+)[ \t]*(second|minute|hour|day|week|month|year)s?$/i

// Keeps every part far below the 32-bit interval fields; Postgres 14 wraps an overflow silently into a negative interval.
const maxIntervalCount = 1_000_000
// `now() - interval` fails with "timestamp out of range" for spans of a few thousand years.
const maxIntervalDays = 1000 * 366
const approximateDays: Record<string, number> = { second: 1 / 86400, minute: 1 / 1440, hour: 1 / 24, day: 1, week: 7, month: 31, year: 366 }

/**
 * A retention interval is one or more `<count> <unit>` parts, e.g. `30 days` or `1 day 12 hours`, each unit at most once,
 * positive in total and at most about 1000 years.
 * Narrower than Postgres on purpose: a bare number (`30` = 30 seconds) or a zero, negative or
 * overflowing interval would move the cutoff to now or into the future and match every row.
 */
export const isValidRetentionInterval = (interval: string): boolean => {
	const parts = interval.replace(/^[ \t]+|[ \t]+$/g, '').split(/[ \t]+(?=\d)/)
	const units = new Set<string>()
	let positive = false
	let days = 0
	for (const part of parts) {
		const match = intervalPart.exec(part)
		if (!match) {
			return false
		}
		const count = Number(match[1])
		const unit = match[2].toLowerCase()
		if (count > maxIntervalCount || units.has(unit)) {
			return false
		}
		units.add(unit)
		positive ||= count > 0
		days += count * approximateDays[unit]
	}
	return positive && days <= maxIntervalDays
}

/**
 * Whether a where provably matches every row. Folds the where the way the content API's
 * ConditionOptimizer and WhereOptimizer do (`always`, `never`, `in: []`, `notIn: []`, `not`, empty
 * `and` / `or`, empty relation filters) into true, false or unknown, and reports only true. It errs
 * towards true; the engine checks the compiled where again before deleting.
 */
export const isUnboundedWhere = (model: Model.Schema, entity: Model.Entity, where: Input.OptionalWhere): boolean =>
	foldWhere(model, entity, where) === true

type Folded = boolean | undefined

const foldAnd = (operands: readonly Folded[]): Folded => operands.includes(false) ? false : operands.every(it => it === true) ? true : undefined

const foldOr = (operands: readonly Folded[]): Folded =>
	operands.length === 0 || operands.includes(true) ? true : operands.every(it => it === false) ? false : undefined

// The optimizer compiles a negated empty filter to no condition at all, so `not` of a true operand
// may still match every row; treating it as true can only reject more policies, never fewer.
const foldNot = (operand: Folded): Folded => operand === undefined ? undefined : true

const isRecord = (value: unknown): value is { readonly [key: string]: unknown } =>
	typeof value === 'object' && value !== null && !Array.isArray(value)

const foldWhere = (model: Model.Schema, entity: Model.Entity, where: unknown): Folded => {
	if (!isRecord(where)) {
		return undefined
	}
	return foldAnd(
		Object.entries(where).map(([key, value]): Folded => {
			if (value === undefined || value === null) {
				return true
			}
			if (key === 'and' || key === 'or') {
				if (!Array.isArray(value)) {
					return undefined
				}
				const operands = value.map(it => foldWhere(model, entity, it))
				return key === 'and' ? foldAnd(operands) : foldOr(operands)
			}
			if (key === 'not') {
				return foldNot(foldWhere(model, entity, value))
			}
			const field = entity.fields[key]
			if (field === undefined) {
				return undefined
			}
			if (isColumn(field)) {
				return foldCondition(value)
			}
			const target = model.entities[field.target]
			if (target === undefined) {
				return undefined
			}
			const nested = foldWhere(model, target, value)
			// A to-many filter compiles to EXISTS: a true nested filter still requires a related row.
			const isToMany = field.type === Model.RelationType.OneHasMany || field.type === Model.RelationType.ManyHasMany
			return isToMany && nested === true ? undefined : nested
		}),
	)
}

const foldCondition = (condition: unknown): Folded => {
	if (!isRecord(condition)) {
		return undefined
	}
	// ConditionBuilder emits false for `never` whatever its value.
	if (condition.never !== undefined && condition.never !== null) {
		return false
	}
	return foldAnd(
		Object.entries(condition).map(([key, value]): Folded => {
			if (value === undefined || value === null) {
				return true
			}
			if (key === 'always') {
				return true
			}
			if (key === 'and' || key === 'or') {
				if (!Array.isArray(value)) {
					return undefined
				}
				const operands = value.map(foldCondition)
				return key === 'and' ? foldAnd(operands) : foldOr(operands)
			}
			if (key === 'not') {
				return foldNot(foldCondition(value))
			}
			if (Array.isArray(value) && value.length === 0 && (key === 'in' || key === 'notIn')) {
				return key === 'notIn'
			}
			return undefined
		}),
	)
}
