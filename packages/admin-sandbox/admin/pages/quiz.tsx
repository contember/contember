import { Block, DiscriminatedBlocks, MultiEditPage, NumberField, TextField } from '@contember/admin'

export default () => (
	<MultiEditPage entities="QuizResult" pageName="quiz">
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
	</MultiEditPage>
)
