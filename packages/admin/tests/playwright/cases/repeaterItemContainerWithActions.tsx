import { Trash2Icon } from 'lucide-react'
import { Button, ButtonProps, Intent, Layout, LayoutPage, RepeaterItemContainer, Stack } from '../../../src'

const dummyInput = (
	<div style={{ backgroundColor: 'lightBlue', border: '1px solid blue', padding: '0.25em', height: '2.25em', minWidth: '2.25em' }}></div>
)

const paddings = ['gap', 'gutter', 'padding'] satisfies ButtonProps['padding'][]
const buttonDistinctions: ButtonProps['distinction'][] = ['seamless', undefined, 'outlined', 'primary', 'toned']
const intent: Intent = 'danger'

export default function () {
	return (
		<Layout>
			<LayoutPage>
				<Stack horizontal>
					{paddings.map(padding => (
						<Stack key={padding}>
							<strong>padding: {padding}</strong>
							{buttonDistinctions.map(distinction => {
								const buttonProps = {
									padding,
									intent,
									distinction,
								}

								return (
									<RepeaterItemContainer
										key={distinction}
										label={distinction ?? 'default'}
										actions={<>
											<Button square borderRadius={false} {...buttonProps}><Trash2Icon /></Button>
											<Button square borderRadius {...buttonProps}><Trash2Icon /></Button>
											<Button square borderRadius="gap" {...buttonProps}><Trash2Icon /></Button>
											<Button square borderRadius="gutter" {...buttonProps}><Trash2Icon /></Button>
											<Button square borderRadius="full" {...buttonProps}><Trash2Icon /></Button>
										</>}
									>{dummyInput}</RepeaterItemContainer>
								)
							})}
						</Stack>
					))}
				</Stack>
				<style>{`@media (max-width: 1023.98px) {
					.cui-stack[data-direction="horizontal"] {
						flex-direction: column;
					}
				}`}
				</style>
			</LayoutPage>
		</Layout>
	)
}
