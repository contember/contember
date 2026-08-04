import { DisableMyPasswordlessTrigger, EnableMyPasswordlessTrigger, useIdentity } from '@contember/interface'
import { Button } from '@contember/react-ui-lib-base'
import { ToastContent, useShowToast } from '@contember/react-ui-lib-base'
import { dict } from '../dict.js'
import { actionErrorMessage } from '../errors.js'

export const PasswordlessToggle = () => {
	const identity = useIdentity()
	const showToast = useShowToast()

	const onError = ({ code }: { code: string }) => {
		showToast(<ToastContent>{actionErrorMessage(code, dict.tenant.passwordlessToggle.toggleFailed)}</ToastContent>, { type: 'error' })
	}

	const person = identity?.person
	if (!person) {
		return null
	}

	if (person.passwordlessEnabled) {
		return (
			<>
				<p>{dict.tenant.passwordlessToggle.descriptionEnabled}</p>
				<DisableMyPasswordlessTrigger
					onSuccess={() => {
						showToast(<ToastContent>{dict.tenant.passwordlessToggle.disabledSuccess}</ToastContent>, { type: 'success' })
					}}
					onError={onError}
				>
					<Button variant="destructive">{dict.tenant.passwordlessToggle.disable}</Button>
				</DisableMyPasswordlessTrigger>
			</>
		)
	}

	return (
		<>
			<p>{dict.tenant.passwordlessToggle.descriptionDisabled}</p>
			<EnableMyPasswordlessTrigger
				onSuccess={() => {
					showToast(<ToastContent>{dict.tenant.passwordlessToggle.enabledSuccess}</ToastContent>, { type: 'success' })
				}}
				onError={onError}
			>
				<Button>{dict.tenant.passwordlessToggle.enable}</Button>
			</EnableMyPasswordlessTrigger>
		</>
	)
}
