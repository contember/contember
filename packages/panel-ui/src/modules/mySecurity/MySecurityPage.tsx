import { ChangeMyPasswordForm, ChangeMyProfileForm, useIdentity } from '@contember/react-client-tenant'
import { ToastContent, useShowToast } from '@contember/react-ui-lib-base'
import {
	BackupCodes,
	ChangeMyPasswordFormFields,
	ChangeMyProfileFormFields,
	EmailOtpSetup,
	IdentityProviderConnections,
	OtpSetup,
	PasswordlessToggle,
	SessionList,
} from '@contember/react-ui-lib-tenant'
import { formClassName, PageStack, PanelSection } from '../../shell/screens.js'
import { PanelSlots } from '../../shell/slots.js'

const Profile = () => {
	const person = useIdentity()?.person
	const showToast = useShowToast()

	return (
		<ChangeMyProfileForm
			// keyed on the loaded values: TenantForm snapshots initialValues on mount, so the identity
			// refresh that follows a successful change would otherwise leave the old ones on screen
			key={`${person?.email ?? ''} ${person?.name ?? ''}`}
			initialValues={{ email: person?.email ?? '', name: person?.name ?? '' }}
			onSuccess={() => showToast(<ToastContent>Profile saved</ToastContent>, { type: 'success' })}
		>
			<form className={formClassName}>
				<ChangeMyProfileFormFields />
			</form>
		</ChangeMyProfileForm>
	)
}

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
				<PanelSection
					title="Profile"
					description="With e-mail-change verification enabled, a new address only takes effect once the link mailed to it is opened."
				>
					<Profile />
				</PanelSection>

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
