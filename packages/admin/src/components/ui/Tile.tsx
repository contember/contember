import { Box, BoxOwnProps } from '@contember/ui'
import * as React from 'react'

export interface TileProps extends BoxOwnProps {}

export const Tile = React.memo<TileProps>(({ children, ...props }) => (
	<div className="tile">
		<Box {...props}>{children}</Box>
	</div>
))
