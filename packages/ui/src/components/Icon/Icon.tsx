import { IconName as BPIconName, IconSvgPaths16 } from '@blueprintjs/icons'
import { useClassNameFactory } from '@contember/utilities'
import {
	CSSProperties,
	ReactElement,
	MouseEvent as ReactMouseEvent,
	RefCallback,
	forwardRef,
	memo,
	useMemo,
} from 'react'
import type { IconSize } from '../../types'
import { toEnumViewClass, toViewClass } from '../../utils'
import * as ContemberIcons from './contemberIcons'

// To be potentially extended later
export type BlueprintIconName = BPIconName
export type ContemberIconName = keyof typeof ContemberIcons

export interface IconSourceSpecification {
	blueprintIcon?: BlueprintIconName
	contemberIcon?: ContemberIconName
	customIcon?: ReactElement | string[]
}

export interface IconProps extends IconSourceSpecification {
	title?: string
	size?: IconSize
	style?: CSSProperties
	alignWithLowercase?: boolean
	onClick?: (e: ReactMouseEvent<HTMLElement>) => void
}

const renderSvgPaths = (pathStrings: string[] | undefined): JSX.Element[] | null => {
	if (!pathStrings || !pathStrings.length) {
		return null
	}
	return pathStrings.map((d, i) => <path key={i} d={d} fillRule="evenodd" />)
}

/**
 * @group UI
 */
export const Icon = memo(forwardRef<HTMLElement, IconProps>(function Icon(props, ref) {
	const componentClassName = useClassNameFactory('icon')
	const svgClassName: string = props.blueprintIcon
		? componentClassName('blueprintSvg')
		: componentClassName('contemberSvg')

	const icon: ReactElement | null = useMemo(() => {
		if (props.customIcon && !Array.isArray(props.customIcon)) {
			return props.customIcon
		}

		let pathStrings: string[] | undefined

		if (props.blueprintIcon) {
			pathStrings = IconSvgPaths16[props.blueprintIcon]
		} else if (props.contemberIcon) {
			pathStrings = ContemberIcons[props.contemberIcon]
		} else {
			if (import.meta.env.DEV) {
				console.warn('Icon: trying to render without an icon source.')
			}

			return null
		}

		const svgPaths = renderSvgPaths(pathStrings)

		return (
			<svg viewBox="0 0 16 16" className={svgClassName}>
				{props.title && <desc>{props.title}</desc>}
				{svgPaths}
			</svg>
		)
	}, [props.blueprintIcon, props.contemberIcon, props.customIcon, props.title, svgClassName])

	return (
		<div
			className={componentClassName(null, [
				toEnumViewClass(props.size),
				toViewClass('alignWithLowercase', props.alignWithLowercase),
			])}
			style={props.style}
			ref={ref as RefCallback<HTMLDivElement>}
			onClick={props.onClick}
		>
			{icon}
		</div>
	)
}))
