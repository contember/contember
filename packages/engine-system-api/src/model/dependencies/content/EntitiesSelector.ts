import { Client } from '@contember/database'
import { Acl, Input, Schema } from '@contember/schema'

export type EntitiesRelationsInput = readonly {
	name: string
	relations: EntitiesRelationsInput
}[]

export interface EntitiesSelectorContext {
	db: Client
	schema: Schema
	identityVariables: Acl.VariablesMap
	roles: string[]
}

export interface EntitiesSelectorInput {
	entity: string
	filter: Input.Where
	relations: EntitiesRelationsInput
}

export interface EntitiesSelector {
	getEntities(context: EntitiesSelectorContext, input: EntitiesSelectorInput): Promise<EntitiesResult[]>
}

interface EntitiesResultRelations {
	[relation: string]: EntitiesResult | EntitiesResult[] | null
}

export type EntitiesResult = {
	id: string
} & EntitiesResultRelations
