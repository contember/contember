import { Acl } from 'cms-common'
import KnexWrapper from '../core/knex/KnexWrapper'

export interface Context {
	db: KnexWrapper
	identityVariables: Acl.VariablesMap
}
