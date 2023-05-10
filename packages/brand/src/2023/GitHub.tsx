import { useExpectSameValueReference } from '@contember/react-utils'
import { listClassName, svgSizeProps } from '@contember/utilities'
import { CSSProperties, memo, useMemo } from 'react'
import type { ContemberIdentitySvgProps } from '../Types'

export const GitHub = memo<Omit<ContemberIdentitySvgProps, 'strokeWidth'>>(({
	className,
	color = 'currentColor',
	crop = 10,
	height = 70,
	scale,
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
			className={listClassName(['cui-brand-icon', 'cui-brand-github', className])}
			style={useMemo(() => ({ ...style, '--scale': scale } as CSSProperties), [scale, style])}
			xmlns="http://www.w3.org/2000/svg"
			{...svgSizeProps(width, height, crop)}
		>
			<path fill={color} d="m35.0190712 12c-12.7289245 0-23.0190712 10.5417-23.0190712 23.5831 0 10.4248 6.5931824 19.2491 15.7397787 22.3723 1.1435504.2348 1.5624439-.5074 1.5624439-1.1318 0-.5467-.0377435-2.4207-.0377435-4.3733-6.4032599 1.4059-7.7367328-2.8113-7.7367328-2.8113-1.0291151-2.7331-2.5538155-3.4356-2.5538155-3.4356-2.0957729-1.4447.1526809-1.4447.1526809-1.4447 2.324744.1562 3.544685 2.4208 3.544685 2.4208 2.0576278 3.5918 5.3733417 2.5769 6.7072162 1.9521.1904244-1.5228.8005455-2.577 1.4484101-3.1625-5.1071289-.5467-10.4804707-2.577-10.4804707-11.6356 0-2.577.9140774-4.6853 2.3624876-6.325-.2284692-.5856-1.0290147-3.0068.2290715-6.2474 0 0 1.9435939-.6248 6.3260661 2.4208 1.8762378-.5163 3.8111989-.7789 5.7549937-.7811 1.943594 0 3.9249316.2736 5.7544917.7811 4.3828737-3.0456 6.3265681-2.4208 6.3265681-2.4208 1.2579858 3.2406.4570387 5.6618.2284692 6.2474 1.4865553 1.6397 2.3629895 3.748 2.3629895 6.325 0 9.0586-5.3733418 11.0496-10.5186159 11.6356.8386907.7417 1.562444 2.1471 1.562444 4.3729 0 3.1625-.0377436 5.7006-.0377436 6.4812 0 .6248.4193955 1.367 1.562444 1.1327 9.1465963-3.1242 15.7397787-11.948 15.7397787-22.3728.0377436-13.0414-10.2900463-23.5831-22.9808257-23.5831z" fillRule="evenodd" />
		</svg>
	)
})
GitHub.displayName = 'GitHub'
