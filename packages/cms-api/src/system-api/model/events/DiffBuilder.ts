import DependencyBuilder from './DependencyBuilder'
import { DiffErrorCode } from '../../schema/types'
import { Stage } from '../dtos/Stage'
import { AnyEvent } from '../dtos/Event'
import QueryHandler from '../../../core/query/QueryHandler'
import DiffCountQuery from '../queries/DiffCountQuery'
import DiffQuery from '../queries/DiffQuery'
import KnexQueryable from '../../../core/knex/KnexQueryable'
import PermissionsVerifier from './PermissionsVerifier'

class DiffBuilder {
	constructor(
		private readonly dependencyBuilder: DependencyBuilder,
		private readonly queryHandler: QueryHandler<KnexQueryable>,
		private readonly permissionsVerifier: PermissionsVerifier
	) {}

	public async build(
		permissionContext: PermissionsVerifier.Context,
		baseStage: Stage,
		headStage: Stage
	): Promise<DiffBuilder.Response> {
		const count = await this.queryHandler.fetch(new DiffCountQuery(baseStage.event_id, headStage.event_id))

		if (count.ok === false) {
			return count
		}

		if (count.diff === 0) {
			return {
				ok: true,
				events: [],
			}
		}

		const events = await this.queryHandler.fetch(new DiffQuery(baseStage.event_id, headStage.event_id))
		const dependencies = await this.dependencyBuilder.build(events)
		const permissions = await this.permissionsVerifier.verify(permissionContext, headStage, baseStage, events)

		return {
			ok: true,
			events: events.map(event => ({
				...event,
				permission: permissions[event.id],
				dependencies: dependencies[event.id] || [],
			})),
		}
	}
}

namespace DiffBuilder {
	export type Response = OkResponse | ErrorResponse

	export class ErrorResponse {
		public readonly ok: false = false

		constructor(public readonly errors: DiffErrorCode[]) {}
	}

	export class OkResponse {
		public readonly ok: true = true

		constructor(public readonly events: (AnyEvent & { dependencies: string[]; permission: PermissionsVerifier.EventPermission })[]) {}
	}
}

export default DiffBuilder
