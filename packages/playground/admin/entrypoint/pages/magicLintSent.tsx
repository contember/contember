import { useEffect, useState } from 'react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '~/lib/ui/card'
import { dict } from '~/lib/dict'
import { PasswordlessSignInFormFields } from '~/lib/tenant/forms/passwordless-signin'
import { MailIcon } from 'lucide-react'
import { AnchorButton } from '~/lib/ui/button'
import { Link, useCurrentRequest, useRedirect } from '@contember/interface'
import { PasswordlessSignInForm } from '@contember/react-identity'

export default () => {
	const request = useCurrentRequest()
	const redirect = useRedirect()
	const requestId = request?.parameters.request_id as string | undefined
	const [showOtp, setShowOtp] = useState(false)
	useEffect(() => {
		setTimeout(() => {
			setShowOtp(true)
		}, 5000)
	}, [])
	if (!requestId) {
		return <p>Invalid request</p>
	}
	return (
		<Card className="w-96">
			<CardHeader>
				<CardTitle className="text-2xl">{dict.tenant.passwordlessSignIn.title}</CardTitle>
			</CardHeader>
			<CardContent>
				{showOtp ? (<>
					<p className="text-gray-600">Have a verification code? Enter it here:</p>
					<PasswordlessSignInForm onSuccess={() => {
						redirect('index')
					}} requestId={requestId} validationType="otp">
						<form>
							<PasswordlessSignInFormFields type="otp" />
						</form>
					</PasswordlessSignInForm>
				</>) : <div className="flex flex-col items-center justify-center gap-4">
					<MailIcon className="text-gray-300 w-16 h-16" />
					<div className="text-center">
						An email with password reset instructions has been sent to your email address.
					</div>
					<div className="text-xs text-gray-600">
						Do you have a verification code?{' '}
						<span onClick={() => setShowOtp(true)} className="underline cursor-pointer">
							Enter manually
						</span>
					</div>
				</div>}
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
