import { Button } from '../../lib/components/ui/button'
import { ArrowLeftIcon } from 'lucide-react'

export const BackButton = () => {
	return (
		<Button
			variant={'ghost'}
			className={'gap-1'}
			onClick={() => history.back()}
		>
			<ArrowLeftIcon size={16}/>
			<span>Back</span>
		</Button>
	)
}
