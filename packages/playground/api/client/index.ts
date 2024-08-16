
import { ContemberClientNames } from './names'
import type { ContemberClientSchema } from './entities'
import { ContentQueryBuilder, TypedContentQueryBuilder, TypedEntitySelection } from '@contember/client-content'
export * from './names'
export * from './enums'
export * from './entities'

export const queryBuilder = new ContentQueryBuilder(ContemberClientNames) as unknown as TypedContentQueryBuilder<ContemberClientSchema>

export type FragmentOf<EntityName extends keyof ContemberClientSchema['entities'] & string, Data = unknown> =
TypedEntitySelection<ContemberClientSchema, EntityName, ContemberClientSchema['entities'][EntityName], Data>

export type FragmentType<T extends TypedEntitySelection<any, any, any, any> = any> =
T extends TypedEntitySelection<any, any, any, infer TFields>
	? TFields
	: never
