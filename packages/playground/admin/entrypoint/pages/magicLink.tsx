import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '~/lib/ui/card'
import { dict } from '~/lib/dict'
import { Loader } from '~/lib/ui/loader'
import { PasswordlessSignInFormFields } from '~/lib/tenant/forms/passwordless-signin'
import { AnchorButton } from '~/lib/ui/button'
import { Link, PasswordlessSignInForm, useCurrentRequest, usePasswordlessOtpActivator, useRedirect } from '@contember/interface'

export default () => {
	const request = useCurrentRequest()
	const redirect = useRedirect()
	const requestId = request?.parameters.request_id as string | undefined
	const token = request?.parameters.token as string | undefined
	const otpActivation = usePasswordlessOtpActivator()
	if (!requestId || !token || otpActivation.type === 'empty') {
		return <p>Invalid request</p>
	}
	return (
		<Card className="w-96">
			<CardHeader>
				<CardTitle className="text-2xl">{dict.tenant.passwordlessSignIn.title}</CardTitle>
			</CardHeader>
			<CardContent>
				{otpActivation.type === 'otp_activating' && <Loader />}
				{otpActivation.type === 'otp_activation_failed' && <div className="text-red-500 text-center">
					{dict.tenant.otpActivation.errorMessages[otpActivation.error]}
				</div>}
				{otpActivation.type === 'otp_activated' && <div className="flex flex-col items-center gap-4">
					<p className="text-lg text-center">
						Enter the following code where you initiated signing in:
					</p>
					<div className="text-4xl font-bold border p-2 rounded font-mono">
						{otpActivation.otp}
					</div>

				</div>}
				{otpActivation.type === 'can_proceed_to_login' && <PasswordlessSignInForm onSuccess={() => {
					redirect('index')
				}} requestId={requestId} token={token?.toString()} validationType="token">
					<form>
						<PasswordlessSignInFormFields type="token" />
					</form>
				</PasswordlessSignInForm>}
			</CardContent>
			<CardFooter>
				<Link to="index">
					<AnchorButton variant="link" className="ml-auto">
						{dict.tenant.login.backToLogin}
					</AnchorButton>
				</Link>
			</CardFooter>
		</Card>
	)
}

