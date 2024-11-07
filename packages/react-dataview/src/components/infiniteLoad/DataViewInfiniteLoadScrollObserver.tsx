import { useDataViewInfiniteLoadTrigger } from '../../contexts'
import * as React from 'react'
import { useEffect, useRef, useState } from 'react'

export const DataViewInfiniteLoadScrollObserver = () => {
	const triggerLoadMore = useDataViewInfiniteLoadTrigger()
	const ref = useRef<HTMLDivElement>(null)

	const [visible, setVisible] = useState(false)

	useEffect(() => {
		const observer = new IntersectionObserver(entries => {
			setVisible(entries[0].isIntersecting)
		})
		observer.observe(ref.current!)
		return () => {
			observer.disconnect()
		}
	}, [])

	useEffect(() => {
		if (visible) {
			triggerLoadMore?.()
		}
	}, [triggerLoadMore, visible])

	return <span ref={ref} />
}
