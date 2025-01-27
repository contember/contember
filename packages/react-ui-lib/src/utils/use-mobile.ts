import { useEffect, useState } from 'react'

const MOBILE_BREAKPOINT = 768

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
