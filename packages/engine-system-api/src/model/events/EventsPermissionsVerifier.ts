import { AuthorizationScope, Authorizator } from '@contember/authorization'
import { Acl } from '@contember/schema'
import { AnyEvent } from '@contember/engine-common'
import { Stage } from '../dtos'
import { AuthorizationActions, Identity } from '../authorization'
import { DatabaseContext } from '../database'

export class EventsPermissionsVerifier {
	constructor(private readonly authorizator: Authorizator) {}

	public async verify(
		db: DatabaseContext,
		permissionContext: EventsPermissionsVerifierContext,
		sourceStage: Stage,
		targetStage: Stage,
		events: AnyEvent[],
	): Promise<EventsPermissionsVerifierResult> {
		const isAllowed = await this.authorizator.isAllowed(
			permissionContext.identity,
			new AuthorizationScope.Global(),
			AuthorizationActions.PROJECT_RELEASE_ANY,
		)
		return events
			.map(it => it.id)
			.reduce<EventsPermissionsVerifierResult>(
				(acc, id) => ({ ...acc, [id]: isAllowed ? EventPermission.canApply : EventPermission.forbidden }),
				{},
			)
	}
}

export type EventsPermissionsVerifierResult = { [eventId: string]: EventPermission }

export type EventsPermissionsVerifierContext = {
	variables: Acl.VariablesMap
	identity: Identity
}

export enum EventPermission {
	forbidden = 'forbidden',
	canView = 'canView',
	canApply = 'canApply',
}
