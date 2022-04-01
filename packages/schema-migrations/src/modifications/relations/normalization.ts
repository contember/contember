import { Model } from '@contember/schema'

type SomePartial<E, K extends keyof E> = Omit<E, K> & Partial<Pick<E, K>>

export type PartialManyHasManyRelation =
	& Omit<Model.ManyHasManyOwningRelation, 'joiningTable'>
	& {
		joiningTable: SomePartial<Model.JoiningTable, 'eventLog'>
	}

export const normalizeManyHasManyRelation = (rel: PartialManyHasManyRelation): Model.ManyHasManyOwningRelation => {
	return {
		...rel,
		joiningTable: {
			eventLog: {
				enabled: true,
			},
			...rel.joiningTable,
		},
	}
}
