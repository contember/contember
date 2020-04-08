import { HoveringToolbar as UIToolbar, Portal } from '@contember/ui'
import * as React from 'react'
import { useToolbarState } from '../editorSelection'
import { HoveringToolbarContents, HoveringToolbarContentsProps } from './HoveringToolbarContents'

export interface HoveringToolbarsProps {
	inlineButtons?: HoveringToolbarContentsProps['buttons']
	blockButtons?: HoveringToolbarContentsProps['buttons'] | React.ReactElement // TODO this is NASTY
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
					{Array.isArray(props.blockButtons) && <HoveringToolbarContents buttons={props.blockButtons} />}
					{Array.isArray(props.blockButtons) || props.blockButtons}
				</UIToolbar>
			)}
		</>
	)
})
