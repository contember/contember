import * as TenantApi from '@contember/graphql-client-tenant'
import { ModelType } from 'graphql-ts-client-api'
import { createTenantMutation } from '../../useTenantMutation.js'

const regenerateBackupCodesResult = TenantApi.regenerateBackupCodesResult$$

export type RegenerateBackupCodesMutationResult = ModelType<typeof regenerateBackupCodesResult>

export const regenerateBackupCodesMutation = TenantApi.mutation$
	.regenerateBackupCodes(
		TenantApi
			.regenerateBackupCodesResponse$$
			.error(TenantApi.regenerateBackupCodesError$$)
			.result(regenerateBackupCodesResult),
		options => options.alias('mutation'),
	)

export const useRegenerateBackupCodesMutation = createTenantMutation(regenerateBackupCodesMutation)
export type RegenerateBackupCodesMutationVariables = Parameters<ReturnType<typeof useRegenerateBackupCodesMutation>>[0]
