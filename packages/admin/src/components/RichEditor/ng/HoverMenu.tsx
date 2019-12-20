import * as React from 'react'
import { useEffect, useState } from 'react'
import { Selection } from 'slate'

export interface HoverMenuProps {
	selection: Selection | undefined
	children: React.ReactNode
}

export const HoverMenu: React.FC<HoverMenuProps> = ({ selection, children }) => {
	const [position, setPosition] = useState<null | { x: number; y: number }>(null)
	useEffect(() => {
		const nativeSelection = window.getSelection()
		if (
			selection &&
			selection.isFocused &&
			selection.isExpanded &&
			nativeSelection !== null &&
			nativeSelection.rangeCount > 0
		) {
			const range = nativeSelection.getRangeAt(0)
			const rect = range.getBoundingClientRect()
			const top = rect.top
			const centerFromLeft = rect.left + rect.width / 2
			setPosition({
				x: centerFromLeft,
				y: top,
			})
		} else {
			setPosition(null)
		}
	}, [selection])

	return (
		position && (
			<div
				className="hoverMenu"
				style={{
					transform: `translate(${position.x}px, ${position.y}px) translate(-50%, -110%)`,
				}}
			>
				{children}
			</div>
		)
	)
}
