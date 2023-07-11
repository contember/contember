import { Authorizator } from '@contember/authorization'

export namespace ActionsAuthorizationActions {
	export enum Resources {
		variables = 'variables',
		events = 'events',
	}

	export const VARIABLES_VIEW = Authorizator.createAction(Resources.variables, 'view')
	export const VARIABLES_SET = Authorizator.createAction(Resources.variables, 'set')

	export const EVENTS_VIEW = Authorizator.createAction(Resources.events, 'view')
	export const EVENTS_PROCESS = Authorizator.createAction(Resources.events, 'process')
}
