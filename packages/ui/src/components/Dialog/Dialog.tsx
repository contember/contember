import cn from 'classnames'
import { useLayoutEffect, useState } from 'react'
import { useClassNamePrefix, useRawCloseOnEscapeOrClickOutside } from '../../auxiliary'
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

	useRawCloseOnEscapeOrClickOutside<HTMLElement, HTMLElement>({
		isOpen: true,
		close: () => {
			reject()
		},
		content: contentElement,
		reference: null,
	})

	useLayoutEffect(() => {
		if (!contentElement) {
			return
		}
		contentElement.focus()
	}, [contentElement])

	const {
		reject,
		resolve,
		settings: { content: RenderContent, bare, gap = 'default', heading, type },
	} = props.settings

	const renderedContent = <RenderContent resolve={resolve} reject={reject} />

	return (
		<div className={cn(`${prefix}dialog`, toEnumViewClass(type))}>
			<div className={`${prefix}dialog-in`} ref={setContentElement}>
				{bare ? renderedContent : <Box gap={gap} heading={heading}>{renderedContent}</Box>}
			</div>
		</div>
	)
}
