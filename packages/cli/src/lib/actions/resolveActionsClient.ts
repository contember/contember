import { CliError } from '@contember/cli-common'
import { RemoteProjectResolver } from '../project/RemoteProjectResolver.js'
import { ActionsApi, ActionsClient } from './ActionsClient.js'

/** Injected by commands as a constructor default, so tests can substitute a fake {@link ActionsApi} without touching the network. */
export type ActionsClientResolver = (remoteProjectResolver: RemoteProjectResolver, dsn: string | undefined) => Promise<ActionsApi>

/** Resolves the target project and builds an {@link ActionsClient}; throws a typed error when the project is not configured. */
export const resolveActionsClient: ActionsClientResolver = async (remoteProjectResolver, dsn) => {
	const project = await remoteProjectResolver.resolve(dsn)
	if (!project) {
		throw new CliError('Project not defined', { code: 'PROJECT_NOT_DEFINED' })
	}
	return ActionsClient.create(project.endpoint, project.name, project.token)
}
