import { PolymorphicRef, assert, isNotNullish, isSlugString, useClassNameFactory } from '@contember/utilities'
import { ElementType, forwardRef, memo } from 'react'
import { InsetsConsumer } from '../insets'
import { GetLayoutPanelsStateContext, isComponentClassName } from '../primitives'
import { BarComponentType, BarProps } from './Types'

export function createLayoutBarComponent({
	name,
	defaultAs,
	defaultComponentClassName = 'layout-bar',
	displayName,
}: {
	name: string;
	defaultAs: ElementType;
	defaultComponentClassName?: string | string[];
	displayName: string;
}): BarComponentType {
	assert('name is a slug string', name, isSlugString)
	assert('as is defined', defaultAs, isNotNullish)
	assert(
		'componentClassName is either a non-empty string or an array of non-empty strings',
		defaultComponentClassName,
		isComponentClassName,
	)

	const Component = memo(forwardRef(<C extends ElementType = typeof defaultAs>({
		as,
		center = true,
		centerAfter,
		centerBefore,
		className: classNameProp,
		componentClassName = defaultComponentClassName,
		end,
		endAfter,
		endBefore,
		start,
		startAfter,
		startBefore,
		...props
	}: BarProps<C>, forwardedRef: PolymorphicRef<C>) => {
		const className = useClassNameFactory(componentClassName)

		return (
			<InsetsConsumer<ElementType> as={as ?? defaultAs} ref={forwardedRef} data-name={name} className={className(null, classNameProp)} {...props}>
				<div className={className('body', classNameProp)}>
					<GetLayoutPanelsStateContext.Consumer>
						{state => (
							<>
								{start !== false && (
									<InsetsConsumer className={className('start')}>
										{typeof startBefore === 'function' ? startBefore(state) : startBefore}
										<div className={className('start-content')}>
											{typeof start === 'function' ? start(state) : start}
										</div>
										{typeof startAfter === 'function' ? startAfter(state) : startAfter}
									</InsetsConsumer>
								)}

								{center !== false && (
									<InsetsConsumer className={className('center')}>
										{typeof centerBefore === 'function' ? centerBefore(state) : centerBefore}
										<div className={className('center-content')}>
											{typeof center === 'function' ? center(state) : center}
										</div>
										{typeof centerAfter === 'function' ? centerAfter(state) : centerAfter}
									</InsetsConsumer>
								)}

								{end !== false && (
									<InsetsConsumer className={className('end')}>
										{typeof endBefore === 'function' ? endBefore(state) : endBefore}
										<div className={className('end-content')}>{typeof end === 'function' ? end(state) : end}</div>
										{typeof endAfter === 'function' ? endAfter(state) : endAfter}
									</InsetsConsumer>
								)}
							</>
						)}
					</GetLayoutPanelsStateContext.Consumer>
				</div>
			</InsetsConsumer>
		)
	})) as unknown as BarComponentType
	Component.displayName = displayName

	return Component
}
