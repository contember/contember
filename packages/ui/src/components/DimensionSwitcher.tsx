import { useClassNameFactory } from '@contember/utilities'
import type { ReactNode } from 'react'

export interface DimensionSwitcherValue {
	key: string
	label: ReactNode
	options: { value: string; label: ReactNode; active: boolean }[]
}

export interface DimensionSwitcherProps {
	dimensions: DimensionSwitcherValue[]
}

export function DimensionSwitcher({ dimensions }: DimensionSwitcherProps) {
	const componentClassName = useClassNameFactory('dimensionSwitcher')

	return (
		<div className={componentClassName()}>
			<div className={componentClassName('items')}>
				{dimensions.map(dimension => (
					<div className={componentClassName('item')} key={dimension.key}>
						<span className={componentClassName('item-label')}>{dimension.label}:</span>
						<span className={componentClassName('item-options')}>
							{dimension.options.map(option => (
								<span
									key={option.value}
									className={componentClassName('item-option', option.active && 'view-active')}
								>
									{option.label}
								</span>
							))}
						</span>
						<span className={componentClassName('item-icon')} />
					</div>
				))}
			</div>
		</div>
	)
}
DimensionSwitcher.displayName = 'DimensionSwitcher'
