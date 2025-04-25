import { useEffect, useState } from 'react'

const MOBILE_BREAKPOINT = 768

/**
 * `useIsMobile` is a responsive utility hook that returns a boolean indicating
 * whether the current viewport width is below the mobile breakpoint (768px).
 *
 * Useful for conditional rendering or styling based on mobile layout needs.
 *
 * #### Example: Conditional rendering for mobile
 * ```tsx
 * const MyComponent = () => {
 *   const isMobile = useIsMobile()
 *
 *   return (
 *     <div>
 *       {isMobile ? <MobileMenu /> : <DesktopMenu />}
 *     </div>
 *   )
 * }
 * ```
 */
export const useIsMobile = () => {
	const [isMobile, setIsMobile] = useState(() =>
		typeof window !== 'undefined' ? window.innerWidth < MOBILE_BREAKPOINT : false,
	)

	useEffect(() => {
		if (typeof window === 'undefined') return

		const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
		const onChange = () => setIsMobile(mql.matches)

		setIsMobile(mql.matches)

		if (mql.addEventListener) {
			mql.addEventListener('change', onChange)
			return () => mql.removeEventListener('change', onChange)
		} else {
			mql.addListener(onChange)
			return () => mql.removeListener(onChange)
		}
	}, [])

	return isMobile
}
