import cn from 'classnames'
import { useLayoutEffect, useMemo, useState } from 'react'
import { useClassNamePrefix, useCloseOnClickOutside, useCloseOnEscape } from '../../auxiliary'
import { toEnumViewClass } from '../../utils'
import { Box } from '../Box'
import type { DialogSettingsWithMetadata } from './dialogReducer'

export interface DialogProps {
	dialogId: number
	settings: DialogSettingsWithMetadata<unknown>
}

export const Dialog = (props: DialogProps) => {
	const prefix = useClassNamePrefix()
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
		<div className={cn(`${prefix}dialog`, toEnumViewClass(type))} ref={setOverlayElement}>
			<div className={`${prefix}dialog-in`} ref={setContentElement}>
				{bare ? renderedContent : <Box gap={gap} heading={heading}>{renderedContent}</Box>}
			</div>
		</div>
	)
}
