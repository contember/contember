import { CSSProperties, Fragment } from 'react'
import { Divider, FieldContainer, FieldContainerProps, Layout, LayoutPage, StyleProvider } from '../../../src'

const verticalStack: CSSProperties = { display: 'flex', flexDirection: 'column', gap: '1em' }
const horizontalStack: CSSProperties = { display: 'flex', flexDirection: 'row', gap: '1em' }

const positions: FieldContainerProps['labelPosition'][] = [
	'default',
	'labelInlineLeft',
	'labelInlineRight',
	'labelLeft',
	'labelRight',
]

const dummyInput = (
	<div style={{ backgroundColor: 'lightBlue', border: '1px solid blue', borderRadius: '0.25em', height: '2.25em', minWidth: '2.25em' }}></div>
)

export default function () {
	return (
		<Layout>
			<LayoutPage>
				<div style={verticalStack}>
					{positions.map(position => <Fragment key={position}>
						<div style={horizontalStack}>
							<FieldContainer
								label="Lorem ipsum"
								labelPosition={position}
							>{dummyInput}</FieldContainer>

							<Divider />

							<FieldContainer
								label="Lorem ipsum"
								description="Lorem ipsum dolor sit amet"
								labelPosition={position}
							>{dummyInput}</FieldContainer>

							<Divider />

							<FieldContainer
								label="Lorem ipsum"
								labelDescription="Lorem ipsum dolor"
								description="Lorem ipsum dolor sit amet"
								labelPosition={position}
							>{dummyInput}</FieldContainer>

							<Divider />
						</div>

						<Divider />
					</Fragment>)}
				</div>
			</LayoutPage>
		</Layout>
	)
}
