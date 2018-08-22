import KnexConnection from '../core/knex/KnexConnection'
import { Acl } from 'cms-common'

export interface Context {
	db: KnexConnection
	identityId: string
	identityVariables: Acl.VariablesMap
}
