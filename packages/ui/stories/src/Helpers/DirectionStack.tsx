import { ReactNode, useCallback, useState } from 'react'
import { Stack, StackProps } from '../../../src'

export const DirectionStack = ({ children }: { children: ReactNode }) => {
  const [direction, setDirection] = useState<StackProps['direction']>('vertical')

	const onChange: React.ChangeEventHandler<HTMLInputElement> = useCallback(event => {
		setDirection(event.target.checked ? 'horizontal' : 'vertical')
	}, [])

	return <>
		<label>
			<input checked={direction === 'horizontal'} name="horizontal-direction" type="checkbox" onChange={onChange} /> horizontal
		</label>
		<Stack gap="none" direction={direction} style={{ width: '100%' }}>
      {children}
    </Stack>
  </>
}
