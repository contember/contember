import { Interface } from '@contember/utils'
import FieldDefinition from './FieldDefinition'

export type RelationTarget = EntityConstructor<EntityType<any>>
export type EntityType<T> = { [K in keyof T]: Interface<FieldDefinition<any>> }
export type EntityConstructor<T> = { new (): T }
export { Interface }
