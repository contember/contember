import { Input } from './schema/input'
import { Model } from './schema/model'
import { Acl } from './schema/acl'
import { Validation } from './schema/validation'
import { Value } from './schema/value'
import { Result } from './schema/result'
import { Settings } from './schema/settings'

export * from './ProjectRole'
export * from './schema/json'

type Schema = {
	readonly model: Model.Schema
	readonly acl: Acl.Schema
	readonly validation: Validation.Schema
	readonly settings: Settings.Schema
}

export type Writable<V> = {-readonly [K in keyof V]: V[K]}

export { Input, Model, Acl, Schema, Validation, Value, Result, Settings }
