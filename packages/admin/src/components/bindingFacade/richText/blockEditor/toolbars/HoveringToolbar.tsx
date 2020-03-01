import { HoveringToolbar as UIToolbar, Portal } from '@contember/ui'
import * as React from 'react'
import { useToolbarState } from '../../editorSelection'
import { BlockHoveringToolbarContents, BlockHoveringToolbarContentsProps } from './BlockHoveringToolbarContents'
import { InlineHoveringToolbarContents } from './InlineHoveringToolbarContents'

export interface HoveringToolbarProps extends BlockHoveringToolbarContentsProps {}

export const HoveringToolbar = React.memo((props: HoveringToolbarProps) => {
	const { inlineToolbarRef, blockToolbarActive, inlineToolbarActive } = useToolbarState()

	return (
		<>
			<Portal>
				<UIToolbar isActive={inlineToolbarActive} ref={inlineToolbarRef} scope="contextual">
					<InlineHoveringToolbarContents />
				</UIToolbar>
			</Portal>
			<UIToolbar isActive={blockToolbarActive}>
				<BlockHoveringToolbarContents blockButtons={props.blockButtons} />
			</UIToolbar>
		</>
	)
})
HoveringToolbar.displayName = 'HoveringToolbar'
