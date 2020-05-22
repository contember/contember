import {
	ConstraintType,
	InputErrorKind,
	MutationConstraintViolationError,
	MutationInputError,
	MutationResult,
	MutationResultList,
} from './Result'
import * as Database from '@contember/database'
import { UniqueWhereError } from '../inputProcessing'

export const convertError = (e: any): null | MutationResult => {
	if (e instanceof Database.NotNullViolationError) {
		return new MutationConstraintViolationError([], ConstraintType.notNull)
	}
	if (e instanceof Database.ForeignKeyViolationError) {
		return new MutationConstraintViolationError([], ConstraintType.foreignKey)
	}
	if (e instanceof Database.UniqueViolationError) {
		return new MutationConstraintViolationError([], ConstraintType.uniqueKey)
	}
	if (e instanceof UniqueWhereError) {
		return new MutationInputError([], InputErrorKind.nonUniqueWhere, e.message)
	}
	return null
}

export const tryMutation = async (cb: () => Promise<MutationResultList>): Promise<MutationResultList> => {
	try {
		return await cb()
	} catch (e) {
		const result = convertError(e)
		if (!result) {
			throw e
		}
		return [result]
	}
}
