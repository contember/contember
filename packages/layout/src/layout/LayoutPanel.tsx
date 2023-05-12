import { useComposeRef, useElementSize, useExpectSameValueReference, useReferentiallyStableCallback, useUpdatedRef } from '@contember/react-utils'
import { PolymorphicRef, assert, dataAttribute, isNotNullish, px, useClassName } from '@contember/utilities'
import { CSSProperties, ElementType, Fragment, forwardRef, memo, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import waitForTransition from 'wait-for-element-transition'
import { FocusScope } from '../focus-scope'
import { ContainerInsetsContext, useElementInsets, useSafeAreaInsetsContext } from '../insets'
import { LayoutPanelContext, PanelWidthContext, useGetLayoutPanelsStateContext, useSetLayoutPanelsStateContext } from './Contexts'
import { LayoutPanelComponentType, LayoutPanelProps } from './Types'
import { parseLayoutPanelProps } from './parseLayoutPanelProps'

const DEFAULT_PANEL_BASIS = 320

export const LayoutPanel: LayoutPanelComponentType & {
	displayName?: string | undefined;
} = memo(forwardRef(
	<C extends ElementType = 'section'>(props: LayoutPanelProps<C>, forwardedRef: PolymorphicRef<C>) => {
		const {
			as,
			basis,
			behavior,
			children,
			className,
			componentClassName = 'layout-panel',
			defaultBehavior,
			defaultVisibility,
			maxWidth,
			minWidth,
			name,
			onBehaviorChange,
			onVisibilityChange,
			onKeyPress,
			priority,
			tabIndex,
			trapFocusInModal = true,
			visibility,
			style,
			...rest
		} = parseLayoutPanelProps(props)
		const elementRef = useRef<HTMLElement>(null)
		const composedRef = useComposeRef(forwardedRef, elementRef)
		const { height, width } = useElementSize(elementRef)

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
		const isPanelStateReady = !!panelState
		useExpectSameValueReference(panelState)
		const contextBehavior = panelState?.behavior ?? behavior ?? defaultBehavior
		const contextVisibility = panelState?.visibility ?? visibility ?? defaultVisibility

		assert('context visibility is not nullish', contextVisibility, isNotNullish)
		assert('context behavior is not nullish', contextBehavior, isNotNullish)

		const [currentVisibility, setCurrentVisibility] = useState<typeof contextVisibility | 'will-become-visible' | 'will-become-hidden' | null>(contextBehavior === 'static' ? 'visible' : 'hidden')
		const currentVisibilityRef = useUpdatedRef(currentVisibility)

		const [currentBehavior, setCurrentBehavior] = useState<typeof contextBehavior>(contextBehavior)
		const currentBehaviorRef = useUpdatedRef(currentBehavior)

		useLayoutEffect(() => {
			if (isPanelStateReady && elementRef.current) {
				const element = elementRef.current
				const currentBehavior = currentBehaviorRef.current
				const currentVisibility = currentVisibilityRef.current

				let isMounted = true

				if (currentBehavior === contextBehavior) {
					const layoutPanelState = {
						behavior: contextBehavior,
						panel: name,
						visibility: contextVisibility,
					}

					if (currentVisibility !== contextVisibility) {
						// We wait for possible transitions set on panel to finish:
						setCurrentVisibility(`will-become-${contextVisibility}`)

						waitForTransition(element).then(() => {
							if (isMounted) {
								setCurrentVisibility(contextVisibility)
								update(name, onVisibilityChange?.(layoutPanelState))
							}
						})
					}
				} else {
					// We can apply visibility immediately
					const layoutPanelState = {
						behavior: contextBehavior,
						panel: name,
						visibility: contextVisibility,
					}

					setCurrentBehavior(contextBehavior)
					update(name, onBehaviorChange?.(layoutPanelState))

					if (currentVisibility !== contextVisibility) {
						setCurrentVisibility(contextVisibility)
						update(name, onVisibilityChange?.(layoutPanelState))
					}
				}

				return () => {
					isMounted = false
				}
			}
		}, [contextVisibility, contextBehavior, isPanelStateReady, name, onBehaviorChange, onVisibilityChange, update, currentBehaviorRef, currentVisibilityRef])

		const handleKeyPress = useReferentiallyStableCallback((event: KeyboardEvent) => {
			if (currentBehavior && currentVisibility === 'visible' || currentVisibility === 'hidden') {
				update(name, onKeyPress?.(event, { panel: name, behavior: currentBehavior, visibility: currentVisibility }))
			}
		})

		useEffect(() => {
			if (elementRef.current) {
				const element = elementRef.current
				element.addEventListener('keydown', handleKeyPress)

				return () => element.removeEventListener('keydown', handleKeyPress)
			}
		}, [handleKeyPress])

		const elementInsets = useElementInsets(elementRef)

		const safeAreaInsets = useSafeAreaInsetsContext()

		const Container = as ?? 'section'
		const shouldTrapFocus = trapFocusInModal && currentVisibility === 'visible' && currentBehavior === 'modal'

		const containerInsets = contextBehavior === 'modal' ? safeAreaInsets : elementInsets

		return (
			<LayoutPanelContext.Provider
				value={useMemo(() => ({
					behavior: contextBehavior,
					panel: name,
					visibility: contextVisibility,
				}), [contextBehavior, contextVisibility, name])}
			>
				<Container
					as={typeof Container === 'string' ? undefined : 'section'}
					ref={composedRef}
					className={useClassName(componentClassName, className)}
					data-name={dataAttribute(name)}
					data-behavior={dataAttribute(currentBehavior)}
					data-visibility={dataAttribute(currentVisibility ?? 'hidden')}
					id={`layout-panel-${name}`}
					key={`layout-panel-${name}`}
					tabIndex={tabIndex ?? 0}
					style={{
						'--panel-basis': `var(--panel-${name}-basis)`,
						'--panel-height': px(height),
						'--panel-min-width': `var(--panel-${name}-min-width)`,
						'--panel-max-width': `var(--panel-${name}-max-width)`,
						'--panel-width': px(width),
						...style,
						...(currentVisibility === 'will-become-visible' || currentVisibility === 'will-become-hidden' ? { height, width } : undefined),
					} as CSSProperties}
					{...rest}
				>
					<ContainerInsetsContext.Provider value={containerInsets}>
						<PanelWidthContext.Provider value={useMemo(() => ({ height: height ?? 0, width: width ?? 0 }), [height, width])}>
							<FocusScope active={shouldTrapFocus}>
								<Fragment key="children">
									{children}
								</Fragment>
							</FocusScope>
						</PanelWidthContext.Provider>
					</ContainerInsetsContext.Provider>
				</Container>
			</LayoutPanelContext.Provider>
		)
	},
))
LayoutPanel.displayName = 'Layout.Panel'
