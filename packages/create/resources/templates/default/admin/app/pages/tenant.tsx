import { useProjectSlug } from '@contember/react-client'
import {
	AddProjectMemberForm,
	ChangeMyPasswordForm,
	ChangeMyProfileForm,
	CreateApiKeyForm,
	CreateGlobalApiKeyForm,
	InviteForm,
	SetProjectSecretForm,
	useIdentity,
} from '@contember/react-identity'
import { KeyRoundIcon, LockKeyholeIcon, ScrollTextIcon, UserRoundIcon, UsersIcon } from 'lucide-react'
import { ReactNode, useRef, useState } from 'react'
import { Slots } from '~/lib/layout'
import {
	AddProjectMemberFormFields,
	ApiKeyList,
	ApiKeyListController,
	AuthLogList,
	BackupCodes,
	ChangeMyPasswordFormFields,
	ChangeMyProfileFormFields,
	CreateApiKeyFormFields,
	CreateGlobalApiKeyFormFields,
	EmailOtpSetup,
	GlobalApiKeyList,
	GlobalApiKeyListController,
	IdentityProviderConnections,
	InviteFormFields,
	MemberListController,
	OtpSetup,
	PasswordlessToggle,
	PersonDetail,
	PersonList,
	PersonsList,
	PersonsListController,
	ProjectSecretList,
	ProjectSecretListController,
	SessionList,
	SetProjectSecretFormFields,
} from '~/lib/tenant'
import { ToastContent, useShowToast } from '~/lib/toast'
import { Card, CardContent, CardHeader, CardTitle } from '~/lib/ui/card'
import { Dialog, DialogContent } from '~/lib/ui/dialog'
import { Input } from '~/lib/ui/input'

const Title = ({ icon, children }: { icon?: ReactNode; children: ReactNode }) => {
	return (
		<div className="flex items-center">
			{icon && <div className="mr-2">{icon}</div>}
			<h1>{children}</h1>
		</div>
	)
}

const Panel = ({ title, children }: { title: string; children: ReactNode }) => (
	<Card className="w-[40rem] max-w-full">
		<CardHeader>
			<CardTitle className="text-2xl">{title}</CardTitle>
		</CardHeader>
		<CardContent>{children}</CardContent>
	</Card>
)

export const Security = () => {
	const showToast = useShowToast()
	const identity = useIdentity()
	const person = identity?.person

	return (
		<>
			<Slots.Title>
				<Title icon={<LockKeyholeIcon />}>Security</Title>
			</Slots.Title>

			<div className="flex flex-col gap-4">
				<Panel title="Profile">
					{/* keyed on the identity values: the form snapshots initialValues on mount */}
					<ChangeMyProfileForm
						key={`${person?.email ?? ''} ${person?.name ?? ''}`}
						initialValues={{ email: person?.email ?? '', name: person?.name ?? '' }}
						onSuccess={() => showToast(<ToastContent>Profile updated</ToastContent>, { type: 'success' })}
					>
						<form className="grid gap-4">
							<ChangeMyProfileFormFields />
						</form>
					</ChangeMyProfileForm>
				</Panel>

				<Panel title="Change password">
					<ChangeMyPasswordForm onSuccess={() => showToast(<ToastContent>Password changed</ToastContent>, { type: 'success' })}>
						<form className="grid gap-4">
							<ChangeMyPasswordFormFields />
						</form>
					</ChangeMyPasswordForm>
				</Panel>

				<Panel title="Two-factor — authenticator app">
					<OtpSetup />
				</Panel>

				<Panel title="Two-factor — e-mail code">
					<EmailOtpSetup />
				</Panel>

				<Panel title="Backup codes">
					<BackupCodes />
				</Panel>

				<Panel title="Passwordless sign-in">
					<PasswordlessToggle />
				</Panel>

				<Panel title="Connected identity providers">
					<IdentityProviderConnections />
				</Panel>

				<Card className="w-[60rem] max-w-full">
					<CardHeader>
						<CardTitle className="text-2xl">Active sessions</CardTitle>
					</CardHeader>
					<CardContent>
						<SessionList />
					</CardContent>
				</Card>
			</div>
		</>
	)
}

export const Members = () => {
	const projectSlug = useProjectSlug()!
	const showToast = useShowToast()
	const memberListController = useRef<MemberListController>(undefined)

	return (
		<>
			<Slots.Title>
				<Title icon={<UsersIcon />}>Members</Title>
			</Slots.Title>

			<div className="flex flex-col gap-4">
				<Panel title="Invite">
					<InviteForm
						projectSlug={projectSlug}
						initialMemberships={[{ role: 'admin', variables: [] }]}
						onSuccess={args => {
							showToast(<ToastContent>Invitation sent to {args.result.person?.email}</ToastContent>, { type: 'success' })
							memberListController.current?.refresh()
						}}
					>
						<form>
							<InviteFormFields projectSlug={projectSlug} />
						</form>
					</InviteForm>
				</Panel>

				<Panel title="Add an existing identity">
					<AddProjectMemberForm
						projectSlug={projectSlug}
						initialMemberships={[{ role: 'admin', variables: [] }]}
						onSuccess={() => {
							showToast(<ToastContent>Member added</ToastContent>, { type: 'success' })
							memberListController.current?.refresh()
						}}
					>
						<form>
							<AddProjectMemberFormFields projectSlug={projectSlug} />
						</form>
					</AddProjectMemberForm>
				</Panel>

				<Card className="w-[60rem] max-w-full">
					<CardHeader>
						<CardTitle className="text-2xl">Members</CardTitle>
					</CardHeader>
					<CardContent>
						<PersonList controller={memberListController} />
					</CardContent>
				</Card>
			</div>
		</>
	)
}

export const ApiKeys = () => {
	const projectSlug = useProjectSlug()!
	const showToast = useShowToast()
	const apiKeyListController = useRef<ApiKeyListController>(undefined)
	const globalApiKeyListController = useRef<GlobalApiKeyListController>(undefined)

	const showToken = (token?: string) => {
		showToast(
			<ToastContent title="API key created">
				<Input value={token ?? ''} type="text" />
			</ToastContent>,
			{ type: 'success' },
		)
	}

	return (
		<>
			<Slots.Title>
				<Title icon={<KeyRoundIcon />}>API keys</Title>
			</Slots.Title>

			<div className="flex flex-col gap-4">
				<Panel title="Create API key">
					<CreateApiKeyForm
						projectSlug={projectSlug}
						initialMemberships={[{ role: 'admin', variables: [] }]}
						onSuccess={args => {
							showToken(args.result.apiKey.token)
							apiKeyListController.current?.refresh()
						}}
					>
						<form className="grid gap-4">
							<CreateApiKeyFormFields projectSlug={projectSlug} />
						</form>
					</CreateApiKeyForm>
				</Panel>

				<Card className="w-[60rem] max-w-full">
					<CardHeader>
						<CardTitle className="text-2xl">Project API keys</CardTitle>
					</CardHeader>
					<CardContent>
						<ApiKeyList controller={apiKeyListController} />
					</CardContent>
				</Card>

				{/* global keys carry tenant-wide roles instead of a project membership — SUPER_ADMIN only */}
				<Panel title="Create global API key">
					<CreateGlobalApiKeyForm
						onSuccess={args => {
							showToken(args.result.apiKey.token)
							globalApiKeyListController.current?.refresh()
						}}
					>
						<form className="grid gap-4">
							<CreateGlobalApiKeyFormFields />
						</form>
					</CreateGlobalApiKeyForm>
				</Panel>

				<Card className="w-[60rem] max-w-full">
					<CardHeader>
						<CardTitle className="text-2xl">Global API keys</CardTitle>
					</CardHeader>
					<CardContent>
						<GlobalApiKeyList controller={globalApiKeyListController} />
					</CardContent>
				</Card>
			</div>
		</>
	)
}

export const Persons = () => {
	const personsListController = useRef<PersonsListController>(undefined)
	const [selectedPersonId, setSelectedPersonId] = useState<string>()

	return (
		<>
			<Slots.Title>
				<Title icon={<UserRoundIcon />}>Persons</Title>
			</Slots.Title>

			<Card className="w-[80rem] max-w-full">
				<CardHeader>
					<CardTitle className="text-2xl">Persons</CardTitle>
				</CardHeader>
				<CardContent>
					<PersonsList controller={personsListController} onSelectPerson={setSelectedPersonId} />
				</CardContent>
			</Card>

			<Dialog
				open={selectedPersonId !== undefined}
				onOpenChange={open => {
					if (!open) {
						setSelectedPersonId(undefined)
						personsListController.current?.refresh()
					}
				}}
			>
				<DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
					{selectedPersonId && <PersonDetail personId={selectedPersonId} />}
				</DialogContent>
			</Dialog>
		</>
	)
}

export const AuditLog = () => (
	<>
		<Slots.Title>
			<Title icon={<ScrollTextIcon />}>Audit log</Title>
		</Slots.Title>

		<Card className="w-[80rem] max-w-full">
			<CardContent className="pt-6">
				<AuthLogList />
			</CardContent>
		</Card>
	</>
)

export const ProjectSecrets = () => {
	const projectSlug = useProjectSlug()!
	const showToast = useShowToast()
	const secretListController = useRef<ProjectSecretListController>(undefined)

	return (
		<>
			<Slots.Title>
				<Title icon={<KeyRoundIcon />}>Project secrets</Title>
			</Slots.Title>

			<div className="flex flex-col gap-4">
				<Panel title="Set a secret">
					<SetProjectSecretForm
						projectSlug={projectSlug}
						onSuccess={() => {
							showToast(<ToastContent>Secret saved</ToastContent>, { type: 'success' })
							secretListController.current?.refresh()
						}}
					>
						<form className="grid gap-4">
							<SetProjectSecretFormFields />
						</form>
					</SetProjectSecretForm>
				</Panel>

				<Card className="w-[60rem] max-w-full">
					<CardHeader>
						<CardTitle className="text-2xl">Secrets</CardTitle>
					</CardHeader>
					<CardContent>
						{/* values are never readable — the API returns keys and timestamps only */}
						<ProjectSecretList controller={secretListController} />
					</CardContent>
				</Card>
			</div>
		</>
	)
}
