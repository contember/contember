import { Model } from '@contember/schema'

type SomePartial<E, K extends keyof E> = Omit<E, K> & Partial<Pick<E, K>>

export type PartialEntity = SomePartial<Model.Entity, 'eventLog' | 'indexes' | 'migrations'>
