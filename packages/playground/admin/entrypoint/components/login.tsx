import { ToastContent, useShowToast } from '~/lib/toast'
import { dict } from '~/lib/dict'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/lib/ui/card'
import { AnchorButton, Button } from '~/lib/ui/button'
import { LoginFormFields } from '~/lib/tenant'
import { PasswordlessSignInInitFormFields } from '~/lib/tenant/forms/passwordless-signin-init'
import { Loader } from '~/lib/ui/loader'
import { IDP, IDPInitTrigger, IDPState, LoginForm, PasswordlessSignInInitForm, useRedirect } from '@contember/interface'

export const Login = ({ idps, hasTokenFromEnv, appUrl, magicLink }: {
	appUrl: string
	hasTokenFromEnv: boolean
	idps: Record<string, string>
	magicLink: boolean
}) => {
	const showToast = useShowToast()
	const redirect = useRedirect()
	return <>
		<IDP
			onInitError={error => showToast(<ToastContent>{dict.tenant.login.idpInitError} {error}</ToastContent>, { type: 'error' })}
			onResponseError={error => showToast(
				<ToastContent>{dict.tenant.login.idpResponseError} {error}</ToastContent>, { type: 'error' })}
		>

			<Card className="w-96 relative">
				<CardHeader>
					<CardTitle className="text-2xl">{dict.tenant.login.title}</CardTitle>
					<CardDescription>
						{dict.tenant.login.description}
					</CardDescription>
				</CardHeader>
				<CardContent>
					{hasTokenFromEnv && <AnchorButton href={appUrl} size="lg" className="w-full" variant="destructive">
						Continue as default user
					</AnchorButton>}
					<LoginForm>
						<form className="grid gap-4">
							<LoginFormFields />
						</form>
					</LoginForm>

					{Object.entries(idps).map(([idp, label]) => (
						<IDPInitTrigger key={idp} identityProvider={idp}>
							<Button variant="outline" className="w-full">
								{label}
							</Button>
						</IDPInitTrigger>
					))}

					{magicLink && <PasswordlessSignInInitForm onSuccess={({ result }) => {
						redirect('magicLinkSent(request_id: $requestId)', { requestId: result.requestId })
					}}>
						<form>
							<PasswordlessSignInInitFormFields />
						</form>
					</PasswordlessSignInInitForm>}
				</CardContent>
				<IDPState state={['processing_init', 'processing_response', 'success']}>
					<Loader />
				</IDPState>
			</Card>
		</IDP>
	</>
}
