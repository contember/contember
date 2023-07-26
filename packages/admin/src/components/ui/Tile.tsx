import { Box, BoxOwnProps } from '@contember/ui'
import { memo } from 'react'

export type TileProps = BoxOwnProps

/**
 * @group UI
 */
export const Tile = memo<TileProps>(({ children, ...props }) => (
	<div className="tile">
		<Box {...props}>{children}</Box>
	</div>
))
