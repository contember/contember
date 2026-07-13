import { Input, Model, Writable } from '@contember/schema'
import { replaceWhere } from '../mapper/select/optimizer/WhereReplacer.js'

export const replaceEvaluatedPredicate = (
	where: Input.OptionalWhere,
	evaluatedPredicate: Input.OptionalWhere,
	relation: Model.AnyRelation,
	replacement: Input.OptionalWhere,
): Input.OptionalWhere => {
	const { not, and, or, ...fields } = where
	const result: Writable<Input.OptionalWhere> = { ...fields }
	if (not) {
		result.not = replaceEvaluatedPredicate(not, evaluatedPredicate, relation, replacement)
	}
	if (and) {
		result.and = and.map(item => isOptionalWhere(item) ? replaceEvaluatedPredicate(item, evaluatedPredicate, relation, replacement) : item)
	}
	if (or) {
		result.or = or.map(item => isOptionalWhere(item) ? replaceEvaluatedPredicate(item, evaluatedPredicate, relation, replacement) : item)
	}
	const relationWhere = result[relation.name]
	if (isOptionalWhere(relationWhere)) {
		result[relation.name] = replaceWhere(relationWhere, evaluatedPredicate, replacement)
	}
	return result
}

const isOptionalWhere = (value: unknown): value is Input.OptionalWhere =>
	value !== null && value !== undefined && typeof value === 'object' && !Array.isArray(value)
