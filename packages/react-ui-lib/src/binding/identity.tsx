import { IdentityState, LogoutTrigger } from '@contember/react-identity'
import { Loader } from '../ui/loader'
import { dict } from '../dict'
import { Button } from '../ui/button'
import { Card, CardContent } from '../ui/card'
import { CircleAlert } from 'lucide-react'
import { useEffect } from 'react'

export const IdentityLoader = ({ children }: {
	children: React.ReactNode
}) => {
	return <>
		<IdentityState state={['loading']}>
			<Loader />
		</IdentityState>
		<IdentityState state={['none', 'cleared']}>
			<Redirect />
		</IdentityState>
		<IdentityState state={'failed'}>
			<div className="flex justify-center items-center h-screen bg-gray-100">
				<Card className="w-72">
					<CardContent className="flex flex-col items-center gap-2">
						<CircleAlert className="h-12 w-12 text-destructive" />
						<p className="text-center text-lg text-gray-600">
							{dict.identityLoader.fail}
						</p>
						<div className="flex gap-2">
							<Button onClick={() => window.location.reload()} variant="secondary">Try reload</Button>
							<LogoutTrigger>
								<Button>Login again</Button>
							</LogoutTrigger>
						</div>
					</CardContent>
				</Card>

			</div>
		</IdentityState>
		<IdentityState state={'success'}>
			{children}
		</IdentityState>
	</>
}

const Redirect = () => {
	useEffect(() => {
		const backlink = window.location.pathname + window.location.search
		window.location.href = `/?backlink=${encodeURIComponent(backlink)}` // redirect to login with backlink
	})
	return null
}
