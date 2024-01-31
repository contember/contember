import { Button } from '../../components/ui/button'
import { Slot } from '@radix-ui/react-slot'
import { ToastContent, ToastType, useShowToast } from '../../components/ui/toast'
import { ReactNode } from 'react'

const ToastTrigger = ({ type, description, title, ...props }: {
	title: string
	description?: string
	type?: ToastType
	children: ReactNode
}) => {
	const showToast = useShowToast()
	const onClick = () => {
		showToast(
			<ToastContent title={title} description={description} />,
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
