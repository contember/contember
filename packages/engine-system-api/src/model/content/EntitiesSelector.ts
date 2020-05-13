import { Client } from '@contember/database'
import { Acl, Schema } from '@contember/schema'

export type EntitiesRelationsInput = readonly {
	name: string
	relations: EntitiesRelationsInput
}[]

export interface EntitiesSelectorContext {
	db: Client
	schema: Schema
	identityVariables: Acl.VariablesMap
	projectRoles: string[]
}

export interface EntitiesSelectorInput {
	entity: string
	id: string
	relations: EntitiesRelationsInput
}

export interface EntitiesSelector {
	getEntities(context: EntitiesSelectorContext, input: EntitiesSelectorInput): Promise<EntitiesResult | null>
}

interface EntitiesResultRelations {
	[relation: string]: EntitiesResult | EntitiesResult[] | null
}

export type EntitiesResult = {
	id: string
} & EntitiesResultRelations
