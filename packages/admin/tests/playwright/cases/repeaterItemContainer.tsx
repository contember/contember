import { Layout, LayoutPage, RepeaterItemContainer, StyleProvider } from '@contember/ui'

const dummyInput = (
	<div style={{ backgroundColor: 'lightBlue', border: '1px solid blue', borderRadius: '0.25em', height: '2.25em', minWidth: '2.25em' }}></div>
)

const Handle = () => <>=</>

export default function () {
	return (
		<StyleProvider>
			<Layout>
				<LayoutPage>
					<RepeaterItemContainer dragHandleComponent={Handle}>
						{dummyInput}
						{dummyInput}
						{dummyInput}
					</RepeaterItemContainer>
					<RepeaterItemContainer>
						{dummyInput}
						{dummyInput}
						{dummyInput}
					</RepeaterItemContainer>
				</LayoutPage>
			</Layout>
		</StyleProvider>
	)
}
