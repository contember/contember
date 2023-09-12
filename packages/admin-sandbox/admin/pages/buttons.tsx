import { Button, ButtonGroup, ButtonList, ButtonProps, Select, Tag, TextInput, TextareaInput } from '@contember/admin'
import { ArrowLeftIcon, ArrowRightIcon } from 'lucide-react'
import { Fragment, useState } from 'react'
import { SlotSources } from '../components/Slots'

export default () => {
	const [size, setSize] = useState<'small' | 'medium' | 'large'>('medium')

	return (
		<>
			<SlotSources.Title>Buttons</SlotSources.Title>
			<TextInput name="name" placeholder="Enter name..." />
			<TextareaInput minRows={4} maxRows={9} name="message" placeholder="Enter message..." defaultValue={'1\n2\n3\n4\n5\n6\n7\n8\n9\n10'} />

			<Select
				value={size}
				notNull={true}
				options={[
					{ value: 'small', label: 'small' },
					{ value: 'medium', label: 'medium' },
					{ value: 'large', label: 'large' },
				]}
				onChange={it => setSize(it ?? 'medium')}
			/>

			<Tag>hi</Tag>

			{[ButtonList, ButtonGroup].map((Wrapper, index) => (
				<Fragment key={index}>
					<div>
						<Wrapper>
							<Button size={size}>Default</Button>
							<TextInput placeholder="Enter text..." name="name" />
							<Button size={size} elevated>Elevated</Button>
							<Button size={size} active>Default</Button>
							<Button size={size}>Go <ArrowRightIcon /></Button>
							<Button size={size} disabled>Default</Button>
							<Button size={size} square>+</Button>
							<Button size={size} borderRadius={false}><ArrowLeftIcon /></Button>
							<Button size={size}><ArrowLeftIcon /></Button>
							<Button size={size} square><ArrowRightIcon /></Button>
							<Button size={size} borderRadius="gutter"><ArrowRightIcon /></Button>
							<Button size={size} borderRadius="full"><ArrowRightIcon /></Button>
						</Wrapper>
						Lorem ipsum
					</div>

					<div>
						<Wrapper>
							<Button size={size} distinction="inverse">Inverse</Button>
							<TextInput placeholder="Enter text..." name="name" />
							<Button size={size} distinction="inverse" elevated>Elevated Inverse</Button>
							<Button size={size} distinction="inverse" active>Inverse</Button>
							<Button size={size} distinction="inverse">Go <ArrowRightIcon /></Button>
							<Button size={size} distinction="inverse" disabled>Inverse</Button>
							<Button size={size} distinction="inverse" square>+</Button>
							<Button size={size} distinction="inverse" borderRadius={false}><ArrowLeftIcon /></Button>
							<Button size={size} distinction="inverse"><ArrowLeftIcon /></Button>
							<Button size={size} distinction="inverse" square><ArrowRightIcon /></Button>
							<Button size={size} distinction="inverse" borderRadius="gutter"><ArrowRightIcon /></Button>
							<Button size={size} distinction="inverse" borderRadius="full"><ArrowRightIcon /></Button>
						</Wrapper>
						Lorem ipsum
					</div>

					<div>
						<Wrapper>
							<Button size={size} distinction="primary">Primary</Button>
							<TextInput placeholder="Enter text..." name="name" />
							<Button size={size} distinction="primary" elevated>Elevated Primary</Button>
							<Button size={size} distinction="primary" active>Primary</Button>
							<Button size={size} distinction="primary">Go <ArrowRightIcon /></Button>
							<Button size={size} distinction="primary" disabled>Primary</Button>
							<Button size={size} distinction="primary" square>+</Button>
							<Button size={size} distinction="primary" borderRadius={false}><ArrowLeftIcon /></Button>
							<Button size={size} distinction="primary"><ArrowLeftIcon /></Button>
							<Button size={size} distinction="primary" square><ArrowRightIcon /></Button>
							<Button size={size} distinction="primary" borderRadius="gutter"><ArrowRightIcon /></Button>
							<Button size={size} distinction="primary" borderRadius="full"><ArrowRightIcon /></Button>
						</Wrapper>
						Lorem ipsum
					</div>

					<div>
						<Wrapper>
							<Button size={size} distinction="seamless">Seamless</Button>
							<TextInput placeholder="Enter text..." name="name" />
							<Button size={size} distinction="seamless" elevated>Elevated Seamless</Button>
							<Button size={size} distinction="seamless" active>Seamless</Button>
							<Button size={size} distinction="seamless">Go <ArrowRightIcon /></Button>
							<Button size={size} distinction="seamless" disabled>Seamless</Button>
							<Button size={size} distinction="seamless" square>+</Button>
							<Button size={size} distinction="seamless" borderRadius={false}><ArrowLeftIcon /></Button>
							<Button size={size} distinction="seamless"><ArrowLeftIcon /></Button>
							<Button size={size} distinction="seamless" square><ArrowRightIcon /></Button>
							<Button size={size} distinction="seamless" borderRadius="gutter"><ArrowRightIcon /></Button>
							<Button size={size} distinction="seamless" borderRadius="full"><ArrowRightIcon /></Button>
						</Wrapper>
						Lorem ipsum
					</div>

					<div>
						<Wrapper>
							<Button size={size} distinction="outlined">Outlined</Button>
							<TextInput placeholder="Enter text..." name="name" />
							<Button size={size} distinction="outlined" elevated>Elevated Outlined</Button>
							<Button size={size} distinction="outlined" active>Outlined</Button>
							<Button size={size} distinction="outlined">Go <ArrowRightIcon /></Button>
							<Button size={size} distinction="outlined" disabled>Outlined</Button>
							<Button size={size} distinction="outlined" square>+</Button>
							<Button size={size} distinction="outlined" borderRadius={false}><ArrowLeftIcon /></Button>
							<Button size={size} distinction="outlined"><ArrowLeftIcon /></Button>
							<Button size={size} distinction="outlined" square><ArrowRightIcon /></Button>
							<Button size={size} distinction="outlined" borderRadius="gutter"><ArrowRightIcon /></Button>
							<Button size={size} distinction="outlined" borderRadius="full"><ArrowRightIcon /></Button>
						</Wrapper>
						Lorem ipsum
					</div>

					<div>
						<Wrapper>
							<Button size={size} distinction="toned">Toned</Button>
							<TextInput placeholder="Enter text..." name="name" />
							<Button size={size} distinction="toned" elevated>Elevated Toned</Button>
							<Button size={size} distinction="toned" active>Toned</Button>
							<Button size={size} distinction="toned">Go <ArrowRightIcon /></Button>
							<Button size={size} distinction="toned" disabled>Toned</Button>
							<Button size={size} distinction="toned" square>+</Button>
							<Button size={size} distinction="toned" borderRadius={false}><ArrowLeftIcon /></Button>
							<Button size={size} distinction="toned"><ArrowLeftIcon /></Button>
							<Button size={size} distinction="toned" square><ArrowRightIcon /></Button>
							<Button size={size} distinction="toned" borderRadius="gutter"><ArrowRightIcon /></Button>
							<Button size={size} distinction="toned" borderRadius="full"><ArrowRightIcon /></Button>
						</Wrapper>
						Lorem ipsum
					</div>
				</Fragment>
			))}

		</>
	)
}
