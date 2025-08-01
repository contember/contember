import { BrushIcon, HomeIcon } from 'lucide-react'
import { Title } from '~/app/components/title'
import { Button } from '~/lib/ui/button'
import { GenericPage } from '~/lib/pages'

export default () => (
	<GenericPage title={<Title icon={<BrushIcon />}>Buttons</Title>}>
		<div className={'flex flex-col gap-2 items-start h-screen'}>
			<h2 className={'text-2xl'}>Button variants</h2>
			<Button>Default button</Button>
			<Button variant="outline">Outline button</Button>
			<Button variant="ghost">Ghost button</Button>
			<Button variant="secondary">Secondary button</Button>
			<Button variant="destructive">Destructive button</Button>
			<Button variant="link">Link button</Button>

			<h2 className={'text-2xl'}>Button sizes</h2>
			<Button>Default size</Button>
			<Button size="sm">Small size</Button>
			<Button size="lg">Large size</Button>
			<Button size="icon"><HomeIcon /></Button>
		</div>
	</GenericPage>
)
