import { Block, DiscriminatedBlocks, MultiEditScope, NumberField, PersistButton, TextField } from '@contember/admin'
import { Title } from '../components/Directives'
import { Slots } from '../components/Slots'

export default () => (
	<>
		<Title>Quiz!</Title>
		<Slots.Content>
			<MultiEditScope entities="QuizResult" listProps={{
				beforeContent: <Slots.Actions><PersistButton /></Slots.Actions>,
			}}>
				<TextField label="Answer" field="answer" />
				<DiscriminatedBlocks field={'state'} label={undefined}>
					<Block discriminateBy={'pending'} label={'Pending'} />
					<Block discriminateBy={'failed'} label={'Failed'}>
						<TextField field={'failReason'} label={'Reason'} />
					</Block>
					<Block discriminateBy={'succeed'} label={'Succeed'}>
						<NumberField field={'successRating'} label={'Rating'} />
					</Block>
				</DiscriminatedBlocks>
			</MultiEditScope>
		</Slots.Content>
	</>
)
