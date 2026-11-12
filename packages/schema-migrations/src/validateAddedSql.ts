import { Schema } from '@contember/schema'
import { validateSqlFragment, ValidationError } from '@contember/schema-utils'
import { deepEqual } from '@contember/utilities'

/**
 * Validates the raw SQL that going from `before` to `after` adds: new or changed view bodies, predicates of
 * new indexes and expressions of new or changed check constraints. Callers apply it only to SQL about to be executed, so SQL of executed migrations never blocks a deploy.
 */
export const validateAddedSql = (before: Schema, after: Schema): ValidationError[] => {
	const errors: ValidationError[] = []
	for (const entity of Object.values(after.model.entities)) {
		const previous = before.model.entities[entity.name]
		if (entity.view && entity.view.sql !== previous?.view?.sql) {
			const error = validateSqlFragment(entity.view.sql, 'statement')
			if (error) {
				errors.push({ code: 'MODEL_INVALID_VIEW', path: ['entities', entity.name], message: `View SQL ${error}.` })
			}
		}
		for (const index of entity.indexes) {
			if (index.where === undefined || previous?.indexes.some(it => deepEqual(it, index))) {
				continue
			}
			const error = validateSqlFragment(index.where, 'expression')
			if (error) {
				errors.push({ code: 'MODEL_INVALID_INDEX', path: ['entities', entity.name, 'indexes'], message: `Index predicate (where) ${error}.` })
			}
		}
		for (const check of entity.checks ?? []) {
			if (previous?.checks?.some(it => deepEqual(it, check))) {
				continue
			}
			const error = validateSqlFragment(check.expression, 'expression')
			if (error) {
				errors.push({
					code: 'MODEL_INVALID_CHECK',
					path: ['entities', entity.name, 'checks'],
					message: `Check constraint "${check.name}" expression ${error}.`,
				})
			}
		}
	}
	return errors
}
