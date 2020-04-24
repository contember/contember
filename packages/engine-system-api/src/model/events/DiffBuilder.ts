import { DependencyBuilder } from './DependencyBuilder'
import { DiffErrorCode } from '../../schema'
import { Stage } from '../dtos'
import { AnyEvent } from '@contember/engine-common'
import { DiffCountQuery, DiffQuery } from '../queries'
import {
	EventPermission,
	EventsPermissionsVerifier,
	EventsPermissionsVerifierContext,
} from './EventsPermissionsVerifier'
import { assertEveryIsContentEvent } from './eventUtils'
import { DatabaseContext } from '../database'
import { ProjectConfig } from '../../types'
import { SchemaVersionBuilder } from '../migrations'

export class DiffBuilder {
	constructor(
		private readonly dependencyBuilder: DependencyBuilder,
		private readonly permissionsVerifier: EventsPermissionsVerifier,
		private readonly schemaVersionBuilder: SchemaVersionBuilder,
	) {}

	public async build(
		db: DatabaseContext,
		permissionContext: EventsPermissionsVerifierContext,
		baseStage: Stage,
		headStage: Stage,
	): Promise<DiffBuilderResponseResponse> {
		const count = await db.queryHandler.fetch(new DiffCountQuery(baseStage.event_id, headStage.event_id))

		if (count.ok === false) {
			return count
		}

		if (count.diff === 0) {
			return {
				ok: true,
				events: [],
			}
		}

		const events = await db.queryHandler.fetch(new DiffQuery(baseStage.event_id, headStage.event_id))
		assertEveryIsContentEvent(events)
		const schema = await this.schemaVersionBuilder.buildSchema(db)
		const dependencies = await this.dependencyBuilder.build(schema, events)
		const permissions = await this.permissionsVerifier.verify(db, permissionContext, headStage, baseStage, events)

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

export type DiffBuilderResponseResponse = DiffBuilderOkResponse | DiffBuilderErrorResponse

export class DiffBuilderErrorResponse {
	public readonly ok: false = false

	constructor(public readonly errors: DiffErrorCode[]) {}
}

export class DiffBuilderOkResponse {
	public readonly ok: true = true

	constructor(
		public readonly events: (AnyEvent & {
			dependencies: string[]
			permission: EventPermission
		})[],
	) {}
}
