import { DialogProvider, Portal, Scheme, HoveringToolbar as UIToolbar } from '@contember/ui'
import { ReactElement, memo } from 'react'
import { useToolbarState } from '../editorSelection'
import { HoveringToolbarContents, HoveringToolbarContentsProps } from './HoveringToolbarContents'

export interface HoveringToolbarsProps {
	shouldDisplayInlineToolbar?: () => boolean
	inlineButtons?: HoveringToolbarContentsProps['buttons']
	showLabels?: HoveringToolbarContentsProps['showLabels']
	blockButtons?: HoveringToolbarContentsProps['buttons'] | ReactElement // TODO this is NASTY
	toolbarScheme?: Scheme
}

export const HoveringToolbars = memo(({
	blockButtons,
	inlineButtons,
	shouldDisplayInlineToolbar: shouldDisplayInlineToolbarProp,
	showLabels,
	toolbarScheme,
	...props
}: HoveringToolbarsProps) => {
	if (import.meta.env.DEV) {
		const __exhaustiveCheck: Record<string, never> = props
	}

	const { inlineToolbarRef, blockToolbarActive, inlineToolbarActive } = useToolbarState()

	const shouldDisplayInlineToolbar =
		inlineToolbarActive && (shouldDisplayInlineToolbarProp === undefined || shouldDisplayInlineToolbarProp())

	return (
		<DialogProvider>
			<Portal>
				{inlineButtons && (
					<UIToolbar scheme={toolbarScheme} isActive={shouldDisplayInlineToolbar} ref={inlineToolbarRef} scope="contextual">
						<HoveringToolbarContents buttons={inlineButtons} showLabels={showLabels} />
					</UIToolbar>
				)}
			</Portal>
			{blockButtons && (
				<UIToolbar scheme={toolbarScheme} isActive={blockToolbarActive}>
					{Array.isArray(blockButtons) && <HoveringToolbarContents buttons={blockButtons} showLabels={showLabels} />}
					{Array.isArray(blockButtons) || blockButtons}
				</UIToolbar>
			)}
		</DialogProvider>
	)
})
