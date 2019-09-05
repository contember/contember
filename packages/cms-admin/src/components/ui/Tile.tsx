import { Box, BoxProps } from '@contember/ui'
import * as React from 'react'

export interface TileProps extends BoxProps {}

export const Tile = React.memo<TileProps>(({ children, ...props }) => (
	<div className="tile">
		<Box {...props}>{children}</Box>
	</div>
))
