import './index.css'
import { dict } from '@app/lib/dict'
import { LoginFormFields, PasswordResetRequestFormFields } from '@app/lib/tenant'
import { PasswordResetFormFields } from '@app/lib/tenant'
import { ToastContent, Toaster, useShowToast } from '@app/lib/toast'
import { AnchorButton, Button } from '@app/lib/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@app/lib/ui/card'
import { Loader } from '@app/lib/ui/loader'
import { Overlay } from '@app/lib/ui/overlay'
import { Pages, useIdentity } from '@contember/interface'
import { ContemberClient } from '@contember/react-client'
import { createErrorHandler } from '@contember/react-devbar'
import {
	IDP,
	IDPInitTrigger,
	IDPState,
	IdentityProvider,
	IdentityState,
	LoginForm,
	LogoutTrigger,
	PasswordResetForm,
	PasswordResetRequestForm,
} from '@contember/react-identity'
import { Link, RoutingProvider, useCurrentRequest, useRedirect } from '@contember/react-routing'
import { MailIcon } from 'lucide-react'
import { useEffect } from 'react'
import { createRoot } from 'react-dom/client'

const errorHandler = createErrorHandler((dom, react, onRecoverableError) => createRoot(dom, { onRecoverableError }).render(react))

const rootEl = document.body.appendChild(document.createElement('div'))

// Un-comment this to setup idp sign in
// const Idps = {
// 	google: 'Login with Google',
// }

const hasTokenFromEnv = import.meta.env.VITE_CONTEMBER_ADMIN_SESSION_TOKEN !== '__SESSION_TOKEN__'
const appUrl = '/app'

const Login = () => {
	const showToast = useShowToast()
	return (
		<>
			<IDP
				onInitError={error =>
					showToast(
						<ToastContent>
							{dict.tenant.login.idpInitError} {error}
						</ToastContent>,
						{ type: 'error' },
					)
				}
				onResponseError={error =>
					showToast(
						<ToastContent>
							{dict.tenant.login.idpResponseError} {error}
						</ToastContent>,
						{ type: 'error' },
					)
				}
			>
				<Card className="w-96 relative">
					<CardHeader>
						<CardTitle className="text-2xl">{dict.tenant.login.title}</CardTitle>
						<CardDescription>{dict.tenant.login.description}</CardDescription>
					</CardHeader>
					<CardContent>
						{hasTokenFromEnv && (
							<AnchorButton href={appUrl} size="lg" className="w-full" variant="destructive">
								Continue as default user
							</AnchorButton>
						)}
						<LoginForm>
							<form className="grid gap-4">
								<LoginFormFields />
							</form>
						</LoginForm>

						{/* Un-comment this to setup idp sign in */}
						{/*{Object.entries(Idps).map(([idp, label]) => (*/}
						{/*	<IDPInitTrigger key={idp} identityProvider={idp}>*/}
						{/*		<Button variant="outline" className="w-full">*/}
						{/*			{label}*/}
						{/*		</Button>*/}
						{/*	</IDPInitTrigger>*/}
						{/*))}*/}
					</CardContent>
					<IDPState state={['processing_init', 'processing_response', 'success']}>
						<Loader />
					</IDPState>
				</Card>
			</IDP>
		</>
	)
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
				<CardDescription>as {identity?.person?.email ?? 'unknown'}</CardDescription>
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
						<p className="text-lg">Failed to load identity.</p>
						<LogoutTrigger>
							<Button className="w-full" variant="outline">
								Logout
							</Button>
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
				<CardTitle className="text-2xl">{dict.tenant.passwordResetRequest.title}</CardTitle>
				<CardDescription>{dict.tenant.passwordResetRequest.description}</CardDescription>
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
				<CardDescription>{dict.tenant.passwordReset.description}</CardDescription>
			</CardHeader>
			<CardContent>
				<PasswordResetForm
					onSuccess={() => {
						showToast(<ToastContent>Password has been reset</ToastContent>, { type: 'success' })
						redirect('index')
					}}
					token={token}
				>
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
			<CardDescription>{dict.tenant.passwordResetRequest.description}</CardDescription>
		</CardHeader>
		<CardContent>
			<div className="flex flex-col items-center justify-center gap-4">
				<MailIcon className="text-gray-300 w-16 h-16" />
				<div className="text-center">An email with password reset instructions has been sent to your email address.</div>
				<div className="text-center text-gray-500">
					<Link to="passwordReset">
						<a className="underline">{dict.tenant.passwordResetRequest.entryCode}</a>
					</Link>
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

const Layout = ({ children }: { children?: React.ReactNode }) => (
	<div className="grid md:grid-cols-2 min-h-screen ">
		<div className="bg-gray-100 p-4 flex items-center justify-center">{children}</div>
		<div className="bg-gray-700 text-white p-4 flex items-center justify-center">
			<div className="w-full max-w-md">
				<div className="text-center text-2xl">Welcome to your app</div>
				{/*<p className="mt-8 text-center text-gray-300">*/}
				{/*	Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec auctor, sem eget ultricies ultricies, sapien urna tristique eros, ac*/}
				{/*	tincidunt felis lacus nec nunc.*/}
				{/*</p>*/}
			</div>
		</div>
	</div>
)

errorHandler(onRecoverableError =>
	createRoot(rootEl, { onRecoverableError }).render(
		<>
			<ContemberClient apiBaseUrl={import.meta.env.VITE_CONTEMBER_ADMIN_API_BASE_URL} loginToken={import.meta.env.VITE_CONTEMBER_ADMIN_LOGIN_TOKEN}>
				<RoutingProvider pageInQuery>
					<Toaster>
						<Pages
							layout={Layout}
							children={{
								index: IndexPage,
								resetRequest: PasswordResetRequestPage,
								resetRequestSuccess: PasswordResetRequestSuccessPage,
								passwordReset: PasswordResetPage,
							}}
						/>
					</Toaster>
				</RoutingProvider>
			</ContemberClient>
		</>,
	),
)
