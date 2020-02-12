import cn from 'classnames'
import * as React from 'react'
import { useClassNamePrefix } from '../auxiliary'

export interface DimensionSwitcherValue {
	key: string
	label: React.ReactNode
	options: { value: string; label: React.ReactNode; active: boolean }[]
}

export interface DimensionSwitcherProps {
	dimensions: DimensionSwitcherValue[]
}

export function DimensionSwitcher({ dimensions }: DimensionSwitcherProps) {
	const prefix = useClassNamePrefix()
	return (
		<div className={cn(`${prefix}dimensionSwitcher`)}>
			<div className={cn(`${prefix}dimensionSwitcher-items`)}>
				{dimensions.map(dimension => (
					<div className={cn(`${prefix}dimensionSwitcher-item`)} key={dimension.key}>
						<span className={cn(`${prefix}dimensionSwitcher-item-label`)}>{dimension.label}:</span>
						<span className={cn(`${prefix}dimensionSwitcher-item-options`)}>
							{dimension.options.map(option => (
								<span
									key={option.value}
									className={cn(`${prefix}dimensionSwitcher-item-option`, option.active && 'view-active')}
								>
									{option.label}
								</span>
							))}
						</span>
						<span className={cn(`${prefix}dimensionSwitcher-item-icon`)} />
					</div>
				))}
			</div>
		</div>
	)
}
DimensionSwitcher.displayName = 'DimensionSwitcher'
