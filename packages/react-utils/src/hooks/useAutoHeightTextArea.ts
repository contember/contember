import { px } from '@contember/utilities'
import { useCallback, useLayoutEffect } from 'react'
import { RefObjectOrElement, unwrapRefValue } from './unwrapRefValue'
import { useOnElementResize } from './useOnElementResize'

export const useAutoHeightTextArea = (
	textAreaRef: RefObjectOrElement<HTMLTextAreaElement>,
	value: string,
	minRows: number,
	maxRows: number,
) => {
	const measure = useCallback(async (ref: HTMLTextAreaElement | null, minRows: number, maxRows: number) => {
		if (ref) {
			const rowsAttribute = ref.rows

			ref.style.height = ''
			ref.style.minHeight = ''
			ref.style.maxHeight = ''

			if (minRows !== maxRows) {
				const height = ref.scrollHeight
				let minHeight: number
				let maxHeight: number

				ref.rows = minRows
				minHeight = await ref.getBoundingClientRect().height

				if (maxRows === Infinity) {
					maxHeight = Infinity
				} else {
					ref.rows = maxRows
					maxHeight = await ref.getBoundingClientRect().height
				}

				ref.style.height = px(height)
				ref.style.minHeight = px(minHeight)
				ref.style.maxHeight = px(maxHeight)
			}

			ref.rows = rowsAttribute
		}
	}, [])

	useOnElementResize(textAreaRef, () => {
		measure(unwrapRefValue(textAreaRef), minRows, maxRows)
	})

	useLayoutEffect(() => {
		measure(unwrapRefValue(textAreaRef), minRows, maxRows)
	}, [maxRows, measure, minRows, textAreaRef, value])
}
