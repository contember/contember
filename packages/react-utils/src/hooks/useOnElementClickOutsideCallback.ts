import { useEffect } from 'react'
import { RefObjectOrElement, unwrapRefValue } from './unwrapRefValue'

export function useOnElementClickOutsideCallback(
	refOrElement: RefObjectOrElement<HTMLElement>,
	callback: (event: MouseEvent) => void,
): void {
	useEffect(() => {
		const refValue = unwrapRefValue(refOrElement)

		const handleClickOutside = (event: MouseEvent) => {
			if (refValue && !refValue.contains(event.target as Node)) {
				callback(event)
			}
		}

		document.addEventListener('mousedown', handleClickOutside)

		return () => {
			document.removeEventListener('mousedown', handleClickOutside)
		}
	}, [callback, refOrElement])
}
