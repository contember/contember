import { Input, Model } from '@contember/schema'
import { isColumn } from '../model/index.js'

const intervalPart = /^(\d+)\s*(second|minute|hour|day|week|month|year)s?$/i

/**
 * A retention interval is one or more `<positive count> <unit>` parts, e.g. `30 days` or `1 day 12 hours`.
 * Narrower than Postgres on purpose: a bare number (`30` = 30 seconds) or a zero or negative
 * interval would move the cutoff to now or into the future and match every row.
 */
export const isValidRetentionInterval = (interval: string): boolean => {
	const parts = interval.trim().split(/\s+(?=\d)/)
	let positive = false
	for (const part of parts) {
		const match = intervalPart.exec(part)
		if (!match) {
			return false
		}
		positive ||= Number(match[1]) > 0
	}
	return positive
}

/**
 * Whether a where trivially matches every row (`{}`, `{ and: [] }`, `{ field: {} }`, `{ field: { always: true } }`, …).
 * Conservative towards rejection: an empty `or` and an empty nested relation where count as unbounded.
 */
export const isUnboundedWhere = (model: Model.Schema, entity: Model.Entity, where: Input.Where): boolean =>
	isUnboundedWhereValue(model, entity, where)

const isRecord = (value: unknown): value is { readonly [key: string]: unknown } =>
	typeof value === 'object' && value !== null && !Array.isArray(value)

const isUnboundedWhereValue = (model: Model.Schema, entity: Model.Entity, where: unknown): boolean => {
	if (!isRecord(where)) {
		return false
	}
	return Object.entries(where).every(([key, value]) => {
		if (value === undefined || value === null) {
			return true
		}
		if (key === 'and') {
			return Array.isArray(value) && value.every(it => isUnboundedWhereValue(model, entity, it))
		}
		if (key === 'or') {
			return Array.isArray(value) && (value.length === 0 || value.some(it => isUnboundedWhereValue(model, entity, it)))
		}
		if (key === 'not') {
			return false
		}
		const field = entity.fields[key]
		if (field === undefined) {
			return false
		}
		if (isColumn(field)) {
			return isUnboundedCondition(value)
		}
		const target = model.entities[field.target]
		return target !== undefined && isUnboundedWhereValue(model, target, value)
	})
}

const isUnboundedCondition = (condition: unknown): boolean => {
	if (!isRecord(condition)) {
		return false
	}
	return Object.entries(condition).every(([key, value]) => {
		if (value === undefined || value === null) {
			return true
		}
		if (key === 'always') {
			return value === true
		}
		if (key === 'and') {
			return Array.isArray(value) && value.every(isUnboundedCondition)
		}
		if (key === 'or') {
			return Array.isArray(value) && (value.length === 0 || value.some(isUnboundedCondition))
		}
		return false
	})
}
