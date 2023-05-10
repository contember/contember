import { useExpectSameValueReference } from '@contember/react-utils'
import { listClassName, svgSizeProps } from '@contember/utilities'
import { CSSProperties, memo, useMemo } from 'react'
import type { ContemberIdentitySvgProps } from '../Types'

export const Document = memo<ContemberIdentitySvgProps>(({
	className,
	color = 'currentColor',
	crop = 10,
	height = 70,
	scale,
	strokeWidth = 6,
	style,
	width = 70,
	...rest
}) => {
	useExpectSameValueReference(style)

	if (import.meta.env.DEV) {
		const exhaustiveCheck: Record<PropertyKey, never> = rest
	}

	return (
		<svg
			className={listClassName(['cui-brand-icon', 'cui-brand-document', className])}
			fill="none"
			style={useMemo(() => ({ ...style, '--scale': scale } as CSSProperties), [scale, style])}
			xmlns="http://www.w3.org/2000/svg"
			{...svgSizeProps(width, height, crop)}
		>
			<path d="m22.0479 15.7488h12.9516l12.9517 11.3884v26.2165h-25.9033z" stroke={color} strokeWidth={strokeWidth} />
		</svg>
	)
})
Document.displayName = 'Document'
