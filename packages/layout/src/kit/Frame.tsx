import { useComposeRef, useElementSize } from '@contember/react-utils'
import { PolymorphicRef, dataAttribute, px, useClassNameFactory } from '@contember/utilities'
import { CSSProperties, ElementType, forwardRef, memo, useMemo, useRef } from 'react'
import { InsetsProvider, combineElementInsets, useContainerInsetsContext, useSafeAreaInsetsContext } from '../insets'
import * as LayoutPrimitives from '../primitives'
import { FrameComponentType, FrameProps } from './Types'

export const Frame: FrameComponentType = memo(forwardRef(<C extends ElementType = 'div'>({
	as,
	children,
	className,
	componentClassName = 'layout-frame',
	footer,
	footerClassName,
	footerIsFixed = false,
	header,
	headerClassName,
	headerIsFixed = false,
	...rest
}: FrameProps<C>, forwardedRef: PolymorphicRef<C>) => {
	const layoutHeaderRef = useRef<HTMLDivElement>(null)
	const headerSize = useElementSize(layoutHeaderRef)
	const layoutFooterRef = useRef<HTMLDivElement>(null)
	const footerSize = useElementSize(layoutFooterRef)

	const headerHeight = !headerSize.height || !headerSize.width ? undefined : headerSize.height
	const footerHeight = !footerSize.height || !footerSize.width ? undefined : footerSize.height

	const classNameFor = useClassNameFactory(componentClassName)

	const elementRef = useRef<HTMLElement>(null)
	const composeRef = useComposeRef(elementRef, forwardedRef)

	const safeAreaInsets = useSafeAreaInsetsContext()
	const containerInsets = useContainerInsetsContext()

	const headerInsets = useMemo(
		() => ({
			...combineElementInsets(safeAreaInsets, containerInsets),
			bottom: 0,
		}),
		[containerInsets, safeAreaInsets],
	)

	const footerInsets = useMemo(
		() => ({
			...combineElementInsets(safeAreaInsets, containerInsets),
			top: 0,
		}),
		[containerInsets, safeAreaInsets],
	)

	const bodyInsets = useMemo(
		() =>
			combineElementInsets(safeAreaInsets, containerInsets, {
				top: headerIsFixed ? headerHeight : 0,
				bottom: footerIsFixed ? footerHeight : 0,
			}),
		[safeAreaInsets, containerInsets, headerIsFixed, headerHeight, footerIsFixed, footerHeight],
	)

	return (
		<LayoutPrimitives.Root<ElementType>
			as={as}
			ref={composeRef}
			className={classNameFor(null, className)}
			data-header-has-height={dataAttribute((headerHeight ?? 0) > 0)}
			data-header-is-fixed={dataAttribute(headerIsFixed)}
			data-footer-has-height={dataAttribute((footerHeight ?? 0) > 0)}
			data-footer-is-fixed={dataAttribute(footerIsFixed)}
			showDataState={false}
			{...rest}
		>
			<LayoutPrimitives.ResponsiveContainer
				style={
					{
						'--header-height': `${px(headerHeight)}`,
						'--footer-height': `${px(footerHeight)}`,
					} as CSSProperties
				}
				className={classNameFor('container')}
			>
				{header && (
					<InsetsProvider
						ref={layoutHeaderRef}
						className={classNameFor('header', headerClassName)}
						bottom={0}
						left={headerInsets.left}
						right={headerInsets.right}
						top={headerInsets.top}
					>
						{header}
					</InsetsProvider>
				)}

				<InsetsProvider
					className={classNameFor('body')}
					bottom={bodyInsets.bottom}
					left={bodyInsets.left}
					right={bodyInsets.right}
					top={bodyInsets.top}
				>
					{children}
				</InsetsProvider>

				{footer && (
					<InsetsProvider
						ref={layoutFooterRef}
						className={classNameFor('footer', footerClassName)}
						bottom={footerInsets.bottom}
						left={footerInsets.left}
						right={footerInsets.right}
						top={0}
					>
						{footer}
					</InsetsProvider>
				)}
			</LayoutPrimitives.ResponsiveContainer>
		</LayoutPrimitives.Root>
	)
}))
Frame.displayName = 'Interface.LayoutKit.Frame'
