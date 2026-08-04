import * as React from 'react'
import { Loader, Table, TableCell, TableHead, TableHeader, TableRow } from '@contember/react-ui-lib-base'
import { useAuthPoliciesQuery, useTenantQueryLoader } from '@contember/react-client-tenant'
import { dict } from '../dict.js'
import { formatConfigValue, ManagedByCliNote, renderConfigQueryState } from './common.js'

export interface AuthPolicyListController {
	refresh: () => void
}

export interface AuthPolicyListProps {
	controller?: { current?: AuthPolicyListController }
}

/**
 * `AuthPolicyList` shows the configured per-role MFA / session policies read-only.
 *
 * Without this view an enforced MFA requirement is invisible to an administrator —
 * they only meet it as a sign-in prompt. Policies are written with
 * `contember tenant:apply`; requires `system:configure` to read.
 *
 * ## Example
 * ```tsx
 * <AuthPolicyList />
 * ```
 */
export const AuthPolicyList = ({ controller }: AuthPolicyListProps) => {
	const [query, { refresh }] = useTenantQueryLoader(useAuthPoliciesQuery(), {})
	if (controller) {
		controller.current = { refresh }
	}

	const nonData = renderConfigQueryState({
		query,
		forbiddenMessage: dict.tenant.authPolicyList.forbidden,
		failedMessage: dict.tenant.authPolicyList.failedToLoadData,
	})
	if (nonData !== null) {
		return nonData
	}
	if (!('data' in query)) {
		return null
	}
	const policies = query.data

	return (
		<div className="relative flex flex-col gap-3">
			{query.state !== 'success' && <Loader position="absolute" />}
			<ManagedByCliNote />

			{policies.length === 0
				? <div className="text-gray-500 italic">{dict.tenant.authPolicyList.noResults}</div>
				: (
					<>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>{dict.tenant.authPolicyList.scope}</TableHead>
									<TableHead>{dict.tenant.authPolicyList.project}</TableHead>
									<TableHead>{dict.tenant.authPolicyList.roles}</TableHead>
									<TableHead>{dict.tenant.authPolicyList.mfaRequired}</TableHead>
									<TableHead>{dict.tenant.authPolicyList.tokenExpiration}</TableHead>
									<TableHead>{dict.tenant.authPolicyList.idleTimeout}</TableHead>
									<TableHead>{dict.tenant.authPolicyList.mfaGraceDuration}</TableHead>
									<TableHead>{dict.tenant.authPolicyList.rememberMeAllowed}</TableHead>
								</TableRow>
							</TableHeader>
							{policies.map(policy => (
								<TableRow key={policy.id}>
									<TableCell className="font-medium">{policy.scope}</TableCell>
									<TableCell>{policy.project ?? '—'}</TableCell>
									<TableCell className="font-mono text-xs">{policy.roles.join(', ')}</TableCell>
									<TableCell>{formatConfigValue(policy.mfaRequired)}</TableCell>
									<TableCell className="whitespace-nowrap">{formatConfigValue(policy.tokenExpiration)}</TableCell>
									<TableCell className="whitespace-nowrap">{formatConfigValue(policy.idleTimeout)}</TableCell>
									<TableCell className="whitespace-nowrap">{formatConfigValue(policy.mfaGraceDuration)}</TableCell>
									<TableCell>{formatConfigValue(policy.rememberMeAllowed)}</TableCell>
								</TableRow>
							))}
						</Table>
						<p className="text-sm text-gray-500">{dict.tenant.authPolicyList.aggregationNote}</p>
					</>
				)}
		</div>
	)
}
