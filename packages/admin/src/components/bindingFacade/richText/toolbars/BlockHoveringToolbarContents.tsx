import { Button, ButtonGroup, Icon } from '@contember/ui'
import * as React from 'react'

export interface BlockHoveringToolbarContentsProps {}

export const BlockHoveringToolbarContents = React.memo((props: BlockHoveringToolbarContentsProps) => {
	return (
		// TODO
		<ButtonGroup size="large">
			<Button size="large">
				<Icon blueprintIcon="media" />
			</Button>
			<Button size="large">
				<Icon blueprintIcon="properties" />
			</Button>
			<Button size="large">
				<Icon blueprintIcon="numbered-list" />
			</Button>
		</ButtonGroup>
	)
})
BlockHoveringToolbarContents.displayName = 'BlockHoveringToolbarContents'
