import { Button } from '@contember/react-ui-lib-base'
import { CenteredScreen, MessageCard } from './screens.js'
import { useSignOut } from './signOut.js'

/**
 * A denial is an ordinary state, not an error: no error styling, and no hint about what is behind
 * the door. Keep the session until the user chooses another account, so the message remains stable.
 */
export const AccessDeniedScreen = ({ onSignInAgain }: { onSignInAgain: () => void }) => {
	const signOut = useSignOut()
	const signInAgain = async () => {
		await signOut()
		onSignInAgain()
	}

	return (
		<CenteredScreen>
			<MessageCard
				title="No access"
				description="This account does not have access to the management panel."
			>
				<Button className="w-full" onClick={signInAgain}>Sign in with another account</Button>
			</MessageCard>
		</CenteredScreen>
	)
}
