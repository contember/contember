import * as SystemApi from '@contember/graphql-client-system'
import { useCurrentSystemGraphQlClient } from '@contember/react-client'
import type { ModelType } from 'graphql-ts-client-api'
import { useCallback } from 'react'
import { useFetcherExecutor } from '../../shell/generatedApi.js'

const stageFragment = SystemApi.stage$$

export type DeploymentStage = ModelType<typeof stageFragment>

export const useStagesQuery = () => {
	const executor = useFetcherExecutor(useCurrentSystemGraphQlClient())

	return useCallback(async (): Promise<readonly DeploymentStage[]> => {
		return (await executor(SystemApi.query$.stages(stageFragment))).stages
	}, [executor])
}

// `modifications` is the migration body — kilobytes of JSON a table cannot show, so it stays unasked.
const executedMigrationFragment = SystemApi.executedMigration$
	.version
	.name
	.executedAt
	.checksum
	.formatVersion

export type ExecutedMigration = ModelType<typeof executedMigrationFragment>

/** Kept apart from the stages read: `executedMigrations` is permission-gated and stages are not. */
export const useExecutedMigrationsQuery = () => {
	const executor = useFetcherExecutor(useCurrentSystemGraphQlClient())

	return useCallback(async (): Promise<readonly ExecutedMigration[]> => {
		return (await executor(SystemApi.query$.executedMigrations(executedMigrationFragment))).executedMigrations
	}, [executor])
}
