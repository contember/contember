import { IconName as BPIconName, IconSvgPaths16 } from '@blueprintjs/icons'
import cn from 'classnames'
import * as React from 'react'
import { useClassNamePrefix } from '../../auxiliary'
import { IconSize } from '../../types'
import { toEnumViewClass, toViewClass } from '../../utils'
import * as ContemberIcons from './contemberIcons'

// To be potentially extended later
export type BlueprintIconName = BPIconName
export type ContemberIconName = keyof typeof ContemberIcons

export type IconProps = {
	children?: never
	title?: string
	size?: IconSize
	style?: React.CSSProperties
	alignWithLowercase?: boolean
} & (
	| {
			blueprintIcon: BlueprintIconName
	  }
	| {
			contemberIcon: ContemberIconName
	  }
)

const renderSvgPaths = (pathStrings: string[] | undefined): JSX.Element[] | null => {
	if (!pathStrings || !pathStrings.length) {
		return null
	}
	return pathStrings.map((d, i) => <path key={i} d={d} fillRule="evenodd" />)
}

export const Icon = React.memo((props: IconProps) => {
	let pathStrings: string[] | undefined
	let svgClassName: string

	const prefix = useClassNamePrefix()

	if ('blueprintIcon' in props && props.blueprintIcon) {
		pathStrings = IconSvgPaths16[props.blueprintIcon]
		svgClassName = `${prefix}icon-blueprintSvg`
	} else if ('contemberIcon' in props && props.contemberIcon) {
		pathStrings = ContemberIcons[props.contemberIcon]
		svgClassName = `${prefix}icon-contemberSvg`
	} else {
		return null
	}

	const svgPaths = React.useMemo(() => renderSvgPaths(pathStrings), [pathStrings])

	return (
		<div
			className={cn(
				`${prefix}icon`,
				toEnumViewClass(props.size),
				toViewClass('alignWithLowercase', props.alignWithLowercase),
			)}
			style={props.style}
		>
			<svg viewBox="0 0 16 16" className={svgClassName}>
				{props.title && <desc>{props.title}</desc>}
				{svgPaths}
			</svg>
		</div>
	)
})
Icon.displayName = 'Icon'
