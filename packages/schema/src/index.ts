import { Acl } from './schema/acl'
import { Actions } from './schema/actions'
import { ActionsPayload } from './schema/actionsPayload'
import { Input } from './schema/input'
import { Model } from './schema/model'
import { Result } from './schema/result'
import { Validation } from './schema/validation'
import { Value } from './schema/value'
import { Settings } from './schema/settings'

export * from './ProjectRole'
export * from './schema/json'

type Schema = {
	readonly model: Model.Schema
	readonly acl: Acl.Schema
	readonly validation: Validation.Schema
	readonly actions: Actions.Schema
	readonly settings: Settings.Schema
}

export type Writable<V> = {-readonly [K in keyof V]: V[K]}

export { Input, Model, Acl, ActionsPayload, Schema, Validation, Value, Result, Actions, Settings }
