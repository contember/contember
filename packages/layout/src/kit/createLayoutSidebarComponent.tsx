import { useClassName, useClassNameFactory, useComposeRef, useElementSize, useReferentiallyStableCallback } from '@contember/react-utils'
import { isNonNegativeNumber, px } from '@contember/utilities'
import { ElementType, forwardRef, memo, useCallback, useRef } from 'react'
import { MenuAutoCloseProvider } from '../menu-auto-close-provider'
import { GetLayoutPanelsStateContext, LayoutPanelContext, PanelBehavior, PanelBody, PanelFooter, PanelHeader, Panel as PanelPrimitive, PanelState, PanelVisibility, useClosePanelOnEscape, useGetLayoutPanelsStateContext, useSetLayoutPanelsStateContext } from '../primitives'
import { SidebarComponentAttributes, SidebarComponentType } from './Types'
import { isSlugString } from '../utils/isSlugString'

const BASIS = 256
const MIN_WIDTH = 256
const MAX_WIDTH = 256

export function createLayoutSidebarComponent({
	defaultAs = 'aside',
	defaultBehavior = 'collapsible',
	defaultComponentClassName = 'layout-sidebar',
	defaultVisibility = 'visible',
	displayName,
	name,
}: {
	defaultAs: ElementType;
	defaultBehavior?: PanelBehavior;
	defaultComponentClassName?: string | string[];
	defaultVisibility?: PanelVisibility;
	displayName: string;
	name: string;
}) {
	if (!isSlugString(name)) {
		throw new Error(`Name must be a slug string, got: ${name}`)
	}

	return Object.assign<SidebarComponentType, SidebarComponentAttributes>(memo(forwardRef(({
		as = defaultAs,
		basis = BASIS,
		body,
		className: classNameProp,
		componentClassName = defaultComponentClassName,
		footer,
		header,
		keepVisible = false,
		maxWidth = MAX_WIDTH,
		minWidth = MIN_WIDTH,
		onBehaviorChange: onBehaviorChangeProp,
		onKeyPress: onKeyPressProp,
		onVisibilityChange,
		priority,
		style,
		trapFocusInModal,
		...props
	}, forwardedRef) => {
		const keepVisibleBehavior = useReferentiallyStableCallback(({ behavior }: PanelState) => {
			if (keepVisible && behavior !== 'modal') {
				return { visibility: 'visible' } as const
			}
		})

		const onEscapePress = useClosePanelOnEscape()

		const { hide } = useSetLayoutPanelsStateContext()
		const panelState = useGetLayoutPanelsStateContext().panels.get(name)

		const visibility = panelState?.visibility
		const behavior = panelState?.behavior

		const hideModal = useReferentiallyStableCallback(() => {
			if (behavior === 'modal' && visibility === 'visible') {
				hide(name)
			}
		})

		const elementRef = useRef<HTMLDivElement>(null)
		const composeRef = useComposeRef(forwardedRef, elementRef)
		const className = useClassNameFactory(componentClassName)
		const headerRef = useRef<HTMLDivElement>(null)
		const footerRef = useRef<HTMLDivElement>(null)
		const { height: headerHeight } = useElementSize(headerRef)
		const { height: footerHeight } = useElementSize(footerRef)

		const onKeyPress = useCallback((event: KeyboardEvent, state: PanelState) => ({
			...onEscapePress(event, state),
			...onKeyPressProp?.(event, state),
		}), [onEscapePress, onKeyPressProp])

		const onBehaviorChange = useCallback((state: PanelState) => ({
			...keepVisibleBehavior(state),
			...onBehaviorChangeProp?.(state),
		}), [keepVisibleBehavior, onBehaviorChangeProp])

		return (
			<PanelPrimitive
				ref={composeRef}
				as={as}
				basis={isNonNegativeNumber(basis) ? basis : undefined}
				className={useClassName(componentClassName, classNameProp)}
				defaultBehavior={defaultBehavior}
				defaultVisibility={defaultVisibility}
				maxWidth={isNonNegativeNumber(maxWidth) ? maxWidth : undefined}
				minWidth={isNonNegativeNumber(minWidth) ? minWidth : undefined}
				name={name}
				onBehaviorChange={onBehaviorChange}
				onKeyPress={onKeyPress}
				onVisibilityChange={onVisibilityChange}
				priority={priority}
				trapFocusInModal={trapFocusInModal ?? undefined}
				{...props}
				style={{
					...style,
					'--panel-header-height': px(headerHeight),
					'--panel-footer-height': px(footerHeight),
				}}
			>
				<MenuAutoCloseProvider onAutoClose={hideModal}>
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
				</MenuAutoCloseProvider>
			</PanelPrimitive>
		)
	})), {
		displayName: `Layout.Kit.${displayName}`,
		NAME: name,
		BASIS: BASIS,
		MIN_WIDTH: MIN_WIDTH,
		MAX_WIDTH: MAX_WIDTH,
	})
}
