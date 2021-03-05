import { HoveringToolbar as UIToolbar, Portal } from '@contember/ui'
import {
	ReactNode,
	ComponentType,
	ReactElement,
	memo,
	useCallback,
	useMemo,
	useRef,
	useState,
	FC,
	FunctionComponent,
	Fragment,
	PureComponent,
	useEffect,
} from 'react'
import { useToolbarState } from '../editorSelection'
import { HoveringToolbarContents, HoveringToolbarContentsProps } from './HoveringToolbarContents'

export interface HoveringToolbarsProps {
	shouldDisplayInlineToolbar?: () => boolean
	inlineButtons?: HoveringToolbarContentsProps['buttons']
	blockButtons?: HoveringToolbarContentsProps['buttons'] | ReactElement // TODO this is NASTY
}

export const HoveringToolbars = memo((props: HoveringToolbarsProps) => {
	const { inlineToolbarRef, blockToolbarActive, inlineToolbarActive } = useToolbarState()

	const shouldDisplayInlineToolbar =
		inlineToolbarActive && (props.shouldDisplayInlineToolbar === undefined || props.shouldDisplayInlineToolbar())

	return (
		<>
			<Portal>
				{props.inlineButtons && (
					<UIToolbar isActive={shouldDisplayInlineToolbar} ref={inlineToolbarRef} scope="contextual">
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
