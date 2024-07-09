import { Button } from '../ui/button'
import { ArrowLeftIcon } from 'lucide-react'
import { dict } from '../dict'

export type BackButtonProps = {
	label?: string
}

export const BackButton = ({ label }: BackButtonProps) => {
	return (
		<Button
			variant={'ghost'}
			className={'gap-1'}
			onClick={() => history.back()}
		>
			<ArrowLeftIcon size={16}/>
			<span>{label ?? dict.backButton.back}</span>
		</Button>
	)
}
