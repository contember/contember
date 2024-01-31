import { PersistTrigger } from '@contember/interface'
import { Button } from '../ui/button'
import { FeedbackTrigger } from './FeedbackTrigger'

export const PersistButton = () => {
	return (
		<FeedbackTrigger>
			<PersistTrigger>
				<Button size={'lg'}>Save data</Button>
			</PersistTrigger>
		</FeedbackTrigger>
	)
}
