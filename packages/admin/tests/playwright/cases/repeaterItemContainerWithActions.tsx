import { CSSProperties } from 'react'
import { Button, ButtonDistinction, ButtonFlow, Icon, Intent, Layout, LayoutPage, RepeaterItemContainer, StyleProvider } from '../../../src'

const verticalStack: CSSProperties = { display: 'flex', flexDirection: 'column', gap: '1em', flex: 1 }
const horizontalStack: CSSProperties = { display: 'flex', flexDirection: 'row', gap: '1em', flex: 1 }

const dummyInput = (
	<div style={{ backgroundColor: 'lightBlue', border: '1px solid blue', borderRadius: '0.25em', height: '2.25em', minWidth: '2.25em' }}></div>
)

const buttonFlows: ButtonFlow[] = ['default', 'circular', 'squarish']
const buttonDistinctions: ButtonDistinction[] = ['seamless', 'default', 'outlined', 'primary', 'toned']
const intent: Intent = 'danger'

export default function () {
	return (
		<StyleProvider>
			<Layout>
				<LayoutPage>
					<style>{`
					.cui-repeater-item-container-header:hover { background-color: #00CCFF33; }
					`}</style>
					<div style={horizontalStack}>
						{buttonFlows.map(flow => (
							<div key={flow} style={verticalStack}>
								<strong>flow: {flow}</strong>
								{buttonDistinctions.map(distinction => {
									const buttonProps = {
										flow,
										intent,
										distinction,
									}

									return (
										<RepeaterItemContainer
											key={distinction}
											label={distinction}
											actions={<>
												<Button {...buttonProps} size="small"><Icon blueprintIcon="trash" /></Button>
												<Button {...buttonProps}><Icon blueprintIcon="trash" /></Button>
												<Button {...buttonProps} size="large"><Icon blueprintIcon="trash" /></Button>
											</>}
										>{dummyInput}</RepeaterItemContainer>
									)
								})}
							</div>
						))}
					</div>
				</LayoutPage>
			</Layout>
		</StyleProvider>
	)
}
