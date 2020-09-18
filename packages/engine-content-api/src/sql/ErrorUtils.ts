import {
	ConstraintType,
	InputErrorKind,
	MutationConstraintViolationError,
	MutationInputError,
	MutationResult,
	MutationResultHint,
	MutationResultList,
	MutationSqlError,
} from './Result'
import * as Database from '@contember/database'
import { UniqueWhereError } from '../inputProcessing'
import { Model } from '@contember/schema'
import { ResolvedColumnValue } from './ColumnValue'
import { isOwningRelation, NamingHelper } from '@contember/schema-utils'
import RelationType = Model.RelationType

export class EnrichedError {
	constructor(
		public readonly entity: Model.Entity,
		public readonly values: ResolvedColumnValue[] | null,
		public readonly originalError: any,
	) {}
}

const findConstraint = (entity: Model.Entity, constraintName: string): Model.UniqueConstraint | null => {
	for (const constraint of Object.values(entity.unique)) {
		if (constraint.name === constraintName) {
			return constraint
		}
	}
	for (const field of Object.values(entity.fields)) {
		if (
			field.type === RelationType.OneHasOne &&
			isOwningRelation(field) &&
			NamingHelper.createUniqueConstraintName(entity.name, [field.name]) === constraintName
		) {
			return { name: constraintName, fields: [field.name] }
		}
	}
	return null
}

export const convertError = (e: any): MutationResult => {
	let entity: Model.Entity | null = null
	let values: ResolvedColumnValue[] | null = null
	if (e instanceof EnrichedError) {
		entity = e.entity
		values = e.values
		e = e.originalError
	}
	if (e instanceof Database.NotNullViolationError) {
		return new MutationConstraintViolationError([], ConstraintType.notNull, e.originalMessage, [
			MutationResultHint.sqlError,
		])
	}
	if (e instanceof Database.ForeignKeyViolationError) {
		return new MutationConstraintViolationError([], ConstraintType.foreignKey, e.originalMessage, [
			MutationResultHint.sqlError,
		])
	}
	if (e instanceof Database.UniqueViolationError) {
		const constraint = entity && e.constraint ? findConstraint(entity, e.constraint) : null
		const valuesInConstraint = constraint
			? constraint.fields.map(it => values?.find(v => v.fieldName === it)?.resolvedValue)
			: []
		const message = constraint
			? `Value (${valuesInConstraint.map(it => JSON.stringify(it)).join(', ')})` +
			  ` of unique constraint (${constraint.fields.join(', ')}) already exists`
			: e.originalMessage

		const paths = constraint ? constraint.fields.map(it => [{ field: it }]) : []
		return new MutationConstraintViolationError(paths, ConstraintType.uniqueKey, message, [MutationResultHint.sqlError])
	}
	if (e instanceof UniqueWhereError) {
		return new MutationInputError([], InputErrorKind.nonUniqueWhere, e.message)
	}
	if (e instanceof Database.InvalidDataError) {
		return new MutationInputError([], InputErrorKind.invalidData, e.originalMessage, [MutationResultHint.sqlError])
	}
	if (e instanceof Database.SerializationFailureError) {
		throw e
	}
	if (e instanceof Database.TransactionAbortedError) {
		return new MutationSqlError([], e.originalMessage, [MutationResultHint.subSequentSqlError])
	}
	if (e instanceof Database.ConnectionError) {
		// eslint-disable-next-line no-console
		console.error(e)
		return new MutationSqlError([], e.originalMessage, [MutationResultHint.sqlError])
	}
	throw e
}

export const tryMutation = async (cb: () => Promise<MutationResultList>): Promise<MutationResultList> => {
	try {
		return await cb()
	} catch (e) {
		return [convertError(e)]
	}
}
