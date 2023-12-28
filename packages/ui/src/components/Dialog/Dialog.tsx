import { useClassNameFactory, useCloseOnClickOutside, useCloseOnEscape } from '@contember/react-utils'
import { useLayoutEffect, useMemo, useState } from 'react'
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
		settings: { bare, content: Content, footer: Footer, gap = true, heading, type },
	} = props.settings

	useCloseOnEscape({ isOpen: true, close: resolve })
	useCloseOnClickOutside({ isOpen: true, close: resolve, contents: useMemo(() => [contentElement], [contentElement]), outside: overlayElement })
	useLayoutEffect(() => {
		if (!contentElement) {
			return
		}
		contentElement.focus()
	}, [contentElement])

	return (
		<div className={componentClassName('', toEnumViewClass(type))} ref={setOverlayElement}>
			<div className={componentClassName('in')} ref={setContentElement}>
				<Box
					border={!bare}
					padding={!bare}
					gap={gap}
					label={heading}
					footer={Footer ? <Footer resolve={resolve} /> : null}
				>
					<Content resolve={resolve} />
				</Box>
			</div>
		</div>
	)
}
