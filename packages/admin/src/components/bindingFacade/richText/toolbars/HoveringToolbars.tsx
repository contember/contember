import { HoveringToolbar as UIToolbar, Portal } from '@contember/ui'
import * as React from 'react'
import { useToolbarState } from '../editorSelection'
import { HoveringToolbarContents, HoveringToolbarContentsProps } from './HoveringToolbarContents'

export interface HoveringToolbarsProps {
	inlineButtons?: HoveringToolbarContentsProps['buttons']
	blockButtons?: HoveringToolbarContentsProps['buttons']
}

export const HoveringToolbars = React.memo((props: HoveringToolbarsProps) => {
	const { inlineToolbarRef, blockToolbarActive, inlineToolbarActive } = useToolbarState()

	return (
		<>
			<Portal>
				{props.inlineButtons && (
					<UIToolbar isActive={inlineToolbarActive} ref={inlineToolbarRef} scope="contextual">
						<HoveringToolbarContents buttons={props.inlineButtons} />
					</UIToolbar>
				)}
			</Portal>
			{props.blockButtons && (
				<UIToolbar isActive={blockToolbarActive}>
					<HoveringToolbarContents buttons={props.blockButtons} />
				</UIToolbar>
			)}
		</>
	)
})
