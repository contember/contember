import { Slot } from '@radix-ui/react-slot'
import { ReactNode } from 'react'
import { ToastContent, ToastType, useShowToast } from '@app/lib/toast'
import { Button } from '@app/lib/ui/button'

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

export default <>
	<div className={'flex flex-col gap-2 items-start'}>
		<ToastTrigger title={'Info toast'} description={'Lorem ipsum dolor sit amet'}><Button>Show info toast</Button></ToastTrigger>
		<ToastTrigger title={'Success toast'} description={'Lorem ipsum dolor sit amet'} type={'success'}><Button>Show success toast</Button></ToastTrigger>
		<ToastTrigger title={'Warning toast'} description={'Lorem ipsum dolor sit amet'} type={'warning'}><Button>Show warning toast</Button></ToastTrigger>
		<ToastTrigger title={'Error toast'} description={'Lorem ipsum dolor sit amet'}  type={'error'}><Button>Show error toast</Button></ToastTrigger>

	</div>
</>
