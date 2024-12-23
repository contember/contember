import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '~/lib/ui/card'
import { dict } from '~/lib/dict'
import { PasswordResetRequestFormFields } from '~/lib/tenant'
import { AnchorButton } from '~/lib/ui/button'
import { Link, PasswordResetRequestForm, useRedirect } from '@contember/interface'


export default () => {
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
