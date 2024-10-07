import './index.css'
import { createErrorHandler } from '@contember/react-devbar'
import { createRoot } from 'react-dom/client'
import { LoginFormFields, PasswordResetFormFields, PasswordResetRequestFormFields } from '@app/lib/tenant'
import { ContemberClient } from '@contember/react-client'
import {
	IdentityProvider,
	IdentityState,
	IDP,
	IDPInitTrigger,
	IDPState,
	LoginForm,
	LogoutTrigger,
	PasswordlessSignInForm,
	PasswordlessSignInInitForm,
	PasswordResetForm,
	PasswordResetRequestForm,
	usePasswordlessOtpActivator,
} from '@contember/react-identity'
import { Link, RoutingProvider, useCurrentRequest, useRedirect } from '@contember/react-routing'
import { Pages, useIdentity } from '@contember/interface'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@app/lib/ui/card'
import { AnchorButton, Button } from '@app/lib/ui/button'
import { CircleAlert, MailIcon } from 'lucide-react'
import { ToastContent, Toaster, useShowToast } from '@app/lib/toast'
import { Loader } from '@app/lib/ui/loader'
import { Overlay } from '@app/lib/ui/overlay'
import { useEffect, useState } from 'react'
import { dict } from '@app/lib/dict'
import { PasswordlessSignInInitFormFields } from '@app/lib/tenant/forms/passwordless-signin-init'
import { PasswordlessSignInFormFields } from '@app/lib/tenant/forms/passwordless-signin'

const errorHandler = createErrorHandler((dom, react, onRecoverableError) => createRoot(dom, { onRecoverableError }).render(react))

const rootEl = document.body.appendChild(document.createElement('div'))

const Idps = {
	google: 'Login with Google',
}

const hasTokenFromEnv = import.meta.env.VITE_CONTEMBER_ADMIN_SESSION_TOKEN !== '__SESSION_TOKEN__'
const appUrl = '/app'

const Login = () => {
	const showToast = useShowToast()
	const redirect = useRedirect()
	return <>
		<IDP
			onInitError={error => showToast(<ToastContent>{dict.tenant.login.idpInitError} {error}</ToastContent>, { type: 'error' })}
			onResponseError={error => showToast(<ToastContent>{dict.tenant.login.idpResponseError} {error}</ToastContent>, { type: 'error' })}
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

					{Object.entries(Idps).map(([idp, label]) => (
						<IDPInitTrigger key={idp} identityProvider={idp}>
							<Button variant="outline" className="w-full">
								{label}
							</Button>
						</IDPInitTrigger>
					))}

					<PasswordlessSignInInitForm onSuccess={({ result }) => {
						redirect('magicLinkSent(request_id: $requestId)', { requestId: result.requestId })
					}}>
						<form>
							<PasswordlessSignInInitFormFields />
						</form>
					</PasswordlessSignInInitForm>
				</CardContent>
				<IDPState state={['processing_init', 'processing_response', 'success']}>
					<Loader />
				</IDPState>
			</Card>
		</IDP>
	</>
}

const LoggedIn = () => {
	const identity = useIdentity()
	useEffect(() => {
		setTimeout(() => {
			window.location.href = appUrl
		}, 500)
	}, [])

	return (
		<Card className="w-96 relative">
			<CardHeader>
				<CardTitle className="text-2xl">Logged in </CardTitle>
				<CardDescription>
					as {identity?.person?.email ?? 'unknown'}
				</CardDescription>
			</CardHeader>
			<Loader position="static" />
		</Card>
	)

}

const IndexPage = () => {
	return (
		<IdentityProvider>
			<IdentityState state={['none', 'cleared']}>
				<Login />
			</IdentityState>
			<IdentityState state="success">
				<LoggedIn />
			</IdentityState>
			<IdentityState state="loading">
				<Loader />
			</IdentityState>
			<IdentityState state="failed">
				<Overlay>
					<Card className="w-72">
						<CardContent className="flex flex-col items-center gap-2">
							<CircleAlert className="h-12 w-12 text-destructive" />
							<p className="text-center text-lg text-gray-600">
								{dict.identityLoader.fail}
							</p>
							<LogoutTrigger>
								<Button>Login again</Button>
							</LogoutTrigger>
						</CardContent>
					</Card>
				</Overlay>
			</IdentityState>
		</IdentityProvider>
	)
}

const PasswordResetRequestPage = () => {
	const redirect = useRedirect()
	return (
		<Card className="w-96">
			<CardHeader>
				<CardTitle className="text-2xl">{dict.tenant.passwordResetRequest.title}</CardTitle>
				<CardDescription>
					{dict.tenant.passwordResetRequest.description}
				</CardDescription>
			</CardHeader>
			<CardContent>
				<PasswordResetRequestForm onSuccess={() => redirect('resetRequestSuccess')}>
					<form>
						<PasswordResetRequestFormFields />
					</form>
				</PasswordResetRequestForm>
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

const PasswordResetPage = () => {
	const request = useCurrentRequest()
	const redirect = useRedirect()
	const showToast = useShowToast()
	const token = request?.parameters.token as string | undefined
	return (
		<Card className="w-96">
			<CardHeader>
				<CardTitle className="text-2xl">{dict.tenant.passwordReset.title}</CardTitle>
				<CardDescription>
					{dict.tenant.passwordReset.description}
				</CardDescription>
			</CardHeader>
			<CardContent>
				<PasswordResetForm onSuccess={() => {
					showToast(<ToastContent>
						Password has been reset
					</ToastContent>, { type: 'success' })
					redirect('index')
				}} token={token}>
					<form>
						<PasswordResetFormFields hasToken={!!token} />
					</form>
				</PasswordResetForm>
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

const PasswordResetRequestSuccessPage = () => (
	<Card className="w-96">
		<CardHeader>
			<CardTitle className="text-2xl">{dict.tenant.passwordResetRequest.title}</CardTitle>
			<CardDescription>
				{dict.tenant.passwordResetRequest.description}
			</CardDescription>
		</CardHeader>
		<CardContent>
			<div className="flex flex-col items-center justify-center gap-4">
				<MailIcon className="text-gray-300 w-16 h-16" />
				<div className="text-center">
					An email with password reset instructions has been sent to your email address.
				</div>
				<div className="text-center text-gray-500">
					<Link to="passwordReset"><a className="underline">{dict.tenant.passwordResetRequest.entryCode}</a></Link>
				</div>
			</div>
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

const PasswordlessMagicLinkSentPage = () => {
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
				{showOtp ?  (<>
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
							Enter  manually
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


const PasswordlessMagicLinkPage = () => {
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

const Layout = ({ children }: { children?: React.ReactNode }) => (
	<div className="grid md:grid-cols-2 min-h-screen ">
		<div className="bg-gray-100 p-4 flex items-center justify-center">
			{children}
		</div>
		<div className="bg-gray-700 text-white p-4 flex items-center justify-center">
			<div className="w-full max-w-md">
				<div className="text-center text-2xl">Welcome to your app</div>
				<p className="mt-8 text-center text-gray-300">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec auctor, sem eget ultricies ultricies, sapien urna tristique eros, ac tincidunt felis lacus nec nunc.</p>
			</div>
		</div>
	</div>
)


errorHandler(onRecoverableError => createRoot(rootEl, { onRecoverableError }).render(<>
	<ContemberClient
		apiBaseUrl={import.meta.env.VITE_CONTEMBER_ADMIN_API_BASE_URL}
		loginToken={import.meta.env.VITE_CONTEMBER_ADMIN_LOGIN_TOKEN}
	>
		<RoutingProvider pageInQuery>
			<Toaster>
				<Pages
					layout={Layout}
					children={{
						index: IndexPage,
						resetRequest: PasswordResetRequestPage,
						resetRequestSuccess: PasswordResetRequestSuccessPage,
						passwordReset: PasswordResetPage,
						magicLinkSent: PasswordlessMagicLinkSentPage,
						magicLink: PasswordlessMagicLinkPage,
					}}
				/>
			</Toaster>
		</RoutingProvider>

	</ContemberClient>
</>))

