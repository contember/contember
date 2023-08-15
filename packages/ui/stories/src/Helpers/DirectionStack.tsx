import { ReactNode, useCallback, useState } from 'react'
import { Stack, StackProps } from '../../../src'

export const DirectionStack = ({ children }: { children: ReactNode }) => {
	const [horizontal, setHorizontal] = useState<StackProps['horizontal']>(false)

	const onChange: React.ChangeEventHandler<HTMLInputElement> = useCallback(event => {
		setHorizontal(event.target.checked ? true : false)
	}, [])

	return <>
		<label>
			<input checked={horizontal} name="horizontal-direction" type="checkbox" onChange={onChange} /> horizontal
		</label>
		<Stack gap={false} horizontal={horizontal} style={{ width: '100%' }}>
			{children}
		</Stack>
	</>
}
