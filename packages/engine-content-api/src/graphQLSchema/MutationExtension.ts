import { Model } from '@contember/schema'
import { ImplementationException } from '../exception'

export class MutationMeta {
	constructor(public readonly operation: MutationOperation, public readonly entity: Model.Entity) {}
}

export const ExtensionKey = 'MutationMeta'

export const readMutationMeta = (data: Record<string, unknown> | undefined | null): MutationMeta => {
	if (!data) {
		throw new ImplementationException()
	}
	const meta = data[ExtensionKey]
	if (!(meta instanceof MutationMeta)) {
		throw new ImplementationException()
	}
	return meta
}

export const enum MutationOperation {
	create = 'create',
	update = 'update',
	delete = 'delete',
}
