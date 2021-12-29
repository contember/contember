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
import { isOwningRelation, isRelation, NamingHelper } from '@contember/schema-utils'
import RelationType = Model.RelationType


const findUniqueConstraint = (schema: Model.Schema, constraintName: string): [Model.Entity, Model.UniqueConstraint] | [null, null] => {
	for (const entity of Object.values(schema.entities)) {
		for (const constraint of Object.values(entity.unique)) {
			if (constraint.name === constraintName) {
				return [entity, constraint]
			}
		}
	}
	for (const entity of Object.values(schema.entities)) {
		for (const field of Object.values(entity.fields)) {
			if (
				field.type === RelationType.OneHasOne &&
				isOwningRelation(field) &&
				NamingHelper.createUniqueConstraintName(entity.name, [field.name]) === constraintName
			) {
				return [entity, { name: constraintName, fields: [field.name] }]
			}
		}
	}
	return [null, null]
}

type RelationInfo = {
	owningEntity: Model.Entity
	owningRelation: Model.Relation
	targetEntity: Model.Entity
}

const findForeignConstraint = (schema: Model.Schema, constraintName: string): RelationInfo | null => {
	for (const owningEntity of Object.values(schema.entities)) {
		for (const field of Object.values(owningEntity.fields)) {
			if (!isRelation(field) || !isOwningRelation(field) || !('joiningColumn' in field)) {
				continue
			}
			const targetEntity = schema.entities[field.target]
			const fkName = NamingHelper.createForeignKeyName(
				owningEntity.tableName,
				field.joiningColumn.columnName,
				targetEntity.tableName,
				targetEntity.primaryColumn,
			)
			if (fkName === constraintName) {
				return { owningEntity, targetEntity, owningRelation: field }
			}
		}
	}
	return null
}

export const convertError = (schema: Model.Schema, e: any): MutationResult => {

	if (e instanceof Database.NotNullViolationError) {
		return new MutationConstraintViolationError([], ConstraintType.notNull, e.originalMessage, [
			MutationResultHint.sqlError,
		])
	}
	if (e instanceof Database.ForeignKeyViolationError) {
		const relationInfo = e.constraint ? findForeignConstraint(schema, e.constraint) : null
		const violationDetail: string = 'detail' in e.previous ? e.previous.detail : ''
		const matchResult = violationDetail.match(/^Key \(.+\)=\((.+)\) is still referenced from table/)
		const message = relationInfo
			? `Cannot delete ${matchResult ? `row ${matchResult[1]}` : 'unknown row'}`
				+ ` of entity ${relationInfo.targetEntity.name},`
				+ ` because it is still referenced from ${relationInfo.owningEntity.name}::${relationInfo.owningRelation.name}.`
				+ ' This is possibly caused by ACL denial or by missing "on delete cascade"'
			: e.originalMessage
		return new MutationConstraintViolationError([], ConstraintType.foreignKey, message, [MutationResultHint.sqlError])
	}
	if (e instanceof Database.UniqueViolationError) {
		const [entity, constraint] = e.constraint ? findUniqueConstraint(schema, e.constraint) : [null, null]
		const violationDetail: string = 'detail' in e.previous ? e.previous.detail : ''
		const matchResult = violationDetail.match(/^Key \(.+\)=\((.+)\) already exists\.$/)
		const values = matchResult?.[1]
		const message = constraint && entity
			? `${values ? `Value (${values})` : 'Unknown value'}` +
			  ` already exists in unique columns (${constraint.fields.join(', ')}) on entity ${entity.name}`
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
	if (e instanceof Database.QueryError) {
		// eslint-disable-next-line no-console
		console.error(e)
		return new MutationSqlError([], e.originalMessage, [MutationResultHint.sqlError])
	}
	throw e
}

export const tryMutation = async (schema: Model.Schema, cb: () => Promise<MutationResultList>): Promise<MutationResultList> => {
	try {
		return await cb()
	} catch (e) {
		return [convertError(schema, e)]
	}
}
