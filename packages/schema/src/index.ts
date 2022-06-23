import Input from './schema/input.js'
import Model from './schema/model.js'
import Acl from './schema/acl.js'
import Validation from './schema/validation.js'
import Value from './schema/value.js'
import Result from './schema/result.js'

export * from './ProjectRole.js'
export * from './schema/json.js'

type Schema = {
	readonly model: Model.Schema
	readonly acl: Acl.Schema
	readonly validation: Validation.Schema
}

export type Writable<V> = {-readonly [K in keyof V]: V[K]}

export { Input, Model, Acl, Schema, Validation, Value, Result }
