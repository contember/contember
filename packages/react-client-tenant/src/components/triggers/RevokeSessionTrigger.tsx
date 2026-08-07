import { ReactElement, useCallback } from 'react'
import { RevokeSessionErrorCode } from '@contember/graphql-client-tenant'
import { TenantActionErrorArgs, TenantActionTrigger } from './TenantActionTrigger.js'
import { RevokeSessionMutationVariables, useRevokeSessionMutation } from '../../hooks/index.js'

export type RevokeSessionTriggerProps =
	& RevokeSessionMutationVariables
	& {
		children: ReactElement
		onSuccess?: () => void
		onError?: (args: TenantActionErrorArgs<RevokeSessionErrorCode>) => void
	}

export const RevokeSessionTrigger = ({ sessionId, ...props }: RevokeSessionTriggerProps) => {
	const revokeSession = useRevokeSessionMutation()
	const execute = useCallback(async () => await revokeSession({ sessionId }), [revokeSession, sessionId])
	return <TenantActionTrigger {...props} execute={execute} />
}
