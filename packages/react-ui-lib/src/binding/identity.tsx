import { IdentityState, LogoutTrigger } from '@contember/react-identity'
import { CircleAlert } from 'lucide-react'
import { ReactNode, useEffect } from 'react'
import { dict } from '../dict'
import { Button } from '../ui/button'
import { Card, CardContent } from '../ui/card'
import { Loader } from '../ui/loader'

/**
 * Props for {@link IdentityLoader} component.
 */
export type IdentityLoaderProps = {
	/**
	 * The content to be wrapped by the IdentityLoader component
	 */
	children: ReactNode
}

const Redirect = () => {
	useEffect(() => {
		const backlink = window.location.pathname + window.location.search
		window.location.href = `/?backlink=${encodeURIComponent(backlink)}`
	})

	return null
}

/**
 * Props {@link IdentityLoaderProps}.
 *
 * `IdentityLoader` component manages the loading state of user identity and renders appropriate UI based on state.
 *
 * This component handles different identity states, such as loading, failure, and successful authentication,
 * ensuring a smooth user experience.
 *
 * #### Example: Wrapping an authenticated component
 * ```tsx
 * <IdentityLoader>
 *   <Dashboard />
 * </IdentityLoader>
 * ```
 */
export const IdentityLoader = ({ children }: IdentityLoaderProps) => (
	<>
		<IdentityState state={['loading']}>
			<Loader />
		</IdentityState>

		<IdentityState state={['none', 'cleared']}>
			<Redirect />
		</IdentityState>

		<IdentityState state="failed">
			<div className="flex justify-center items-center h-screen bg-gray-100">
				<Card className="w-72">
					<CardContent className="flex flex-col items-center gap-2">
						<CircleAlert className="h-12 w-12 text-destructive" />
						<p className="text-center text-lg text-gray-600">
							{dict.identityLoader.fail}
						</p>
						<div className="flex gap-2">
							<Button onClick={() => window.location.reload()} variant="secondary">{dict.identityLoader.tryReload}</Button>
							<LogoutTrigger>
								<Button>{dict.identityLoader.loginAgain}</Button>
							</LogoutTrigger>
						</div>
					</CardContent>
				</Card>
			</div>
		</IdentityState>

		<IdentityState state="success">
			{children}
		</IdentityState>
	</>
)
