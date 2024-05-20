import { ChangeMyPasswordForm, CreateApiKeyForm, InviteForm } from '@contember/react-identity'
import { Card, CardContent, CardHeader, CardTitle } from '../../lib/components/ui/card'
import { ChangeMyPasswordFormFields } from '../../lib/components/tenant/changeMyPasswordForm'
import { ToastContent, useShowToast } from '../../lib/components/ui/toast'
import { OtpSetup } from '../../lib/components/tenant/otpSetup'
import { PersonList } from '../../lib/components/tenant/personList'
import { InviteFormFields } from '../../lib/components/tenant/inviteForm'
import { useProjectSlug } from '@contember/react-client'
import { Input } from '../../lib/components/ui/input'
import { CreateApiKeyFormFields } from '../../lib/components/tenant/createApiKeyForm'
import { ApiKeyList } from '../../lib/components/tenant/apiKeyList'
import { useRef } from 'react'
import { MemberListController } from '../../lib/components/tenant/memberList'

export const Security = () => {
	const showToast = useShowToast()
	return (
		<div className="flex flex-col items-center gap-4">
			<Card className="w-[40rem] max-w-full">
				<CardHeader>
					<CardTitle className="text-2xl">Change Password</CardTitle>
				</CardHeader>
				<CardContent>
					<ChangeMyPasswordForm onSuccess={() => showToast(<ToastContent>Password changed</ToastContent>, { type: 'success' })}>
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
		</div>
	)
}


export const Members = () => {
	const projectSlug = useProjectSlug()!
	const showToast = useShowToast()
	const memberListController = useRef<MemberListController>()
	return (
		<div className="grid md:grid-cols-2 gap-4">
			<div>
				<Card className="w-[40rem] max-w-full">
					<CardHeader>
						<CardTitle className="text-2xl">Members</CardTitle>
					</CardHeader>
					<CardContent>
						<PersonList controller={memberListController} />
					</CardContent>
				</Card>
			</div>
			<div>
				<Card className="w-[40rem] max-w-full">
					<CardHeader>
						<CardTitle className="text-2xl">Invite</CardTitle>
					</CardHeader>
					<CardContent>
						<InviteForm
							projectSlug={projectSlug}
							initialMemberships={[{ role: 'admin', variables: [] }]}
							onSuccess={args => {
								showToast(<ToastContent>Invitation sent to {args.result.person?.email}</ToastContent>, { type: 'success' })
								memberListController.current?.refresh()
							}}
						>
							<form className="grid gap-4">
								<InviteFormFields projectSlug={projectSlug} />
							</form>
						</InviteForm>
					</CardContent>
				</Card>
			</div>
		</div>
	)
}

export const ApiKeys = () => {
	const projectSlug = useProjectSlug()!
	const showToast = useShowToast()
	const memberListController = useRef<MemberListController>()
	return (
		<div className="grid md:grid-cols-2 gap-4">
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
								showToast(<ToastContent title="API key created"><Input value={args.result.apiKey.token} type="text" /></ToastContent>, { type: 'success' })
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
		</div>
	)
}
