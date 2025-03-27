import { CircleAlert } from 'lucide-react'
import { dict } from '~/lib/dict'
import { Button } from '~/lib/ui/button'
import { Card, CardContent } from '~/lib/ui/card'
import { Loader } from '~/lib/ui/loader'
import { Overlay } from '~/lib/ui/overlay'
import { Login } from '../components/login'
import { LoggedIn } from '../components/logged-in'
import { useLoginConfig } from '../contexts/login'
import { IdentityProvider, IdentityState, LogoutTrigger } from '@contember/react-identity'

export default () => {
	const entrypointConfig = useLoginConfig()

	return (
		<IdentityProvider>
			<IdentityState state={['none', 'cleared']}>
				<Login
					appUrl={entrypointConfig.appUrl}
					hasTokenFromEnv={entrypointConfig.hasTokenFromEnv}
					idps={entrypointConfig.idps}
					magicLink={entrypointConfig.magicLink}
				/>
			</IdentityState>
			<IdentityState state="success">
				<LoggedIn appUrl={entrypointConfig.appUrl} />
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
