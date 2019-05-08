import { Identity, IdentityResolvers } from '../../schema/types'
import QueryHandler from '../../../core/query/QueryHandler'
import DbQueryable from '../../../core/database/DbQueryable'
import ProjectsByIdentityQuery from '../../model/queries/ProjectsByIdentityQuery'
import PersonQuery from '../../model/queries/person/PersonQuery'

export class IdentityTypeResolver implements IdentityResolvers {
	constructor(private readonly queryHandler: QueryHandler<DbQueryable>) {}

	async person(parent: Identity) {
		return await this.queryHandler.fetch(PersonQuery.byIdentity(parent.id))
	}

	async projects(parent: Identity) {
		return await this.queryHandler.fetch(new ProjectsByIdentityQuery(parent.id))
	}
}
