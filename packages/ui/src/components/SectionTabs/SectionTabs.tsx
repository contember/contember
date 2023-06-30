import { useClassNameFactory } from '@contember/utilities'
import { memo, useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { TabButton } from '../Tabs'
import { ActiveSectionsTabsContext, SectionTabsContext, SectionTabsRegistrationContext, useActiveSectionsTabs, useSectionTabs } from './Context'
import { activeSectionTabsMapReducer, sectionTabsMapReducer } from './State'
import { ActiveSectionsTabsContextType, SectionTabProps, SectionTabsProps, SectionTabsRegistrationContextType } from './Types'

export const SectionTabsProvider = memo(({ children }: SectionTabsProps) => {
	const [tabs, sectionTabsDispatch] = useReducer(sectionTabsMapReducer, {})
	const [activeTabs, activeSectionTabsDispatch] = useReducer(activeSectionTabsMapReducer, {})

	const observer = useRef(new IntersectionObserver(entries => {
		entries.forEach(({ target, isIntersecting, intersectionRatio, time }) => {
			const id = target.id

			if (id) {
				activeSectionTabsDispatch({
					type: isIntersecting ? 'SET' : 'UNSET',
					payload: {
						id,
						time,
						intersectionRatio: intersectionRatio,
					},
				})
			}
		})
	}, {
		threshold: [0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.5, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8, 0.85, 0.9, 0.95, 1.0],
	}))

	const registerTab = useCallback((newTab: SectionTabProps) => {
		const element = document.getElementById(newTab.id)
		element && observer.current.observe(element)

		sectionTabsDispatch({ type: 'REGISTER', payload: newTab })
	}, [])

	const unregisterTab = useCallback((oldTab: SectionTabProps) => {
		const element = document.getElementById(oldTab.id)

		element && observer.current.unobserve(element)
		activeSectionTabsDispatch({
			type: 'UNSET',
			payload: { id: oldTab.id, time: 0, intersectionRatio: 0 },
		})

		sectionTabsDispatch({ type: 'UNREGISTER', payload: oldTab })
	}, [])

	useEffect(() => {
		const intersectionObserver = observer.current

		return () => {
			intersectionObserver.disconnect()
		}
	}, [])

	const sectionTabsRegistration = useMemo<SectionTabsRegistrationContextType>(() => [
		registerTab,
		unregisterTab,
	], [
		registerTab,
		unregisterTab,
	])

	const activeSectionTabs = useMemo<ActiveSectionsTabsContextType>(() => activeTabs, [activeTabs])

	return (
		<SectionTabsContext.Provider value={tabs}>
			<SectionTabsRegistrationContext.Provider value={sectionTabsRegistration}>
				<ActiveSectionsTabsContext.Provider value={activeSectionTabs}>
					{children}
				</ActiveSectionsTabsContext.Provider>
			</SectionTabsRegistrationContext.Provider>
		</SectionTabsContext.Provider>
	)
})

export const SectionTabs = memo(() => {
	const componentClassName = useClassNameFactory('section-tabs')
	const tabs = useSectionTabs()
	const activeTabs = useActiveSectionsTabs()
	const entries = Object.entries(tabs)
	const [selectedTab, setSelectedTab] = useState<string | undefined>(undefined)
	const clickTimestamp = useRef<number>(Date.now())

	const activeTabEntries = Object.entries(activeTabs).map(([, activeTab]) => activeTab).sort((a, b) => b.intersectionRatio === a.intersectionRatio
		? b.time - a.time
		: b.intersectionRatio - a.intersectionRatio)
	const activeTab = activeTabEntries.length > 0
		? activeTabEntries[0].id
		: undefined

	const selectedOrActiveTab = selectedTab || activeTab

	useEffect(() => {
		if (selectedTab && (
			typeof activeTabs[selectedTab] === 'undefined'
			||
			activeTab && activeTabs[activeTab]?.intersectionRatio > activeTabs[selectedTab].intersectionRatio
		)) {
			if (Date.now() - clickTimestamp.current > 1000) {
				setSelectedTab(undefined)
			}
		}
	}, [selectedOrActiveTab, selectedTab, activeTab, activeTabs])

	return entries.length > 1
		? <div className={componentClassName()}>
			<div className={componentClassName('content')}>
				{entries.map(([, { id, label }]) => (
					<TabButton
						key={id}
						isSelected={selectedOrActiveTab === id}
						onClick={() => {
							const element = document.getElementById(id)

							if (element) {
								element.tabIndex = 0
								element.focus({ preventScroll: true })
								element.blur()
								element.tabIndex = -1
								element.scrollIntoView({ behavior: 'smooth' })
								setSelectedTab(id)
								clickTimestamp.current = Date.now()
							}
						}}
					>
						{label}
					</TabButton>
				))}
			</div>
		</div>
		: null
})

SectionTabs.displayName = 'SectionTabs'
