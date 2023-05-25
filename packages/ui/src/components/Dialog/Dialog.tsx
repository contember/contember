import { useClassNameFactory } from '@contember/utilities'
import { useLayoutEffect, useMemo, useState } from 'react'
import { useCloseOnClickOutside, useCloseOnEscape } from '../../auxiliary'
import { toEnumViewClass } from '../../utils'
import { Box } from '../Box'
import type { DialogSettingsWithMetadata } from './dialogReducer'

export interface DialogProps {
	dialogId: number
	settings: DialogSettingsWithMetadata<unknown>
}

export const Dialog = (props: DialogProps) => {
	const componentClassName = useClassNameFactory('dialog')
	const [contentElement, setContentElement] = useState<HTMLDivElement | null>(null)
	const [overlayElement, setOverlayElement] = useState<HTMLDivElement | null>(null)
	const {
		resolve,
		settings: { content: RenderContent, bare, gap = 'default', heading, type },
	} = props.settings

	useCloseOnEscape({ isOpen: true, close: resolve })
	useCloseOnClickOutside({ isOpen: true, close: resolve, contents: useMemo(() => [contentElement], [contentElement]), outside: overlayElement })
	useLayoutEffect(() => {
		if (!contentElement) {
			return
		}
		contentElement.focus()
	}, [contentElement])

	const renderedContent = <RenderContent resolve={resolve} />

	return (
		<div className={componentClassName('', toEnumViewClass(type))} ref={setOverlayElement}>
			<div className={componentClassName('in')} ref={setContentElement}>
				{bare ? renderedContent : <Box gap={gap} heading={heading}>{renderedContent}</Box>}
			</div>
		</div>
	)
}
