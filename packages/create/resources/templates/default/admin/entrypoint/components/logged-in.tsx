import { useIdentity } from '@contember/react-identity'
import { useEffect } from 'react'
import { Card, CardDescription, CardHeader, CardTitle } from '~/lib/ui/card'
import { Loader } from '~/lib/ui/loader'

/**
* Props for {@link LoggedIn} component
*/
export type LoggedInProps = {
	/**
	 * The URL to redirect to after successful login.
	 */
	appUrl: string
}

/**
 * Props {@link LoggedInProps}
 *
 * `LoggedIn` displays a confirmation UI upon successful login and redirects the user to the specified app URL.
 * Must be used in a context where `useIdentity` is available (e.g., inside a Contember admin interface).
 *
 * #### Example: login redirect screen
 * ```tsx
 * <LoggedIn appUrl="https://admin.example.com/dashboard" />
 * ```
 */
export const LoggedIn = ({ appUrl }: LoggedInProps) => {
	const identity = useIdentity()

	useEffect(() => {
		setTimeout(() => {
			window.location.href = appUrl
		}, 500)
	}, [appUrl])

	return (
		<Card className="w-96 relative">
			<CardHeader>
				<CardTitle className="text-2xl">Logged in</CardTitle>
				<CardDescription>
					as {identity?.person?.email ?? 'unknown'}
				</CardDescription>
			</CardHeader>
			<Loader position="static" />
		</Card>
	)
}
