import { Button, ButtonGroup, ButtonList, ButtonProps, Label, Select, Stack, Tag, TextInput, TextareaInput } from '@contember/admin'
import { ArrowLeftIcon, ArrowRightIcon } from 'lucide-react'
import { Fragment, useState } from 'react'
import { SlotSources } from '../components/Slots'

export default () => {
	const [accent, setAccent] = useState<ButtonProps['accent']>('theme')
	const [size, setSize] = useState<'small' | 'medium' | 'large'>('medium')

	return (
		<>
			<SlotSources.Title>Buttons</SlotSources.Title>

			<SlotSources.ContentHeader>
				<Stack horizontal wrap>
					<Stack horizontal align="center" gap="gap">
						<Label>Size:</Label>
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
					</Stack>

					<Stack horizontal align="center" gap="gap">
						<Label>Accent:</Label>
						<Select
							value={accent}
							notNull={true}
							options={[
								{ value: 'theme', label: 'theme' },
								{ value: 'strong', label: 'strong' },
								{ value: false, label: 'false' },
							]}
							onChange={it => setAccent(it ?? 'theme')}
						/>
					</Stack>
				</Stack>
			</SlotSources.ContentHeader>

			<TextInput name="name" placeholder="Enter name..." />
			<TextareaInput minRows={4} maxRows={9} name="message" placeholder="Enter message..." defaultValue={'1\n2\n3\n4\n5\n6\n7\n8\n9\n10'} />

			<Tag>hi</Tag>

			{[ButtonList, ButtonGroup].map((Wrapper, index) => (
				<Fragment key={index}>
					<div>
						<Wrapper>
							<Button accent={accent} size={size}>Default</Button>
							<TextInput placeholder="Enter text..." name="name" />
							<Button accent={accent} size={size} elevated>Elevated</Button>
							<Button accent={accent} size={size} active>Default</Button>
							<Button accent={accent} size={size}>Go <ArrowRightIcon /></Button>
							<Button accent={accent} size={size} disabled>Default</Button>
							<Button accent={accent} size={size} square>+</Button>
							<Button accent={accent} size={size} borderRadius={false}><ArrowLeftIcon /></Button>
							<Button accent={accent} size={size}><ArrowLeftIcon /></Button>
							<Button accent={accent} size={size} square><ArrowRightIcon /></Button>
							<Button accent={accent} size={size} borderRadius="gutter"><ArrowRightIcon /></Button>
							<Button accent={accent} size={size} borderRadius="full"><ArrowRightIcon /></Button>
						</Wrapper>
						Lorem ipsum
					</div>

					<div>
						<Wrapper>
							<Button accent={accent} size={size} distinction="inverse">Inverse</Button>
							<TextInput placeholder="Enter text..." name="name" />
							<Button accent={accent} size={size} distinction="inverse" elevated>Elevated Inverse</Button>
							<Button accent={accent} size={size} distinction="inverse" active>Inverse</Button>
							<Button accent={accent} size={size} distinction="inverse">Go <ArrowRightIcon /></Button>
							<Button accent={accent} size={size} distinction="inverse" disabled>Inverse</Button>
							<Button accent={accent} size={size} distinction="inverse" square>+</Button>
							<Button accent={accent} size={size} distinction="inverse" borderRadius={false}><ArrowLeftIcon /></Button>
							<Button accent={accent} size={size} distinction="inverse"><ArrowLeftIcon /></Button>
							<Button accent={accent} size={size} distinction="inverse" square><ArrowRightIcon /></Button>
							<Button accent={accent} size={size} distinction="inverse" borderRadius="gutter"><ArrowRightIcon /></Button>
							<Button accent={accent} size={size} distinction="inverse" borderRadius="full"><ArrowRightIcon /></Button>
						</Wrapper>
						Lorem ipsum
					</div>

					<div>
						<Wrapper>
							<Button accent={accent} size={size} distinction="primary">Primary</Button>
							<TextInput placeholder="Enter text..." name="name" />
							<Button accent={accent} size={size} distinction="primary" elevated>Elevated Primary</Button>
							<Button accent={accent} size={size} distinction="primary" active>Primary</Button>
							<Button accent={accent} size={size} distinction="primary">Go <ArrowRightIcon /></Button>
							<Button accent={accent} size={size} distinction="primary" disabled>Primary</Button>
							<Button accent={accent} size={size} distinction="primary" square>+</Button>
							<Button accent={accent} size={size} distinction="primary" borderRadius={false}><ArrowLeftIcon /></Button>
							<Button accent={accent} size={size} distinction="primary"><ArrowLeftIcon /></Button>
							<Button accent={accent} size={size} distinction="primary" square><ArrowRightIcon /></Button>
							<Button accent={accent} size={size} distinction="primary" borderRadius="gutter"><ArrowRightIcon /></Button>
							<Button accent={accent} size={size} distinction="primary" borderRadius="full"><ArrowRightIcon /></Button>
						</Wrapper>
						Lorem ipsum
					</div>

					<div>
						<Wrapper>
							<Button accent={accent} size={size} distinction="seamless">Seamless</Button>
							<TextInput placeholder="Enter text..." name="name" />
							<Button accent={accent} size={size} distinction="seamless" elevated>Elevated Seamless</Button>
							<Button accent={accent} size={size} distinction="seamless" active>Seamless</Button>
							<Button accent={accent} size={size} distinction="seamless">Go <ArrowRightIcon /></Button>
							<Button accent={accent} size={size} distinction="seamless" disabled>Seamless</Button>
							<Button accent={accent} size={size} distinction="seamless" square>+</Button>
							<Button accent={accent} size={size} distinction="seamless" borderRadius={false}><ArrowLeftIcon /></Button>
							<Button accent={accent} size={size} distinction="seamless"><ArrowLeftIcon /></Button>
							<Button accent={accent} size={size} distinction="seamless" square><ArrowRightIcon /></Button>
							<Button accent={accent} size={size} distinction="seamless" borderRadius="gutter"><ArrowRightIcon /></Button>
							<Button accent={accent} size={size} distinction="seamless" borderRadius="full"><ArrowRightIcon /></Button>
						</Wrapper>
						Lorem ipsum
					</div>

					<div>
						<Wrapper>
							<Button accent={accent} size={size} distinction="outlined">Outlined</Button>
							<TextInput placeholder="Enter text..." name="name" />
							<Button accent={accent} size={size} distinction="outlined" elevated>Elevated Outlined</Button>
							<Button accent={accent} size={size} distinction="outlined" active>Outlined</Button>
							<Button accent={accent} size={size} distinction="outlined">Go <ArrowRightIcon /></Button>
							<Button accent={accent} size={size} distinction="outlined" disabled>Outlined</Button>
							<Button accent={accent} size={size} distinction="outlined" square>+</Button>
							<Button accent={accent} size={size} distinction="outlined" borderRadius={false}><ArrowLeftIcon /></Button>
							<Button accent={accent} size={size} distinction="outlined"><ArrowLeftIcon /></Button>
							<Button accent={accent} size={size} distinction="outlined" square><ArrowRightIcon /></Button>
							<Button accent={accent} size={size} distinction="outlined" borderRadius="gutter"><ArrowRightIcon /></Button>
							<Button accent={accent} size={size} distinction="outlined" borderRadius="full"><ArrowRightIcon /></Button>
						</Wrapper>
						Lorem ipsum
					</div>

					<div>
						<Wrapper>
							<Button accent={accent} size={size} distinction="toned">Toned</Button>
							<TextInput placeholder="Enter text..." name="name" />
							<Button accent={accent} size={size} distinction="toned" elevated>Elevated Toned</Button>
							<Button accent={accent} size={size} distinction="toned" active>Toned</Button>
							<Button accent={accent} size={size} distinction="toned">Go <ArrowRightIcon /></Button>
							<Button accent={accent} size={size} distinction="toned" disabled>Toned</Button>
							<Button accent={accent} size={size} distinction="toned" square>+</Button>
							<Button accent={accent} size={size} distinction="toned" borderRadius={false}><ArrowLeftIcon /></Button>
							<Button accent={accent} size={size} distinction="toned"><ArrowLeftIcon /></Button>
							<Button accent={accent} size={size} distinction="toned" square><ArrowRightIcon /></Button>
							<Button accent={accent} size={size} distinction="toned" borderRadius="gutter"><ArrowRightIcon /></Button>
							<Button accent={accent} size={size} distinction="toned" borderRadius="full"><ArrowRightIcon /></Button>
						</Wrapper>
						Lorem ipsum
					</div>
				</Fragment>
			))}
		</>
	)
}
