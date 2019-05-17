import FieldDefinition from './FieldDefinition'
import { Interface } from '../../utils/interfaceType'

export type RelationTarget = EntityConstructor<EntityType<any>>
export type EntityType<T> = { [K in keyof T]: Interface<FieldDefinition<any>> }
export type EntityConstructor<T> = { new (): T }
