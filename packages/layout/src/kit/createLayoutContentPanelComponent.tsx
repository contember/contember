import { useElementSize } from '@contember/react-utils'
import { PolymorphicRef, assert, isNonNegativeNumber, isNotNullish, isSlugString, px, useClassNameFactory } from '@contember/utilities'
import { ElementType, forwardRef, memo, useRef } from 'react'
import { LayoutPanelContext, Panel, PanelBody, PanelFooter, PanelHeader, isComponentClassName } from '../primitives'
import { ContentPanelComponentType, ContentPanelProps } from './Types'

const BASIS = 640
const MIN_WIDTH = 480
const MAX_WIDTH = 720

export function createLayoutContentPanelComponent({
	defaultAs = 'section',
	defaultComponentClassName,
	displayName,
	name,
}: {
	defaultAs?: ElementType;
	defaultComponentClassName: string | string[];
	displayName: string;
	name: string;
}): ContentPanelComponentType {
	assert('name is a slug string', name, isSlugString)
	assert('defaultAs is defined', defaultAs, isNotNullish)
	assert(
		'componentClassName is either a non-empty string or an array of non-empty strings',
		defaultComponentClassName,
		isComponentClassName,
	)

	const Component: ContentPanelComponentType = memo(forwardRef(<C extends ElementType = 'section'>({
		as,
		basis = BASIS,
		body = true,
		className: classNameProp,
		componentClassName = defaultComponentClassName,
		footer = true,
		header = true,
		maxWidth,
		minWidth = MIN_WIDTH,
		style,
		...props
	}: ContentPanelProps<C>,
		forwardedRef: PolymorphicRef<C>,
	) => {
		const className = useClassNameFactory(componentClassName)
		const headerRef = useRef<HTMLDivElement>(null)
		const footerRef = useRef<HTMLDivElement>(null)
		const { height: headerHeight } = useElementSize(headerRef)
		const { height: footerHeight } = useElementSize(footerRef)

		return (
			<Panel<ElementType>
				ref={forwardedRef}
				as={as ?? defaultAs}
				basis={isNonNegativeNumber(basis) ? basis : BASIS}
				className={className(null, classNameProp)}
				defaultBehavior="static"
				defaultVisibility="visible"
				maxWidth={isNonNegativeNumber(maxWidth) ? maxWidth : null}
				minWidth={isNonNegativeNumber(minWidth) ? minWidth : MIN_WIDTH}
				name={name}
				style={{
					...style,
					'--panel-header-height': px(headerHeight),
					'--panel-footer-height': px(footerHeight),
				}}
				{...props}
			>
				<LayoutPanelContext.Consumer>
					{state => {
						const headerContent = typeof header === 'function' ? header(state) : header
						const bodyContent = typeof body === 'function' ? body(state) : body
						const footerContent = typeof footer === 'function' ? footer(state) : footer

						return (
							<>
								{headerContent !== false && (
									<PanelHeader ref={headerRef} className={className('header')}>
										{headerContent}
									</PanelHeader>
								)}

								{bodyContent !== false && (
									<PanelBody className={className('body')}>
										{typeof body === 'function' ? body(state) : body}
									</PanelBody>
								)}

								{footerContent !== false && (
									<PanelFooter ref={footerRef} className={className('footer')}>
										{footerContent}
									</PanelFooter>
								)}
							</>
						)
					}}
				</LayoutPanelContext.Consumer>
			</Panel>
		)
	})) as unknown as ContentPanelComponentType
	Component.displayName = `Layout.Kit.${displayName}`
	Component.NAME = name
	Component.BASIS = BASIS
	Component.MAX_WIDTH = MAX_WIDTH
	Component.MIN_WIDTH = MIN_WIDTH

	return Component
}
