import { PersistTrigger } from '@contember/interface'
import { Button } from '../ui/button'
import { FeedbackTrigger } from './FeedbackTrigger'
import { Loader } from '../ui/loader'

export const PersistButton = () => {
	return (
		<FeedbackTrigger>
			<PersistTrigger>
				<Button size={'lg'} className="rounded-xl py-6 group relative">
					<Loader size="sm" position="absolute" className="hidden group-data-[loading]:block" />
					Save data
				</Button>
			</PersistTrigger>
		</FeedbackTrigger>
	)
}
