import { LoginForm } from '@contember/react-client-tenant'
import { Link, useCurrentRequest } from '@contember/react-routing'
import { AnchorButton, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@contember/react-ui-lib-base'
import { LoginFormFields } from '@contember/react-ui-lib-tenant'
import { BoxIcon } from 'lucide-react'
import { indexPageName, resetRequestPageName } from '../modules/registry.js'
import { CenteredScreen } from './screens.js'

const SignInCard = () => (
	<Card className="relative w-96 max-w-full">
		<CardHeader>
			<span className="mb-2 flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
				<BoxIcon className="size-5" />
			</span>
			<CardTitle className="text-2xl">Contember management</CardTitle>
			<CardDescription>Sign in to manage this installation.</CardDescription>
		</CardHeader>
		<CardContent>
			<LoginForm>
				<form className="grid gap-4">
					<LoginFormFields />
				</form>
			</LoginForm>
		</CardContent>
	</Card>
)

/**
 * The "forgot password" link in `LoginFormFields` lands here. Reset mails link to the public-facing
 * app, so the panel cannot complete a reset on its own — see PANEL-PLAN §7, open decision 5.
 */
const PasswordResetNotice = () => (
	<Card className="w-96 max-w-full">
		<CardHeader>
			<CardTitle className="text-2xl">Password reset</CardTitle>
			<CardDescription>
				Passwords cannot be reset from the management panel. Use your application's sign-in page, or ask an administrator to set a new password with the
				Contember CLI.
			</CardDescription>
		</CardHeader>
		<CardFooter>
			<Link to={indexPageName}>
				<AnchorButton variant="link" className="ml-auto">Back to login</AnchorButton>
			</Link>
		</CardFooter>
	</Card>
)

/**
 * E-mail + password, TOTP and backup codes. IdP buttons and magic links are deliberately absent:
 * their redirect URLs are registered against the public-facing app, not the API host
 * (PANEL-PLAN §4.4).
 */
export const LoginScreen = () => {
	const request = useCurrentRequest()

	return (
		<CenteredScreen>
			{request?.pageName === resetRequestPageName ? <PasswordResetNotice /> : <SignInCard />}
		</CenteredScreen>
	)
}
