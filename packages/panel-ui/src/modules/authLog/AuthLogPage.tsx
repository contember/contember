import { AuthLogList } from '@contember/react-ui-lib-tenant'
import { PageHeader, PageStack, PanelSection } from '../../shell/screens.js'
import { PanelSlots } from '../../shell/slots.js'

/**
 * The tenant authentication audit log — sign-ins, MFA changes, invites, everything
 * `logAuthAction` records.
 *
 * `authLog` rejects rather than returning an empty page, so a caller without
 * `system:viewAuthLog` gets the list's own "no permission" line; nothing to handle here.
 */
export const AuthLogPage = () => (
	<PageStack>
		<PanelSlots.Title>Auth log</PanelSlots.Title>
		<PageHeader
			title="Auth log"
			description="Every authentication event the tenant recorded: sign-ins and their failures, MFA changes, invitations, password and e-mail changes."
		/>
		<PanelSection>
			<AuthLogList />
		</PanelSection>
	</PageStack>
)
