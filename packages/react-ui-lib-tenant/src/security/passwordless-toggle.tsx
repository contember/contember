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

	// Both flags come from the server, because the decision needs the tenant policy and reading the
	// configuration is an admin permission. `passwordlessAvailable` is the effective state — the raw
	// opt-in says nothing under an `always`/`never` policy — and `passwordlessSelfManaged` is whether
	// the opt-in decides anything at all, so the toggle is not offered where it would change nothing.
	if (!person.passwordlessSelfManaged) {
		return (
			<p>
				{person.passwordlessAvailable
					? dict.tenant.passwordlessToggle.enforcedEnabled
					: dict.tenant.passwordlessToggle.enforcedDisabled}
			</p>
		)
	}

	if (person.passwordlessAvailable) {
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
