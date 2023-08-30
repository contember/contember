import { useClassNameFactory, useComposeRef, useContainerWidth, useElementSize, usePreviousValue, useReferentiallyStableCallback } from '@contember/react-utils'
import { assert, dataAttribute, isNotNullish, px } from '@contember/utilities'
import { CSSProperties, forwardRef, memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { FocusScope } from '../focus-scope'
import { ContainerInsetsContext, InsetsConsumer, useElementInsets, useSafeAreaInsetsContext } from '../insets'
import { LayoutPanelContext, PanelWidthContext, useGetLayoutPanelsStateContext, useSetLayoutPanelsStateContext } from './Contexts'
import { PanelComponentType } from './Types'
import { getLayoutPanelId } from './getPanelId'
import { parseLayoutPanelProps } from './parseLayoutPanelProps'

const DEFAULT_PANEL_BASIS = 320
/**
 * @group Layout
 */
export const Panel: PanelComponentType = memo(forwardRef(
	(props, forwardedRef) => {
		const {
			as: Container = 'section',
			basis,
			behavior,
			children,
			className: classNameProp,
			componentClassName = 'layout-panel',
			defaultBehavior,
			defaultVisibility,
			maxWidth,
			minWidth,
			name,
			onBehaviorChange,
			onVisibilityChange,
			onKeyPress,
			onKeyDown,
			onTransitionEnd,
			priority,
			trapFocusInModal = true,
			visibility,
			style,
			...rest
		} = parseLayoutPanelProps(props)
		const elementRef = useRef<HTMLElement>(null)
		const composedRef = useComposeRef(forwardedRef, elementRef)
		const { height, width } = useElementSize(elementRef)
		const containerWidth = useContainerWidth()

		const { registerLayoutPanel, unregisterLayoutPanel, update } = useSetLayoutPanelsStateContext()

		useLayoutEffect(() => {
			registerLayoutPanel(name, {
				basis: basis ?? DEFAULT_PANEL_BASIS,
				behavior: behavior ?? null,
				defaultVisibility: defaultVisibility ?? null,
				defaultBehavior: defaultBehavior ?? null,
				maxWidth: maxWidth ?? null,
				minWidth: minWidth ?? 0,
				name,
				priority: priority ?? null,
				ref: elementRef,
				visibility: visibility ?? null,
			})
			return () => unregisterLayoutPanel(name)
		}, [basis, behavior, defaultBehavior, defaultVisibility, maxWidth, minWidth, name, priority, registerLayoutPanel, unregisterLayoutPanel, visibility])

		const panelState = useGetLayoutPanelsStateContext().panels.get(name)
		const contextBehavior = panelState?.behavior ?? behavior ?? defaultBehavior
		const contextVisibility = panelState?.visibility ?? visibility ?? defaultVisibility

		assert('context visibility is not nullish', contextVisibility, isNotNullish)
		assert('context behavior is not nullish', contextBehavior, isNotNullish)

		const previousBehavior = usePreviousValue(contextBehavior)
		const previousVisibility = usePreviousValue(contextVisibility)

		useEffect(() => {
			const element = elementRef.current

			if (element) {

			}
		}, [containerWidth, visibility])


		const handleTransitionEndCleanup = useReferentiallyStableCallback((...rest: any[]) => {
			const element = elementRef.current

			if (element) {
				element.style.setProperty('--transitioning-width', '')
				element.style.setProperty('--transitioning-height', '')
				delete element.dataset.transitioning
			}
		})

		const handleVisibilityChange = useReferentiallyStableCallback((visibility: typeof contextVisibility) => {
			const element = elementRef.current

			if (element) {
				if (contextBehavior === previousBehavior && previousVisibility !== contextVisibility) {
					element.dataset.visibility = 'visible'
					element.style.setProperty('--transitioning-width', px(element.offsetWidth))
					element.style.setProperty('--transitioning-height', px(element.offsetHeight))
					element.dataset.visibility = previousVisibility

					requestAnimationFrame(() => {
						element.dataset.transitioning = 'true'
						element.dataset.visibility = contextVisibility
					})
				}
			}

			update(name, onVisibilityChange?.({
				behavior: contextBehavior,
				panel: name,
				visibility,
			}))
		})

		useLayoutEffect(() => {
			handleVisibilityChange(contextVisibility)
		}, [contextVisibility, handleVisibilityChange])

		const handleBehaviorChange = useReferentiallyStableCallback((behavior: typeof contextBehavior) => {
			update(name, onBehaviorChange?.({
				behavior,
				panel: name,
				visibility: contextVisibility,
			}))
		})

		useLayoutEffect(() => {
			handleBehaviorChange(contextBehavior)
		}, [contextBehavior, handleBehaviorChange])

		const handleKeyPress = useReferentiallyStableCallback((event: KeyboardEvent) => {
			update(name, onKeyPress?.(event, { panel: name, behavior: contextBehavior, visibility: contextVisibility }))
		})

		const elementInsets = useElementInsets(elementRef)
		const safeAreaInsets = useSafeAreaInsetsContext()
		const containerInsets = contextBehavior === 'modal' ? safeAreaInsets : elementInsets

		const id = getLayoutPanelId(name)
		const className = useClassNameFactory(componentClassName)
		const shouldTrapFocus = trapFocusInModal && contextVisibility === 'visible' && contextBehavior === 'modal'

		return (
			<LayoutPanelContext.Provider
				value={useMemo(() => ({
					behavior: contextBehavior,
					panel: name,
					visibility: contextVisibility,
				}), [contextBehavior, contextVisibility, name])}
			>
				<Container
					id={id}
					key={id}
					ref={composedRef}
					className={className(null, classNameProp)}
					data-name={dataAttribute(name)}
					data-behavior={dataAttribute(contextBehavior)}
					role={contextBehavior === 'modal' ? 'dialog' : undefined}
					aria-hidden={contextVisibility === 'hidden' ? true : undefined}
					aria-expanded={contextVisibility === 'visible' ? 'true' : 'false'}
					data-visibility={dataAttribute(contextVisibility)}
					data-max-width={dataAttribute(maxWidth)}
					data-min-width={dataAttribute(minWidth)}
					data-priority={dataAttribute(priority)}
					data-basis={dataAttribute(basis)}
					tabIndex={contextVisibility !== 'hidden' ? 0 : -1}
					onKeyDown={useCallback((event: KeyboardEvent) => {
						handleKeyPress(event)
						onKeyDown?.(event)
					}, [handleKeyPress, onKeyDown])}
					onTransitionEnd={useReferentiallyStableCallback((event: TransitionEvent) => {
						handleTransitionEndCleanup(event)
						onTransitionEnd?.(event)
					})}
					style={useMemo(() => ({
						'--panel-basis': `var(--panel-${name}-basis)`,
						'--panel-min-width': `var(--panel-${name}-min-width)`,
						'--panel-max-width': `var(--panel-${name}-max-width)`,
						...style,
					} as CSSProperties), [name, style])}
					{...rest}
				>
					<ContainerInsetsContext.Provider value={containerInsets}>
						<PanelWidthContext.Provider value={useMemo(() => ({ height: height ?? 0, width: width ?? 0 }), [height, width])}>
							<FocusScope active={shouldTrapFocus === true}>
								<InsetsConsumer className={className('content')} key="children">
									<div className={className('content-inner')}>{children}</div>
								</InsetsConsumer>
							</FocusScope>
						</PanelWidthContext.Provider>
					</ContainerInsetsContext.Provider>
				</Container>
			</LayoutPanelContext.Provider>
		)
	},
))
Panel.displayName = 'Interface.LayoutPrimitives.Panel'
