import { Aether, Box, BoxOwnProps } from '@contember/ui'
import { memo } from 'react'

export interface MiscPageLayoutProps extends BoxOwnProps {}

export const MiscPageLayout = memo<MiscPageLayoutProps>(props => (
	<Aether>
		<div className="centerCard">
			<div className="centerCard-in">
				<Box {...props} />
			</div>
		</div>
	</Aether>
))
MiscPageLayout.displayName = 'MiscPageLayout'
