import { useClassNameFactory, useElementSize } from '@contember/react-utils'
import { px } from '@contember/utilities'
import { ElementType, forwardRef, memo, useRef } from 'react'
import {
	GetLayoutPanelsStateContext,
	LayoutPanelContext,
	Panel as PanelPrimitive,
	PanelBody,
	PanelFooter,
	PanelHeader,
} from '../primitives'
import { ContentComponentAttributes, ContentPanelComponentType } from './Types'
import { isSlugString } from '../utils/isSlugString'

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
}) {
	if (!isSlugString(name)) {
		throw new Error(`Name must be a slug string, got: ${name}`)
	}

	return Object.assign<ContentPanelComponentType, ContentComponentAttributes>(memo(forwardRef(({
		as = defaultAs,
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
	}, forwardedRef) => {
		const className = useClassNameFactory(componentClassName)
		const headerRef = useRef<HTMLDivElement>(null)
		const footerRef = useRef<HTMLDivElement>(null)
		const { height: headerHeight } = useElementSize(headerRef)
		const { height: footerHeight } = useElementSize(footerRef)

		return (
			<PanelPrimitive
				ref={forwardedRef}
				as={as}
				basis={basis}
				className={className(null, classNameProp)}
				defaultBehavior="static"
				defaultVisibility="visible"
				maxWidth={maxWidth || null}
				minWidth={minWidth}
				name={name}
				style={{
					...style,
					'--panel-header-height': px(headerHeight),
					'--panel-footer-height': px(footerHeight),
				}}
				{...props}
			>
				<GetLayoutPanelsStateContext.Consumer>
					{panelsState => (
						<LayoutPanelContext.Consumer>
							{state => {
								const headerContent = typeof header === 'function' ? header(state, panelsState) : header
								const bodyContent = typeof body === 'function' ? body(state, panelsState) : body
								const footerContent = typeof footer === 'function' ? footer(state, panelsState) : footer

								return (
									<>
										{headerContent !== false && (
											<PanelHeader ref={headerRef} className={className('header')}>
												{headerContent}
											</PanelHeader>
										)}

										{bodyContent !== false && (
											<PanelBody className={className('body')}>
												{bodyContent}
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
					)}
				</GetLayoutPanelsStateContext.Consumer>
			</PanelPrimitive>
		)
	})), {
		displayName: `Layout.Kit.${displayName}`,
		NAME: name,
		BASIS: BASIS,
		MAX_WIDTH: MAX_WIDTH,
		MIN_WIDTH: MIN_WIDTH,
	})
}
