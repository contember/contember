import { AnchorButton, Button, ButtonGroup, Message } from '@contember/ui'
import { LogoutLink } from '../LogoutLink'
import { MiscPageLayout } from '../MiscPageLayout'

export const InvalidIdentityFallback = () => {
	return (
		<MiscPageLayout>
			<Message intent="danger" size="large" padding="large" display="block">Failed to fetch an identity</Message>
			<ButtonGroup direction="vertical">
				<AnchorButton href={window.location.href}>Reload</AnchorButton>
				<LogoutLink Component={Button}>Login again</LogoutLink>
			</ButtonGroup>
		</MiscPageLayout>
	)
}
