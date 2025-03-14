import { Model } from '@contember/schema'

type SomePartial<E, K extends keyof E> = Omit<E, K> & Partial<Pick<E, K>>

export type PossibleEntityShapeInMigrations =
	& Omit<Model.Entity, 'eventLog' | 'indexes' | 'unique'>
	& {
		eventLog?: Model.Entity['eventLog']
		indexes?: (readonly  Model.Index[]) | Readonly<Record<string, Model.Index>>
		unique: (readonly  (Model.UniqueConstraint | Model.UniqueIndex)[]) | Readonly<Record<string, Model.UniqueConstraint>>
	}
