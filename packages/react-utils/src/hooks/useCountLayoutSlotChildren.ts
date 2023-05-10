import { useLayoutEffect, useRef, useState } from 'react'
import { RefObjectOrElement, unwrapRefValue } from './unwrapRefValue'
import { useOnElementMutation } from './useOnElementMutation'

// TODO: Remove when Firefox supports :has selector, e.g.
// when selectors like `:has(:not(.layout-slot:empty))` work
// or below issue can be solved more easily:
//
// ISSUE:
// Targeting containers that are visibly empty and hide them
// or remove paddings without support for :has() is tedious.
/** @deprecated Check support for :has() for Firefox before using.  */
export function useCountLayoutSlotChildren(
	refOrElement: RefObjectOrElement<HTMLElement | undefined>,
	selector: string = '.layout-slot',
) {
	const [count, setCount] = useState(Infinity)

	const countChildren = useRef((element: HTMLElement | null | undefined) => {
		if (element) {
			setCount(element.querySelectorAll(`${selector} > *`).length)
		}
	})

	useOnElementMutation(refOrElement, () => {
		countChildren.current(unwrapRefValue(refOrElement))
	}, { attributes: true, childList: true, subtree: true })

	useLayoutEffect(() => {
		countChildren.current(unwrapRefValue(refOrElement))
	})

	return count
}

export function useHasEmptySlotsClassName(
	refOrElement: RefObjectOrElement<HTMLElement | undefined>,
) {
	const slotChildrenCount = useCountLayoutSlotChildren(refOrElement)

	if (slotChildrenCount === 0) {
		return 'has-empty-slots'
	} else {
		return 'has-non-empty-slots'
	}
}
