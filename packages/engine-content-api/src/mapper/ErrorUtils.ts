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
import { acceptFieldVisitor, tryGetColumnName } from '@contember/schema-utils'
import { logger } from '@contember/logger'
import { DatabaseMetadata } from '@contember/database'


type UniqueConstraintResult = {
	entity: Model.Entity
	fields: string[]
}

const getEntityByTableName = (model: Model.Schema, tableName: string) => Object.values(model.entities).find(it => it.tableName === tableName)

const findUniqueConstraint = (model: Model.Schema, databaseMetadata: DatabaseMetadata, tableName: string, constraintName: string): UniqueConstraintResult | null => {
	const constraint = databaseMetadata.uniqueConstraints.filter({ tableName, constraintName }).first()
	if (!constraint) {
		return null
	}
	const entity = getEntityByTableName(model, constraint.tableName)
	if (!entity) {
		return null
	}
	const fieldsInConstraint: string[] = []
	for (const field of Object.values(entity.fields)) {
		const columnName = tryGetColumnName(model, entity, field.name)
		if (columnName && constraint.columnNames.includes(columnName)) {
			fieldsInConstraint.push(field.name)
		}
	}
	if (fieldsInConstraint.length === constraint.columnNames.length) {
		return { entity, fields: fieldsInConstraint }
	}
	return null
}

type RelationInfo = {
	owningEntity: Model.Entity
	owningRelation: Model.Relation
	targetEntity: Model.Entity
}

const findForeignConstraint = (model: Model.Schema, databaseMetadata: DatabaseMetadata, tableName: string, constraintName: string): RelationInfo | null => {
	const constraint = databaseMetadata.foreignKeys.filter({ fromTable: tableName, constraintName }).first()
	if (!constraint) {
		return null
	}
	const owningEntity = getEntityByTableName(model, constraint.fromTable)
	if (!owningEntity) {
		// todo m:n
		return null
	}

	const targetEntity = getEntityByTableName(model, constraint.toTable)
	if (!targetEntity) {
		return null
	}
	for (const field of Object.values(owningEntity.fields)) {
		const relation = acceptFieldVisitor<(Model.Relation & Model.JoiningColumnRelation) | null>(model, owningEntity, field, {
			visitColumn: () => null,
			visitOneHasOneInverse: () => null,
			visitManyHasManyInverse: () => null,
			visitManyHasManyOwning: () => null,
			visitOneHasMany: () => null,
			visitOneHasOneOwning: ({ relation }) => relation,
			visitManyHasOne: ({ relation }) => relation,
		})
		if (relation && relation.joiningColumn.columnName === constraint.fromColumn) {
			return {
				owningEntity,
				owningRelation: relation,
				targetEntity,
			}
		}
	}
	return null
}

export const convertError = (
	schema: Model.Schema,
	databaseMetadata: DatabaseMetadata,
	e: any,
): MutationResult => {

	if (e instanceof Database.NotNullViolationError) {
		return new MutationConstraintViolationError([], ConstraintType.notNull, e.originalMessage, [
			MutationResultHint.sqlError,
		])
	}
	if (e instanceof Database.ForeignKeyViolationError) {
		const relationInfo = e.constraint && e.table ? findForeignConstraint(schema, databaseMetadata, e.table, e.constraint) : null
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
		const constraint = e.constraint && e.table ? findUniqueConstraint(schema, databaseMetadata, e.table, e.constraint) : null
		const violationDetail: string = 'detail' in e.previous ? e.previous.detail : ''
		const matchResult = violationDetail.match(/^Key \(.+\)=\((.+)\) already exists\.$/)
		const values = matchResult?.[1]
		const message = constraint
			? `${values ? `Value (${values})` : 'Unknown value'}` +
			  ` already exists in unique columns (${constraint.fields.join(', ')}) on entity ${constraint.entity.name}`
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
	if (e instanceof Database.QueryError || e instanceof Database.CannotCommitError) {
		logger.error(e, { loc: 'convertError' })
		return new MutationSqlError([], e.originalMessage, [MutationResultHint.sqlError])
	}
	throw e
}

export const tryMutation = async (schema: Model.Schema, databaseMetadata: DatabaseMetadata, cb: () => Promise<MutationResultList>): Promise<MutationResultList> => {
	try {
		return await cb()
	} catch (e) {
		return [convertError(schema, databaseMetadata, e)]
	}
}
