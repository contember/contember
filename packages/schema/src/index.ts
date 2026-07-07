import { Acl, Actions, Model, Retention, Settings, Validation } from './schema/index.js'

export * from './ProjectRole.js'

export type Schema = {
	readonly model: Model.Schema
	readonly acl: Acl.Schema
	readonly validation: Validation.Schema
	readonly actions: Actions.Schema
	readonly retention: Retention.Schema
	readonly settings: Settings.Schema
}

export type Writable<V> = { -readonly [K in keyof V]: V[K] }

export * from './schema/index.js'
