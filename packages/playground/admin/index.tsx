import './index.css'
import { createErrorHandler } from '@contember/react-devbar'
import { createRoot } from 'react-dom/client'
import { LoginFormFields } from './lib/components/tenant/loginForm'
import { ContemberClient } from '@contember/react-client'
import { IdentityProvider, IdentityState, IDP, IDPInitTrigger, IDPState, LoginForm, LogoutTrigger, PasswordResetForm, PasswordResetRequestForm } from '@contember/react-identity'
import { Link, RoutingProvider, useCurrentRequest, useRedirect } from '@contember/react-routing'
import { Pages, useIdentity } from '@contember/interface'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './lib/components/ui/card'
import { AnchorButton, Button } from './lib/components/ui/button'
import { PasswordResetRequestFormFields } from './lib/components/tenant/passwordResetRequestForm'
import { MailIcon } from 'lucide-react'
import { PasswordResetFormFields } from './lib/components/tenant/passwordResetForm'
import { ToastContent, Toaster, useShowToast } from './lib/components/ui/toast'
import { Loader } from './lib/components/ui/loader'
import { Overlay } from './lib/components/ui/overlay'
import { useEffect } from 'react'

const errorHandler = createErrorHandler((dom, react, onRecoverableError) => createRoot(dom, { onRecoverableError }).render(react))

const rootEl = document.body.appendChild(document.createElement('div'))

const Login = () => {
	const showToast = useShowToast()
	return <>
		<IDP
			onInitError={error => showToast(<ToastContent>Failed to initialize IdP login: {error}</ToastContent>, { type: 'error' })}
			onResponseError={error => showToast(<ToastContent>Failed to process IdP response: {error}</ToastContent>, { type: 'error' })}
		>

			<Card className="w-96 relative">
				<CardHeader>
					<CardTitle className="text-2xl">Login</CardTitle>
					<CardDescription>
						Enter your email below to login to your account
					</CardDescription>
				</CardHeader>
				<CardContent>
					<LoginForm>
						<form className="grid gap-4">
							<LoginFormFields />
						</form>
					</LoginForm>

					<IDPInitTrigger identityProvider="google">
						<Button variant="outline" className="w-full">
							Login with Google
						</Button>
					</IDPInitTrigger>
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
			window.location.href = '/app/'
		}, 2000)
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
					<div className="bg-gray-100 flex flex-col gap-4 items-center justify-center p-16 rounded-lg shadow-lg border">
						<p className="text-lg">
							Failed to load identity.
						</p>
						<LogoutTrigger>
							<Button className="w-full" variant="outline">Logout</Button>
						</LogoutTrigger>
					</div>
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
				<CardTitle className="text-2xl">Password reset request</CardTitle>
				<CardDescription>
					Enter your email below to reset your password
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
						Back to login
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
				<CardTitle className="text-2xl">Password reset</CardTitle>
				<CardDescription>
					Enter new password
				</CardDescription>
			</CardHeader>
			<CardContent>
				<PasswordResetForm onSuccess={() => {
					showToast(<ToastContent>Password has been reset</ToastContent>, { type: 'success' })
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
						Back to login
					</AnchorButton>
				</Link>
			</CardFooter>
		</Card>
	)
}

const PasswordResetRequestSuccessPage = () => (
	<Card className="w-96">
		<CardHeader>
			<CardTitle className="text-2xl">Password reset request</CardTitle>
			<CardDescription>
				Password reset link has been sent
			</CardDescription>
		</CardHeader>
		<CardContent>
			<div className="flex flex-col items-center justify-center gap-4">
				<MailIcon className="text-gray-300 w-16 h-16" />
				<div className="text-center">
					Please check you mailbox for instructions on how to reset your password.
				</div>
				<div className="text-center text-gray-500">
					Or <Link to="passwordReset"><a className="underline">entry password reset code</a></Link> directly.
				</div>
			</div>
		</CardContent>
		<CardFooter>
			<Link to="index">
				<AnchorButton variant="link" className="ml-auto">
					Back to login
				</AnchorButton>
			</Link>
		</CardFooter>
	</Card>
)

const Layout = ({ children }: { children?: React.ReactNode }) => (
	<div className="grid md:grid-cols-2 min-h-screen ">
		<div className="bg-gray-100 p-4 flex items-center justify-center">
			{children}
		</div>
		<div className="bg-gray-700 text-white p-4 flex items-center justify-center">
			<div className="w-full max-w-md">
				<div className="text-center text-2xl"></div>
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
						passwordResetSuccess: <div>password reset success</div>,

					}}
				/>
			</Toaster>
		</RoutingProvider>

	</ContemberClient>
</>))

