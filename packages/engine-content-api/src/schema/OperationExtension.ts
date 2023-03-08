import { Model } from '@contember/schema'
import { ImplementationException } from '../exception'

export class OperationInfo<T extends string> {
	constructor(public readonly operation: T, public readonly entity: Model.Entity) {}
}

export const ReadOperationInfoExtensionKey = 'ReadOperation'
export const MutationOperationInfoExtensionKey = 'MutationOperation'

const getOperationInfo = <T extends string>() => (data: Record<string, unknown> | undefined | null): OperationInfo<T> => {
	if (!data) {
		throw new ImplementationException()
	}
	const info = data[ReadOperationInfoExtensionKey]
	if (!(info instanceof OperationInfo)) {
		throw new ImplementationException('OperationMeta not found')
	}
	return info
}


export const getReadOperationInfo = getOperationInfo<ReadOperation>()
export const getMutationOperationInfo = getOperationInfo<MutationOperation>()

export type ReadOperation =
	| 'list'
	| 'get'
	| 'paginate'


export type MutationOperation =
	| 'create'
	| 'update'
	| 'upsert'
	| 'delete'
	// | 'multiCreate'
	// | 'multiUpdate'
	// | 'multiUpsert'
	// | 'multiDelete'
