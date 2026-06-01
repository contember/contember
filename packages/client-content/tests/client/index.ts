
import { ContemberClientNames } from './names.js'
import type { ContemberClientSchema } from './entities.js'
import { ContentQueryBuilder, TypedContentQueryBuilder, TypedEntitySelection } from '@contember/client-content'
export * from './names.js'
export * from './enums.js'
export * from './entities.js'

export const queryBuilder = new ContentQueryBuilder(ContemberClientNames) as unknown as TypedContentQueryBuilder<ContemberClientSchema>

export type FragmentOf<EntityName extends keyof ContemberClientSchema['entities'] & string, Data = unknown> =
TypedEntitySelection<ContemberClientSchema, EntityName, ContemberClientSchema['entities'][EntityName], Data>

export type FragmentType<T extends TypedEntitySelection<any, any, any, any> = any> =
T extends TypedEntitySelection<any, any, any, infer TFields>
	? TFields
	: never
