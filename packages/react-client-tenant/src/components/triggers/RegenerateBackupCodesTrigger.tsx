import { ReactElement, useCallback } from 'react'
import { RegenerateBackupCodesErrorCode } from '@contember/graphql-client-tenant'
import { RegenerateBackupCodesMutationResult, useRegenerateBackupCodesMutation } from '../../hooks/index.js'
import { TenantActionErrorArgs, TenantActionTrigger } from './TenantActionTrigger.js'

export interface RegenerateBackupCodesTriggerProps {
	children: ReactElement
	/** The result carries the new codes — show them once, they are not retrievable later. */
	onSuccess?: (args: { result: RegenerateBackupCodesMutationResult }) => void
	onError?: (args: TenantActionErrorArgs<RegenerateBackupCodesErrorCode>) => void
}

export const RegenerateBackupCodesTrigger = (props: RegenerateBackupCodesTriggerProps) => {
	const regenerateBackupCodes = useRegenerateBackupCodesMutation()

	return (
		<TenantActionTrigger<RegenerateBackupCodesMutationResult, RegenerateBackupCodesErrorCode>
			execute={useCallback(() => regenerateBackupCodes({}), [regenerateBackupCodes])}
			{...props}
		/>
	)
}
