import { useClassNameFactory } from '@contember/react-utils'
import { ElementType, forwardRef, memo } from 'react'
import { InsetsConsumer } from '../insets'
import { GetLayoutPanelsStateContext } from '../primitives'
import { BarComponentType } from './Types'
import { isSlugString } from '../utils/isSlugString'

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
}) {
	if (!isSlugString(name)) {
		throw new Error(`Name must be a slug string, got: ${name}`)
	}

	const Component: BarComponentType = memo(forwardRef(({
		as = defaultAs,
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
	}, forwardedRef) => {
		const className = useClassNameFactory(componentClassName)

		return (
			<InsetsConsumer<ElementType> as={as} ref={forwardedRef} data-name={name} className={className(null, classNameProp)} {...props}>
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
	}))
	Component.displayName = displayName

	return Component
}
