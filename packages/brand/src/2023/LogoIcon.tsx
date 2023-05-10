import { useExpectSameValueReference } from '@contember/react-utils'
import { listClassName, svgSizeProps } from '@contember/utilities'
import { CSSProperties, memo, useMemo } from 'react'
import type { ContemberIdentitySvgProps } from '../Types'

export const LogoIcon = memo<Omit<ContemberIdentitySvgProps, 'strokeWidth'>>(({
	className,
	color = 'currentColor',
	crop = 11.5,
	height = 130,
	scale,
	style,
	width = 130,
	...rest
}) => {
	useExpectSameValueReference(style)

	if (import.meta.env.DEV) {
		const exhaustiveCheck: Record<PropertyKey, never> = rest
	}

	const sizeProps = svgSizeProps(width, height, crop)
	const aspectRatio = sizeProps.width / sizeProps.height

	return (
		<svg
			className={listClassName(['cui-brand-icon', 'cui-brand-logo-icon', className])}
			style={useMemo(() => ({
				'--scale': scale,
				'--aspect-ratio': aspectRatio === 1 ? undefined : aspectRatio,
				...style,
			} as CSSProperties), [aspectRatio, scale, style])}
			xmlns="http://www.w3.org/2000/svg"
			{...sizeProps}
		>
			<path fill={color} stroke="none" d="m110.039 69.7858-7.826-6.2519-10.0266 8.113c-7.7194 6.2518-14.6757 13.4433-20.7092 21.3936l-5.9093 7.8055-6.1401-7.9681c-6.6191-8.6008-14.232-16.3524-22.679-23.0921l-7.8258-6.2519 4.6494-3.7041c10.5586-8.4202 20.0703-18.1052 28.3398-28.8562l3.6379-4.7341 2.8216 3.65c8.8196 11.4557 18.9701 21.7911 30.2387 30.7895l3.5846 2.873 4.649-3.7042c2.946-2.3489 5.821-4.8244 8.607-7.3721-4.987-23.4174-25.4118-40.9443-49.8831-40.9443-28.198 0-51.0722 23.2909-51.0722 52.0025s22.8742 52.0021 51.0722 52.0021c24.5423 0 45.0381-17.6349 49.9361-41.1246-1.792-1.59-3.602-3.144-5.483-4.6256z" />
		</svg>
	)
})
LogoIcon.displayName = 'LogoIcon'
