import { Acl, Actions, Model, Settings, Validation } from './schema'

export * from './ProjectRole'

export type Schema = {
	readonly model: Model.Schema
	readonly acl: Acl.Schema
	readonly validation: Validation.Schema
	readonly actions: Actions.Schema
	readonly settings: Settings.Schema
}

export type Writable<V> = {-readonly [K in keyof V]: V[K]}

export * from './schema'
