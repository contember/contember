import * as React from 'react'
import { useState } from 'react'
import { Button, Loader, Table, TableCell, TableHead, TableHeader, TableRow } from '@contember/react-ui-lib-base'
import { useIdentityProvidersQuery, useTenantQueryLoader } from '@contember/react-client-tenant'
import { dict } from '../dict.js'
import { formatConfigValue, ManagedByCliNote, renderConfigQueryState } from './common.js'

export interface IdentityProviderListController {
	refresh: () => void
}

export interface IdentityProviderListProps {
	controller?: { current?: IdentityProviderListController }
}

/**
 * `IdentityProviderList` shows the identity providers configured on the tenant, read-only.
 *
 * This is an administration view (`idp:list`), not a source for login-screen
 * buttons — an unauthenticated visitor cannot run the query. Providers are
 * written with `contember tenant:apply`.
 *
 * The configuration blob is collapsed by default and comes from
 * `getPublicConfiguration`, which strips the client secret for the built-in
 * handlers. A custom handler that does not implement it returns the raw stored
 * configuration, hence the note under the table.
 *
 * ## Example
 * ```tsx
 * <IdentityProviderList />
 * ```
 */
export const IdentityProviderList = ({ controller }: IdentityProviderListProps) => {
	const [query, { refresh }] = useTenantQueryLoader(useIdentityProvidersQuery(), {})
	const [expanded, setExpanded] = useState<string | null>(null)
	if (controller) {
		controller.current = { refresh }
	}

	const nonData = renderConfigQueryState({
		query,
		forbiddenMessage: dict.tenant.identityProviderList.forbidden,
		failedMessage: dict.tenant.identityProviderList.failedToLoadData,
	})
	if (nonData !== null) {
		return nonData
	}
	if (!('data' in query)) {
		return null
	}
	const providers = query.data

	return (
		<div className="relative flex flex-col gap-3">
			{query.state !== 'success' && <Loader position="absolute" />}
			<ManagedByCliNote />

			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>{dict.tenant.identityProviderList.slug}</TableHead>
						<TableHead>{dict.tenant.identityProviderList.type}</TableHead>
						<TableHead>{dict.tenant.identityProviderList.status}</TableHead>
						<TableHead>{dict.tenant.identityProviderList.autoSignUp}</TableHead>
						<TableHead>{dict.tenant.identityProviderList.exclusive}</TableHead>
						<TableHead>{dict.tenant.identityProviderList.configuration}</TableHead>
					</TableRow>
				</TableHeader>
				{providers.length === 0 && (
					<TableRow>
						<TableCell colSpan={6}>{dict.tenant.identityProviderList.noResults}</TableCell>
					</TableRow>
				)}
				{providers.map(provider => (
					<React.Fragment key={provider.slug}>
						<TableRow>
							<TableCell className="font-medium">{provider.slug}</TableCell>
							<TableCell className="font-mono text-xs">{provider.type}</TableCell>
							<TableCell>
								{provider.disabledAt
									? <span className="text-destructive">{dict.tenant.configView.disabled}</span>
									: <span>{dict.tenant.configView.enabled}</span>}
							</TableCell>
							<TableCell>{formatConfigValue(provider.options.autoSignUp)}</TableCell>
							<TableCell>{formatConfigValue(provider.options.exclusive)}</TableCell>
							<TableCell>
								<Button
									variant="outline"
									size="sm"
									onClick={() => setExpanded(expanded === provider.slug ? null : provider.slug)}
								>
									{expanded === provider.slug
										? dict.tenant.identityProviderList.hideConfiguration
										: dict.tenant.identityProviderList.showConfiguration}
								</Button>
							</TableCell>
						</TableRow>
						{expanded === provider.slug && (
							<TableRow>
								<TableCell colSpan={6}>
									<pre className="overflow-x-auto text-xs bg-gray-50 p-3 rounded">
										{JSON.stringify(provider.configuration, null, 2)}
									</pre>
								</TableCell>
							</TableRow>
						)}
					</React.Fragment>
				))}
			</Table>
			<p className="text-sm text-gray-500">{dict.tenant.identityProviderList.secretsNote}</p>
		</div>
	)
}
