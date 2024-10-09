import { Loader } from '@app/lib/ui/loader'
import { Overlay } from '@app/lib/ui/overlay'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@app/lib/ui/card'
import { CircleAlert } from 'lucide-react'
import { dict } from '@app/lib/dict'
import { Button } from '@app/lib/ui/button'
import { useEffect } from 'react'
import { IdentityProvider, IdentityState, LogoutTrigger, useIdentity } from '@contember/interface'
import { Login } from '@app/entrypoint/components/login'
import { entrypointConfig } from '@app/entrypoint/config'

export default () => {
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

const LoggedIn = () => {
	const identity = useIdentity()
	useEffect(() => {
		setTimeout(() => {
			window.location.href = entrypointConfig.appUrl
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


