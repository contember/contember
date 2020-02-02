import { Button, ButtonGroup, Icon } from '@contember/ui'
import * as React from 'react'

export interface BlockHoveringToolbarContentsProps {}

export const BlockHoveringToolbarContents = React.memo((props: BlockHoveringToolbarContentsProps) => {
	return (
		// TODO
		<ButtonGroup>
			<Button>
				<Icon blueprintIcon="media" />
			</Button>
			<Button>
				<Icon blueprintIcon="properties" />
			</Button>
			<Button>
				<Icon blueprintIcon="numbered-list" />
			</Button>
		</ButtonGroup>
	)
})
BlockHoveringToolbarContents.displayName = 'BlockHoveringToolbarContents'
