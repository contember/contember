import { IdentityState, LogoutTrigger } from '@contember/react-identity'
import { CircleAlert } from 'lucide-react'
import { useEffect } from 'react'
import { dict } from '../dict'
import { Button } from '../ui/button'
import { Card, CardContent } from '../ui/card'
import { Loader } from '../ui/loader'

/**
 * IdentityLoader component - Authentication state manager for Contember applications
 *
 * #### Purpose
 * Handles authentication flow and renders appropriate UI for different identity states
 *
 * #### States Handling
 * 1. **Loading**: Shows loading spinner during authentication check
 * 2. **Unauthenticated**: Redirects to login page with return URL
 * 3. **Failed Authentication**: Displays error recovery options
 * 4. **Authenticated**: Renders children content
 *
 * #### Features
 * - Automatic redirect to login page for unauthenticated users
 * - Error recovery UI with reload and re-login options
 * - Maintains return URL (backlink) for post-login navigation
 * - Visual feedback for all authentication states
 *
 * #### Example: Basic usage
 * ```tsx
 * <IdentityLoader>
 *   <ProtectedDashboard />
 * </IdentityLoader>
 * ```
 *
 * #### Security Features
 * - Encodes return URL for safe redirects
 * - Immediate session invalidation on logout
 * - Prevents flash of protected content
 *
 * #### UI Components
 * - Loading spinner during checks
 * - Error card with recovery options
 * - Integrated logout functionality
 */
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
							<Button onClick={() => window.location.reload()} variant="secondary">{dict.identityLoader.tryReload}</Button>
							<LogoutTrigger>
								<Button>{dict.identityLoader.loginAgain}</Button>
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
