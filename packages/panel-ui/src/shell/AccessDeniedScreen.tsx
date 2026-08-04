import { useEffect, useRef } from 'react'
import { CenteredScreen, MessageCard } from './screens.js'
import { useSignOut } from './signOut.js'

/**
 * A denial is an ordinary state, not an error: no error styling, and no hint about what is behind
 * the door. The session is dropped straight away, because it is of no use here.
 */
export const AccessDeniedScreen = () => {
	const signOut = useSignOut()
	const signedOut = useRef(false)

	useEffect(() => {
		// The sign-out itself is denied too, so guard against a second round trip.
		if (signedOut.current) {
			return
		}
		signedOut.current = true
		signOut()
	}, [signOut])

	return (
		<CenteredScreen>
			<MessageCard
				title="No access"
				description="This account does not have access to the management panel."
			/>
		</CenteredScreen>
	)
}
