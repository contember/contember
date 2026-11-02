import * as React from 'react'
import { ReactNode, useState } from 'react'
import { Button, Loader, Table, TableCell, TableHead, TableHeader, TableRow } from '@contember/react-ui-lib-base'
import { useTenantQueryLoader, useWorkloadIdentityTrustsQuery, WorkloadIdentityTrustsQueryResult } from '@contember/react-client-tenant'
import { dict } from '../dict.js'
import { formatConfigValue, ManagedByCliNote, renderConfigQueryState } from './common.js'
import { formatWorkloadConditions } from './workload-identity-conditions.js'

export interface WorkloadIdentityTrustListController {
	refresh: () => void
}

export interface WorkloadIdentityTrustListProps {
	controller?: { current?: WorkloadIdentityTrustListController }
}

type Trust = WorkloadIdentityTrustsQueryResult[number]

const DetailList = ({ rows }: { rows: readonly (readonly [string, ReactNode])[] }) => (
	<dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-[max-content_minmax(0,1fr)]">
		{rows.map(([label, value]) => (
			<React.Fragment key={label}>
				<dt className="font-medium text-gray-700">{label}</dt>
				<dd className="min-w-0">{value}</dd>
			</React.Fragment>
		))}
	</dl>
)

const TrustDetail = ({ trust }: { trust: Trust }) => {
	const labels = dict.tenant.workloadIdentityList
	return (
		<DetailList
			rows={[
				[labels.description, trust.description ?? formatConfigValue(null)],
				[
					labels.conditions,
					<ul className="flex flex-col gap-1 font-mono text-xs">
						{formatWorkloadConditions(trust.conditions).map((line, index) => <li key={index}>{line}</li>)}
					</ul>,
				],
				[labels.roles, formatConfigValue(trust.roles)],
				[
					labels.memberships,
					trust.memberships.length === 0
						? formatConfigValue([])
						: (
							<ul className="flex flex-col gap-3">
								{trust.memberships.map((membership, index) => (
									<li key={index} className="flex flex-col gap-1">
										<span>
											<span className="font-medium">{membership.project}</span> / <span className="font-mono text-xs">{membership.role}</span>
										</span>
										{membership.variables.length > 0 && (
											<span className="text-gray-600">
												{labels.variables}: {membership.variables.map(it => `${it.name} = ${formatConfigValue(it.values)}`).join('; ')}
											</span>
										)}
										{membership.assumeMembership === undefined || membership.assumeMembership === null
											? <span className="text-gray-500 italic">{labels.noEnvelope}</span>
											: (
												<div className="flex flex-col gap-1">
													<span className="text-gray-600">{labels.envelope}</span>
													<pre className="overflow-x-auto text-xs bg-gray-50 p-3 rounded">
														{JSON.stringify(membership.assumeMembership, null, 2)}
													</pre>
												</div>
											)}
									</li>
								))}
							</ul>
						),
				],
				[labels.maxTokenLifetime, `${trust.maxTokenLifetime} ${labels.seconds}`],
				[labels.tokensValidAfter, new Date(trust.tokensValidAfter).toLocaleString()],
			]}
		/>
	)
}

/**
 * `WorkloadIdentityTrustList` shows the workload identity trusts configured on the tenant,
 * enabled and disabled, read-only.
 *
 * Requires `workloadIdentity:list`. Trusts are written with `contember tenant:apply`; there is
 * no panel write path, so a config file stays the single owner of the list.
 *
 * ## Example
 * ```tsx
 * <WorkloadIdentityTrustList />
 * ```
 */
export const WorkloadIdentityTrustList = ({ controller }: WorkloadIdentityTrustListProps) => {
	const [query, { refresh }] = useTenantQueryLoader(useWorkloadIdentityTrustsQuery(), {})
	const [expanded, setExpanded] = useState<string | null>(null)
	if (controller) {
		controller.current = { refresh }
	}

	const nonData = renderConfigQueryState({
		query,
		forbiddenMessage: dict.tenant.workloadIdentityList.forbidden,
		failedMessage: dict.tenant.workloadIdentityList.failedToLoadData,
	})
	if (nonData !== null) {
		return nonData
	}
	if (!('data' in query)) {
		return null
	}
	const trusts = query.data
	const labels = dict.tenant.workloadIdentityList

	return (
		<div className="relative flex flex-col gap-3">
			{query.state !== 'success' && <Loader position="absolute" />}
			<ManagedByCliNote />

			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>{labels.slug}</TableHead>
						<TableHead>{labels.profile}</TableHead>
						<TableHead>{labels.issuer}</TableHead>
						<TableHead>{labels.audience}</TableHead>
						<TableHead>{labels.status}</TableHead>
						<TableHead>{labels.dpop}</TableHead>
						<TableHead />
					</TableRow>
				</TableHeader>
				{trusts.length === 0 && (
					<TableRow>
						<TableCell colSpan={7}>{labels.noResults}</TableCell>
					</TableRow>
				)}
				{trusts.map(trust => (
					<React.Fragment key={trust.id}>
						<TableRow>
							<TableCell className="font-medium">{trust.slug}</TableCell>
							<TableCell className="font-mono text-xs">{labels.profiles[trust.profile]}</TableCell>
							<TableCell className="font-mono text-xs break-all">{trust.issuer}</TableCell>
							<TableCell className="font-mono text-xs break-all">{trust.audience}</TableCell>
							<TableCell>
								{trust.disabled
									? <span className="text-destructive">{dict.tenant.configView.disabled}</span>
									: <span>{dict.tenant.configView.enabled}</span>}
							</TableCell>
							<TableCell>{trust.requireDpop ? labels.dpopRequired : labels.dpopNotRequired}</TableCell>
							<TableCell>
								<Button
									variant="outline"
									size="sm"
									onClick={() => setExpanded(expanded === trust.id ? null : trust.id)}
								>
									{expanded === trust.id ? labels.hideDetails : labels.showDetails}
								</Button>
							</TableCell>
						</TableRow>
						{expanded === trust.id && (
							<TableRow>
								<TableCell colSpan={7}>
									<TrustDetail trust={trust} />
								</TableCell>
							</TableRow>
						)}
					</React.Fragment>
				))}
			</Table>
		</div>
	)
}
