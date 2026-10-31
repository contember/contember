import { useIdentity } from '@contember/react-client-tenant'
import {
	AuthPolicyList,
	IdentityProviderList,
	MailTemplateList,
	TenantConfigView,
	WorkloadIdentityTokenCheck,
	WorkloadIdentityTrustList,
} from '@contember/react-ui-lib-tenant'
import { PageHeader, PageStack, SettingsRow, SettingsStack } from '../../shell/screens.js'
import { PanelSlots } from '../../shell/slots.js'

/**
 * Read-only on purpose: `contember tenant:apply` is the write path, and each view says so itself.
 *
 * These queries reject rather than return an empty result, so a caller without the permission
 * gets a "no permission" line from `renderConfigQueryState` — nothing to handle here. Workload
 * identities are hidden instead: the token check is a form, and offering one that will be refused helps nobody.
 */
export const ConfigurationPage = () => {
	const canListWorkloadIdentities = useIdentity()?.permissions.canListWorkloadIdentities === true

	return (
		<PageStack>
			<PanelSlots.Title>Configuration</PanelSlots.Title>
			<PageHeader
				title="Configuration"
				description="How this tenant behaves — sign-up, e-mail changes, passwordless, MFA policy, identity providers, workload identities and mail templates. Read-only here; the write path is contember tenant:apply."
			/>
			<SettingsStack>
				<SettingsRow title="Tenant settings" description="Sign-up, e-mail verification, passwordless and the panel's own access policy.">
					<TenantConfigView />
				</SettingsRow>

				<SettingsRow
					title="Auth policies"
					description="Per-role MFA and session rules. With nothing configured, MFA enforcement is inert and sign-in behaves as it always has."
				>
					<AuthPolicyList />
				</SettingsRow>

				<SettingsRow title="Identity providers" description="External sign-in providers configured for this tenant.">
					<IdentityProviderList />
				</SettingsRow>

				{canListWorkloadIdentities && (
					<>
						<SettingsRow
							title="Workload identities"
							description="Trusted external token issuers — CI runners, Kubernetes, backends — whose tokens are accepted instead of a stored API key."
						>
							<WorkloadIdentityTrustList />
						</SettingsRow>

						<SettingsRow
							title="Check a workload token"
							description="Runs the verification on a token you hold and shows the first failing step, which the API's uniform 401 does not reveal."
						>
							<WorkloadIdentityTokenCheck />
						</SettingsRow>
					</>
				)}

				<SettingsRow title="Mail templates" description="Overrides for the transactional mail the tenant sends — invitations, resets, verification.">
					<MailTemplateList />
				</SettingsRow>
			</SettingsStack>
		</PageStack>
	)
}
