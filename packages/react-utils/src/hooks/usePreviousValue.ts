import * as React from 'react'

export const usePreviousValue = <Value>(value: Value) => {
	const ref = React.useRef<Value>(value)
	React.useEffect(() => {
		ref.current = value
	})
	return ref.current
}
