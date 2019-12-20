import { Aether, Box, BoxProps } from '@contember/ui'
import * as React from 'react'

export interface MiscPageLayoutProps extends BoxProps {}

export const MiscPageLayout = React.memo<MiscPageLayoutProps>(props => (
	<Aether>
		<div className="centerCard">
			<div className="centerCard-in">
				<Box {...props} />
			</div>
		</div>
	</Aether>
))
MiscPageLayout.displayName = 'MiscPageLayout'
