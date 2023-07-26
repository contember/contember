import { CSSProperties, Fragment } from 'react'
import { Divider, FieldContainer, FieldContainerProps, Layout, LayoutPage } from '../../../src'

const verticalStack: CSSProperties = { display: 'flex', flexDirection: 'column', gap: '1em' }
const horizontalStack: CSSProperties = { display: 'flex', flexDirection: 'row', gap: '1em' }

const positions: FieldContainerProps['labelPosition'][] = ['top', 'left', 'right', 'bottom']
const displays: FieldContainerProps['display'][] = ['block', 'inline']

const dummyInput = (
	<div style={{ backgroundColor: 'lightBlue', border: '1px solid blue', borderRadius: '0.25em', height: '2.25em', minWidth: '2.25em' }}></div>
)

export default function () {
	return (
		<Layout>
			<LayoutPage>
				<div style={verticalStack}>
					{positions.map(position => displays.map(display => <Fragment key={position}>
						<div style={horizontalStack}>
							<FieldContainer
								display={display}
								label={`${display} ${position}`}
								labelPosition={position}
							>{dummyInput}</FieldContainer>

							<Divider />

							<FieldContainer
								display={display}
								label={`${display} ${position}`}
								description="Lorem ipsum dolor sit amet"
								labelPosition={position}
							>{dummyInput}</FieldContainer>

							<Divider />

							<FieldContainer
								display={display}
								label={`${display} ${position}`}
								labelDescription="Lorem ipsum dolor"
								description="Lorem ipsum dolor sit amet"
								labelPosition={position}
							>{dummyInput}</FieldContainer>

							<Divider />
						</div>

						<Divider />
					</Fragment>))}
				</div>
			</LayoutPage>
		</Layout>
	)
}
