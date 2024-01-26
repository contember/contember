import {
	Maybe,
	Person,
	QueryPersonByIdArgs,
	QueryResolvers,
} from '../../schema'
import { TenantResolverContext } from '../TenantResolverContext'
import { PermissionActions, PersonManager } from '../../model'
import { PersonResponseFactory } from '../responseHelpers/PersonResponseFactory'

export class PersonQueryResolver implements QueryResolvers {
	constructor(private readonly personManager: PersonManager) {}

	async personById(
		parent: unknown,
		args: QueryPersonByIdArgs,
		context: TenantResolverContext,
	): Promise<Maybe<Person>> {
		const person = await this.personManager.findPersonById(context.db, args.id)
		if (!person || !(await context.isAllowed({ action: PermissionActions.PERSON_VIEW }))) {
			return null
		}

		return await PersonResponseFactory.createPersonResponse(person)
	}
}
