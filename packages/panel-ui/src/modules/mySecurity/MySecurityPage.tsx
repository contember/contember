import { ChangeMyPasswordForm, ChangeMyProfileForm, useIdentity } from '@contember/react-client-tenant'
import { Separator, ToastContent, useShowToast } from '@contember/react-ui-lib-base'
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
import { formClassName, PageHeader, PageStack, SettingsRow, SettingsStack } from '../../shell/screens.js'
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

const Password = () => {
	const showToast = useShowToast()

	return (
		<ChangeMyPasswordForm onSuccess={() => showToast(<ToastContent>Password changed</ToastContent>, { type: 'success' })}>
			<form className={formClassName}>
				<ChangeMyPasswordFormFields />
			</form>
		</ChangeMyPasswordForm>
	)
}

/** The three MFA methods read as one setting, so they share a row instead of each owning a card. */
const TwoFactor = () => (
	<div className="flex flex-col gap-6">
		<div className="flex flex-col gap-3">
			<h3 className="text-sm font-medium text-muted-foreground">Authenticator app</h3>
			<OtpSetup />
		</div>
		<Separator />
		<div className="flex flex-col gap-3">
			<h3 className="text-sm font-medium text-muted-foreground">E-mail code</h3>
			<EmailOtpSetup />
		</div>
		<Separator />
		<div className="flex flex-col gap-3">
			<h3 className="text-sm font-medium text-muted-foreground">Backup codes</h3>
			<BackupCodes />
		</div>
	</div>
)

/**
 * The signed-in person's own account. Everything here is a `me`-scoped tenant call, so it works for
 * anyone the panel gate let in.
 *
 * The identity-provider section only lists and disconnects: connecting one is a redirect flow whose
 * callback URL belongs to the public-facing app, not to the API host.
 */
export const MySecurityPage = () => (
	<PageStack>
		<PanelSlots.Title>My security</PanelSlots.Title>
		<PageHeader title="My security" description="Your own account: how you sign in, what protects it, and where it is currently signed in." />
		<SettingsStack>
			<SettingsRow
				title="Profile"
				description="With e-mail-change verification enabled, a new address only takes effect once the link mailed to it is opened."
			>
				<Profile />
			</SettingsRow>

			<SettingsRow title="Password" description="Changing it does not sign your other sessions out — revoke them below if that is what you want.">
				<Password />
			</SettingsRow>

			<SettingsRow
				title="Two-factor authentication"
				description="An authenticator app and an e-mail code are independent; either one satisfies a policy that requires MFA. Backup codes are the way back in when both are unavailable."
			>
				<TwoFactor />
			</SettingsRow>

			<SettingsRow title="Passwordless sign-in" description="Sign in with a link or code mailed to your address instead of a password.">
				<PasswordlessToggle />
			</SettingsRow>

			<SettingsRow
				title="Connected identity providers"
				description="External accounts that can sign in as you. Connecting one starts in the public-facing app; here you can only see and disconnect them."
			>
				<IdentityProviderConnections />
			</SettingsRow>

			<SettingsRow title="Active sessions" description="Every device holding a valid session token for this account.">
				<SessionList />
			</SettingsRow>
		</SettingsStack>
	</PageStack>
)
