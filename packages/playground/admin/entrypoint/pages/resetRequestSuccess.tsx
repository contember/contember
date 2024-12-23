import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '~/lib/ui/card'
import { dict } from '~/lib/dict'
import { MailIcon } from 'lucide-react'
import { AnchorButton } from '~/lib/ui/button'
import { Link } from '@contember/interface'

export default () => (
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
