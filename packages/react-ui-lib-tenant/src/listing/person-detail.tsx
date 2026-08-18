import * as React from 'react'
import { ReactNode } from 'react'
import { Loader, Table, TableCell, TableHead, TableHeader, TableRow, ToastContent, useShowToast } from '@contember/react-ui-lib-base'
import { usePersonQuery, useTenantQueryLoader } from '@contember/react-client-tenant'
import { ChangePasswordForm, ChangeProfileForm } from '@contember/interface'
import { dict } from '../dict.js'
import { ChangeProfileFormFields, GlobalRolesControl, SetPersonPasswordFormFields } from '../forms/index.js'
import { SessionList } from '../security/index.js'
import { MfaBadges } from './mfa.js'
import { ResetPersonMfaAction } from './person-actions.js'

export interface PersonDetailController {
	refresh: () => void
}

export interface PersonDetailProps {
	personId: string
	controller?: { current?: PersonDetailController }
}

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
	<div className="flex flex-col gap-2">
		<h2 className="text-base font-semibold">{title}</h2>
		{children}
	</div>
)

/**
 * `PersonDetail` is the administrator view of a single person — profile, password, 2FA, global roles, sessions
 * and connected identity providers. The host application decides the surrounding layout.
 *
 * ## Example
 * ```tsx
 * <PersonDetail personId={personId} />
 * ```
 */
export const PersonDetail = ({ personId, controller }: PersonDetailProps) => {
	const [query, { refresh }] = useTenantQueryLoader(usePersonQuery(), { personId })
	if (controller) {
		controller.current = { refresh }
	}
	const showToast = useShowToast()

	if (query.state === 'error') {
		return <div className="text-destructive italic">{dict.tenant.personDetail.failedToLoadData}</div>
	}
	if (!('data' in query)) {
		return (
			<div className="relative min-h-24">
				<Loader position="absolute" />
			</div>
		)
	}
	const person = query.data
	if (person === null) {
		return <div className="text-gray-400 italic">{dict.tenant.personDetail.notFound}</div>
	}

	return (
		<div className="relative flex flex-col gap-8">
			{query.state !== 'success' && <Loader position="absolute" />}

			<Section title={dict.tenant.personDetail.profile}>
				<div className="flex flex-col gap-1">
					<span className="text-sm font-medium">{dict.tenant.personDetail.identityId}</span>
					<code className="select-all rounded bg-gray-100 px-2 py-1 text-xs">{person.identity.id}</code>
				</div>
				{/* keyed on the loaded values: TenantForm snapshots initialValues on mount, so a refresh would otherwise show stale fields */}
				<ChangeProfileForm
					key={`${person.email ?? ''} ${person.name ?? ''}`}
					personId={personId}
					initialValues={{ email: person.email ?? '', name: person.name ?? '' }}
					onSuccess={() => {
						refresh()
						showToast(<ToastContent>{dict.tenant.personDetail.profileUpdated}</ToastContent>, { type: 'success' })
					}}
				>
					<form className="grid gap-4">
						<ChangeProfileFormFields />
					</form>
				</ChangeProfileForm>
			</Section>

			<Section title={dict.tenant.personDetail.password}>
				<ChangePasswordForm
					personId={personId}
					onSuccess={() => showToast(<ToastContent>{dict.tenant.personDetail.passwordUpdated}</ToastContent>, { type: 'success' })}
				>
					<form className="grid gap-4">
						<SetPersonPasswordFormFields />
					</form>
				</ChangePasswordForm>
			</Section>

			<Section title={dict.tenant.personDetail.mfa}>
				<div className="flex gap-4 items-center">
					<MfaBadges otpEnabled={person.otpEnabled} emailOtpEnabled={person.emailOtpEnabled} />
					<ResetPersonMfaAction personId={personId} onSuccess={refresh} />
				</div>
			</Section>

			<Section title={dict.tenant.personDetail.globalRoles}>
				<GlobalRolesControl identityId={person.identity.id} roles={person.identity.roles ?? []} onChange={refresh} />
			</Section>

			<Section title={dict.tenant.personDetail.sessions}>
				<SessionList personId={personId} />
			</Section>

			<Section title={dict.tenant.personDetail.identityProviders}>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>{dict.tenant.personDetail.identityProvider}</TableHead>
							<TableHead>{dict.tenant.personDetail.identityProviderAccount}</TableHead>
							<TableHead>{dict.tenant.personDetail.identityProviderConnectedAt}</TableHead>
							<TableHead>{dict.tenant.personDetail.identityProviderStatus}</TableHead>
						</TableRow>
					</TableHeader>
					{person.identityProviders.length === 0 && (
						<TableRow>
							<TableCell colSpan={4}>{dict.tenant.personDetail.noIdentityProviders}</TableCell>
						</TableRow>
					)}
					{person.identityProviders.map(connection => (
						<TableRow key={connection.id}>
							<TableCell className="font-medium">{connection.identityProvider.slug}</TableCell>
							<TableCell>{connection.externalIdentifier}</TableCell>
							<TableCell className="whitespace-nowrap">{new Date(connection.createdAt).toLocaleString()}</TableCell>
							<TableCell>
								{connection.identityProvider.disabledAt
									? <span className="text-destructive">{dict.tenant.personDetail.identityProviderDisabled}</span>
									: null}
							</TableCell>
						</TableRow>
					))}
				</Table>
			</Section>
		</div>
	)
}
