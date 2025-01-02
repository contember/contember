import { Slot } from '@radix-ui/react-slot'
import { BrushIcon } from 'lucide-react'
import { ReactNode } from 'react'
import { Title } from '~/app/components/title'
import { Slots } from '~/lib/layout'
import { ToastContent, ToastType, useShowToast } from '~/lib/toast'
import { Button } from '~/lib/ui/button'

const ToastTrigger = ({ type, description, title, ...props }: {
	title: string
	description?: string
	type?: ToastType
	children: ReactNode
}) => {
	const showToast = useShowToast()

	const onClick = () => {
		showToast(
			<ToastContent title={title} children={description} />,
			{
				type,
			},
		)
	}

	return <Slot onClick={onClick} {...props} />
}

export default () => (
	<>
		<Slots.Title>
			<Title icon={<BrushIcon />}>Toasts</Title>
		</Slots.Title>
		<div className="flex gap-4 items-start">
			<ToastTrigger title="Info toast" description="This is description for info toast">
				<Button>Show info toast</Button>
			</ToastTrigger>
			<ToastTrigger title="Success toast" description="This is description for success toast" type="success">
				<Button>Show success toast</Button>
			</ToastTrigger>
			<ToastTrigger title="Warning toast" description="This is description for warning toast" type="warning">
				<Button>Show warning toast</Button>
			</ToastTrigger>
			<ToastTrigger title="Error toast" description="This is description for error toast" type="error">
				<Button>Show error toast</Button>
			</ToastTrigger>
		</div>
	</>
)
