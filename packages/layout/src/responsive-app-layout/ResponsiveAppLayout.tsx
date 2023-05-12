import { useComposeRef, useElementSize } from '@contember/react-utils'
import { PolymorphicComponentPropsWithRef, PolymorphicRef, dataAttribute, px, useClassNameFactory } from '@contember/utilities'
import { CSSProperties, ElementType, ReactNode, forwardRef, memo, useMemo, useRef } from 'react'
import { InsetsProvider, combineElementInsets, useContainerInsetsContext, useSafeAreaInsetsContext } from '../insets'
import { Layout, OwnContainerProps } from '../layout'

export interface OwnResponsiveAppLayoutProps extends OwnContainerProps {
	minimumFooterHeight?: number;
	minimumHeaderHeight?: number;
	header?: ReactNode;
	footer?: ReactNode;
}

export type ResponsiveAppLayoutProps<C extends ElementType> =
	PolymorphicComponentPropsWithRef<C, OwnResponsiveAppLayoutProps>

export type ResponsiveAppLayoutComponentType = (<C extends ElementType = 'div'>(
	props: ResponsiveAppLayoutProps<C>,
) => React.ReactElement | null) & {
	displayName?: string | undefined;
}

export const ResponsiveAppLayout: ResponsiveAppLayoutComponentType = memo(forwardRef(
	<C extends ElementType = 'div'>({
		as,
		children,
		className,
		header,
		footer,
		componentClassName = 'responsive-app-layout',
		...rest
	}: ResponsiveAppLayoutProps<C>, forwardedRef: PolymorphicRef<C>) => {
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

		const headerInsets = useMemo(() => ({
			...combineElementInsets(safeAreaInsets, containerInsets),
			bottom: 0,
		}), [containerInsets, safeAreaInsets])

		const footerInsets = useMemo(() => ({
			...combineElementInsets(safeAreaInsets, containerInsets),
			top: 0,
		}), [containerInsets, safeAreaInsets])

		const bodyInsets = useMemo(() => combineElementInsets(
			safeAreaInsets,
			containerInsets,
			{
				top: headerHeight,
				bottom: footerHeight,
			},
		), [safeAreaInsets, containerInsets, headerHeight, footerHeight])

		return (
			// Too complicated to type properly internally, so we just cast it to `any`
			// because the outer PolymorphicRef types ensure proper typing of `as` prop.
			<Layout.Root<any>
				as={as}
				ref={composeRef}
				className={classNameFor(null, className)}
				data-header-has-height={dataAttribute((headerHeight ?? 0) > 0)}
				data-footer-has-height={dataAttribute((footerHeight ?? 0) > 0)}
				{...rest}
			>
				<Layout.ResponsiveContainer
					style={{
						'--header-height': `${px(headerHeight)}`,
						'--footer-height': `${px(footerHeight)}`,
					} as CSSProperties}
					className={classNameFor('main')}
				>
					<InsetsProvider
						ref={layoutHeaderRef}
						as="header"
						className={classNameFor('header')}
						bottom={headerInsets.bottom}
						left={headerInsets.left}
						right={headerInsets.right}
						top={headerInsets.top}
					>
						<div className={classNameFor('header-container')}>
							{header}
						</div>
					</InsetsProvider>

					<InsetsProvider
						className={classNameFor('body')}
						bottom={bodyInsets.bottom}
						left={bodyInsets.left}
						right={bodyInsets.right}
						top={bodyInsets.top}
					>
						<div className={classNameFor('body-container')}>
							{children}
						</div>
					</InsetsProvider>

					<InsetsProvider
						as="footer"
						ref={layoutFooterRef}
						className={classNameFor('footer')}
						bottom={footerInsets.bottom}
						left={footerInsets.left}
						right={footerInsets.right}
						top={footerInsets.top}
					>
						<div className={classNameFor('footer-container')}>
							{footer}
						</div>
					</InsetsProvider>
				</Layout.ResponsiveContainer>
			</Layout.Root>
		)
	},
))
ResponsiveAppLayout.displayName = 'ResponsiveAppLayout'
