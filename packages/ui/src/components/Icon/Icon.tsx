import { IconName as BPIconName, IconSvgPaths16 } from '@blueprintjs/icons'
import cn from 'classnames'
import {
	CSSProperties,
	forwardRef,
	memo,
	MouseEvent as ReactMouseEvent,
	ReactElement,
	RefCallback,
	useMemo,
} from 'react'
import { useClassNamePrefix } from '../../auxiliary'
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
	const prefix = useClassNamePrefix()
	const icon: ReactElement | null = useMemo(() => {
		if (props.customIcon && !Array.isArray(props.customIcon)) {
			return props.customIcon
		}
		let pathStrings: string[] | undefined
		let svgClassName: string
		if (props.blueprintIcon) {
			pathStrings = IconSvgPaths16[props.blueprintIcon]
			svgClassName = `${prefix}icon-blueprintSvg`
		} else if (props.contemberIcon) {
			pathStrings = ContemberIcons[props.contemberIcon]
			svgClassName = `${prefix}icon-contemberSvg`
		} else {
			// TODO if __DEV__
			console.warn('Icon: trying to render without an icon source.')
			return null
		}
		const svgPaths = renderSvgPaths(pathStrings)
		return (
			<svg viewBox="0 0 16 16" className={svgClassName}>
				{props.title && <desc>{props.title}</desc>}
				{svgPaths}
			</svg>
		)
	}, [prefix, props])

	return (
		<div
			className={cn(
				`${prefix}icon`,
				toEnumViewClass(props.size),
				toViewClass('alignWithLowercase', props.alignWithLowercase),
			)}
			style={props.style}
			ref={ref as RefCallback<HTMLDivElement>}
			onClick={props.onClick}
		>
			{icon}
		</div>
	)
}))
