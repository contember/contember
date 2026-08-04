import { ChangeMyPasswordForm } from '@contember/react-client-tenant'
import { ToastContent, useShowToast } from '@contember/react-ui-lib-base'
import {
	BackupCodes,
	ChangeMyPasswordFormFields,
	EmailOtpSetup,
	IdentityProviderConnections,
	OtpSetup,
	PasswordlessToggle,
	SessionList,
} from '@contember/react-ui-lib-tenant'
import { formClassName, PageStack, PanelSection } from '../../shell/screens.js'
import { PanelSlots } from '../../shell/slots.js'

/**
 * The signed-in person's own security settings. Everything here is a `me`-scoped tenant call, so it
 * works for anyone the panel gate let in.
 *
 * The identity-provider section only lists and disconnects: connecting one is a redirect flow whose
 * callback URL belongs to the public-facing app, not to the API host.
 */
export const MySecurityPage = () => {
	const showToast = useShowToast()

	return (
		<>
			<PanelSlots.Title>My security</PanelSlots.Title>
			<PageStack>
				<PanelSection title="Change password">
					<ChangeMyPasswordForm onSuccess={() => showToast(<ToastContent>Password changed</ToastContent>, { type: 'success' })}>
						<form className={formClassName}>
							<ChangeMyPasswordFormFields />
						</form>
					</ChangeMyPasswordForm>
				</PanelSection>

				<PanelSection title="Two-factor — authenticator app">
					<OtpSetup />
				</PanelSection>

				<PanelSection title="Two-factor — e-mail code">
					<EmailOtpSetup />
				</PanelSection>

				<PanelSection title="Backup codes">
					<BackupCodes />
				</PanelSection>

				<PanelSection title="Passwordless sign-in">
					<PasswordlessToggle />
				</PanelSection>

				<PanelSection title="Connected identity providers">
					<IdentityProviderConnections />
				</PanelSection>

				<PanelSection title="Active sessions">
					<SessionList />
				</PanelSection>
			</PageStack>
		</>
	)
}
