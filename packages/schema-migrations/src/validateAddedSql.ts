import { Schema } from '@contember/schema'
import { isColumn, isValidColumnType, validateSqlFragment, ValidationError } from '@contember/schema-utils'
import { deepEqual } from '@contember/utilities'
import { validateLiteralSql } from './utils/literalSql.js'

/**
 * Validates the raw SQL that going from `before` to `after` adds: new or changed view bodies, check expressions, column types and raw SQL literals in column defaults, and predicates of new indexes.
 * Callers apply it only to SQL about to be executed, so executed migrations never block a deploy, and never filter it by `skippedErrors`.
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
		for (const field of Object.values(entity.fields)) {
			if (!isColumn(field)) {
				continue
			}
			const previousField = previous?.fields[field.name]
			const previousColumn = previousField && isColumn(previousField) ? previousField : undefined
			if (!previousColumn || !deepEqual(previousColumn.default, field.default)) {
				const error = validateLiteralSql(field.default)
				if (error) {
					errors.push({
						code: 'MODEL_INVALID_COLUMN_DEFINITION',
						path: ['entities', entity.name, 'fields', field.name],
						message: `Column default ${error}.`,
					})
				}
			}
			if (previousColumn?.columnType !== field.columnType && !isValidColumnType(field.columnType)) {
				errors.push({
					code: 'MODEL_INVALID_COLUMN_TYPE',
					path: ['entities', entity.name, 'fields', field.name],
					message: `Column type ${JSON.stringify(field.columnType)} is not a valid column type.`,
				})
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
