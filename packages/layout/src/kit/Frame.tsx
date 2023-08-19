import { useClassNameFactory, useComposeRef, useElementSize } from '@contember/react-utils'
import { dataAttribute, px } from '@contember/utilities'
import { CSSProperties, ElementType, forwardRef, memo, useMemo, useRef } from 'react'
import { InsetsProvider, combineElementInsets, useContainerInsetsContext, useSafeAreaInsetsContext } from '../insets'
import * as LayoutPrimitives from '../primitives'
import { FrameComponentType } from './Types'

/**
 * @group Layout
 */
export const Frame: FrameComponentType = memo(forwardRef(({
	as,
	children,
	bodyHeader,
	bodyFooter,
	className,
	componentClassName = 'layout-frame',
	footer,
	footerClassName,
	footerIsFixed = false,
	header,
	headerClassName,
	headerIsFixed = false,
	...rest
}, forwardedRef) => {
	const frameHeaderRef = useRef<HTMLDivElement>(null)
	const frameFooterRef = useRef<HTMLDivElement>(null)
	const bodyHeaderRef = useRef<HTMLDivElement>(null)
	const bodyFooterRef = useRef<HTMLDivElement>(null)
	const frameHeaderSize = useElementSize(frameHeaderRef)
	const frameFooterSize = useElementSize(frameFooterRef)
	const bodyHeaderSize = useElementSize(bodyHeaderRef)
	const bodyFooterSize = useElementSize(bodyFooterRef)

	const frameHeaderHeight = !frameHeaderSize.height || !frameHeaderSize.width ? 0 : frameHeaderSize.height
	const frameFooterHeight = !frameFooterSize.height || !frameFooterSize.width ? 0 : frameFooterSize.height
	const bodyHeaderHeight = !bodyHeaderSize.height || !bodyHeaderSize.width ? 0 : bodyHeaderSize.height
	const bodyFooterHeight = !bodyFooterSize.height || !bodyFooterSize.width ? 0 : bodyFooterSize.height

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
			combineElementInsets({
				...safeAreaInsets,
				// TODO: containerInsets are measured against the whole viewport, not just the frame body
				top: headerIsFixed ? safeAreaInsets.top : 0,
				bottom: footerIsFixed ? safeAreaInsets.bottom : 0,
			}, containerInsets, {
				top: headerIsFixed ? frameHeaderHeight + bodyHeaderHeight : bodyHeaderHeight,
				bottom: footerIsFixed ? frameFooterHeight + bodyFooterHeight : bodyFooterHeight,
			}),
		[safeAreaInsets, containerInsets, headerIsFixed, frameHeaderHeight, bodyHeaderHeight, footerIsFixed, frameFooterHeight, bodyFooterHeight],
	)

	return (
		<LayoutPrimitives.Root<ElementType>
			as={as}
			ref={composeRef}
			className={classNameFor(null, className)}
			data-header-has-height={dataAttribute((frameHeaderHeight ?? 0) > 0)}
			data-header-is-fixed={dataAttribute(headerIsFixed)}
			data-footer-has-height={dataAttribute((frameFooterHeight ?? 0) > 0)}
			data-footer-is-fixed={dataAttribute(footerIsFixed)}
			showDataState={false}
			{...rest}
		>
			<LayoutPrimitives.ResponsiveContainer
				style={
					{
						'--header-height': `${px(frameHeaderHeight)}`,
						'--footer-height': `${px(frameFooterHeight)}`,
					} as CSSProperties
				}
				className={classNameFor('container')}
			>
				{header && (
					<InsetsProvider
						ref={frameHeaderRef}
						className={classNameFor('header', headerClassName)}
						bottom={0}
						left={headerInsets.left}
						right={headerInsets.right}
						top={headerInsets.top}
					>
						{header}
					</InsetsProvider>
				)}

				<div className={classNameFor('body')}>
					{bodyHeader && <div ref={bodyHeaderRef} className={classNameFor('body-header')}>{bodyHeader}</div>}
					{children && (
						<InsetsProvider
							className={classNameFor('body-content')}
							bottom={bodyInsets.bottom}
							left={bodyInsets.left}
							right={bodyInsets.right}
							top={bodyInsets.top}
						>
							{children}
						</InsetsProvider>
					)}
					{bodyFooter && <div ref={bodyFooterRef} className={classNameFor('body-footer')}>{bodyFooter}</div>}
				</div>

				{footer && (
					<InsetsProvider
						ref={frameFooterRef}
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
