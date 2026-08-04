import { AuthPolicyList, IdentityProviderList, MailTemplateList, TenantConfigView } from '@contember/react-ui-lib-tenant'
import { PageStack, PanelSection } from '../../shell/screens.js'
import { PanelSlots } from '../../shell/slots.js'

/**
 * Read-only on purpose: `contember tenant:apply` is the write path, and each view says so itself.
 *
 * These four queries reject rather than return an empty result, so a caller without the permission
 * gets a "no permission" line from `renderConfigQueryState` — nothing to handle here.
 */
export const ConfigurationPage = () => (
	<>
		<PanelSlots.Title>Configuration</PanelSlots.Title>
		<PageStack>
			<PanelSection title="Tenant settings">
				<TenantConfigView />
			</PanelSection>

			<PanelSection title="Auth policies">
				<AuthPolicyList />
			</PanelSection>

			<PanelSection title="Identity providers">
				<IdentityProviderList />
			</PanelSection>

			<PanelSection title="Mail templates">
				<MailTemplateList />
			</PanelSection>
		</PageStack>
	</>
)
