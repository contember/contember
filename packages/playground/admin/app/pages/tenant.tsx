import { useProjectSlug } from '@contember/react-client'
import { ChangeMyPasswordForm, CreateApiKeyForm, InviteForm } from '@contember/react-identity'
import { KeyRoundIcon, LockKeyholeIcon, UsersIcon } from 'lucide-react'
import { useRef } from 'react'
import { Title } from '~/app/components/title'
import { FormLayout } from '~/lib/form'
import { Slots } from '~/lib/layout'
import { GenericPage } from '~/lib/pages'
import {
	ApiKeyList,
	ChangeMyPasswordFormFields,
	CreateApiKeyFormFields,
	InviteFormFields,
	MemberListController,
	OtpSetup,
	PersonList,
} from '~/lib/tenant'
import { ToastContent, useShowToast } from '~/lib/toast'
import { Card, CardContent, CardHeader, CardTitle } from '~/lib/ui/card'
import { Input } from '~/lib/ui/input'

export const Security = () => {
	const showToast = useShowToast()

	return (
		<GenericPage title={<Title icon={<LockKeyholeIcon />}>Security</Title>}>
			<FormLayout>
				<Card className="w-[40rem] max-w-full">
					<CardHeader>
						<CardTitle className="text-2xl">Change Password</CardTitle>
					</CardHeader>
					<CardContent>
						<ChangeMyPasswordForm onSuccess={() => showToast(
							<ToastContent>Password changed</ToastContent>, { type: 'success' })}>
							<form className="grid gap-4">
								<ChangeMyPasswordFormFields />
							</form>
						</ChangeMyPasswordForm>
					</CardContent>
				</Card>
				<Card className="w-[40rem] max-w-full">
					<CardHeader>
						<CardTitle className="text-2xl">Two-factor setup</CardTitle>
					</CardHeader>
					<CardContent>
						<OtpSetup />
					</CardContent>
				</Card>
			</FormLayout>
		</GenericPage>
	)
}


export const Members = () => {
	const projectSlug = useProjectSlug()!
	const showToast = useShowToast()
	const memberListController = useRef<MemberListController>()

	return (
		<GenericPage title={<Title icon={<UsersIcon />}>Members</Title>}>
			<FormLayout>
				<Card className="w-[40rem] max-w-full">
					<CardHeader>
						<CardTitle className="text-2xl">Invite</CardTitle>
					</CardHeader>
					<CardContent>
						<InviteForm
							projectSlug={projectSlug}
							initialMemberships={[{ role: 'admin', variables: [] }]}
							onSuccess={args => {
								showToast(
									<ToastContent>Invitation sent to {args.result.person?.email}</ToastContent>, { type: 'success' })
								memberListController.current?.refresh()
							}}
						>
							<form>
								<InviteFormFields projectSlug={projectSlug} />
							</form>
						</InviteForm>
					</CardContent>
				</Card>
				<Card className="w-[40rem] max-w-full">
					<CardHeader>
						<CardTitle className="text-2xl">Members</CardTitle>
					</CardHeader>
					<CardContent>
						<PersonList controller={memberListController} />
					</CardContent>
				</Card>
			</FormLayout>
		</GenericPage>
	)
}

export const ApiKeys = () => {
	const projectSlug = useProjectSlug()!
	const showToast = useShowToast()
	const memberListController = useRef<MemberListController>()

	return (
		<GenericPage title={<Title icon={<KeyRoundIcon />}>API keys</Title>}>
			<FormLayout>
				<div>
					<Card className="w-[40rem] max-w-full">
						<CardHeader>
							<CardTitle className="text-2xl">Create API key</CardTitle>
						</CardHeader>
						<CardContent>
							<CreateApiKeyForm
								projectSlug={projectSlug}
								initialMemberships={[{ role: 'admin', variables: [] }]}
								onSuccess={args => {
									showToast((
										<ToastContent title="API key created">
											<Input value={args.result.apiKey.token} type="text" />
										</ToastContent>
									), { type: 'success' })
									memberListController.current?.refresh()
								}}
							>
								<form className="grid gap-4">
									<CreateApiKeyFormFields projectSlug={projectSlug} />
								</form>
							</CreateApiKeyForm>
						</CardContent>
					</Card>
				</div>
				<div>
					<Card className="w-[40rem] max-w-full">
						<CardHeader>
							<CardTitle className="text-2xl">API keys</CardTitle>
						</CardHeader>
						<CardContent>
							<ApiKeyList controller={memberListController} />
						</CardContent>
					</Card>
				</div>
			</FormLayout>
		</GenericPage>
	)
}
