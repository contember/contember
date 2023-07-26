import { Button, ButtonGroup, ButtonList, Select, TextInput } from '@contember/admin'
import { ArrowRightIcon } from 'lucide-react'
import { Fragment } from 'react'
import { SlotSources } from '../components/Slots'

export default () => (
	<>
		<SlotSources.Title>Buttons</SlotSources.Title>
		<TextInput name="name" placeholder="Enter name..." />

		<Select options={[{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }]} />

		{[ButtonList, ButtonGroup].map((Wrapper, index) => (
			<Fragment key={index}>
				<div>
					<Wrapper>
						<Button>Default</Button>
						<Button elevated>Elevated</Button>
						<Button active>Default</Button>
						<Button>Go <ArrowRightIcon /></Button>
						<Button disabled>Default</Button>
						<Button square><ArrowRightIcon /></Button>
						<Button square borderRadius="full"><ArrowRightIcon /></Button>
						<Button square borderRadius="gutter"><ArrowRightIcon /></Button>
					</Wrapper>
					Lorem ipsum
				</div>

				<div>
					<Wrapper>
						<Button distinction="inverse">Inverse</Button>
						<Button distinction="inverse" elevated>Elevated Inverse</Button>
						<Button distinction="inverse" active>Inverse</Button>
						<Button distinction="inverse">Go <ArrowRightIcon /></Button>
						<Button distinction="inverse" disabled>Inverse</Button>
						<Button distinction="inverse" square><ArrowRightIcon /></Button>
						<Button distinction="inverse" square borderRadius="full"><ArrowRightIcon /></Button>
						<Button distinction="inverse" square borderRadius="gutter"><ArrowRightIcon /></Button>
					</Wrapper>
					Lorem ipsum
				</div>

				<div>
					<Wrapper>
						<Button distinction="primary">Primary</Button>
						<Button distinction="primary" elevated>Elevated Primary</Button>
						<Button distinction="primary" active>Primary</Button>
						<Button distinction="primary">Go <ArrowRightIcon /></Button>
						<Button distinction="primary" disabled>Primary</Button>
						<Button distinction="primary" square><ArrowRightIcon /></Button>
						<Button distinction="primary" square borderRadius="full"><ArrowRightIcon /></Button>
						<Button distinction="primary" square borderRadius="gutter"><ArrowRightIcon /></Button>
					</Wrapper>
					Lorem ipsum
				</div>

				<div>
					<Wrapper>
						<Button distinction="seamless">Seamless</Button>
						<Button distinction="seamless" elevated>Elevated Seamless</Button>
						<Button distinction="seamless" active>Seamless</Button>
						<Button distinction="seamless">Go <ArrowRightIcon /></Button>
						<Button distinction="seamless" disabled>Seamless</Button>
						<Button distinction="seamless" square><ArrowRightIcon /></Button>
						<Button distinction="seamless" square borderRadius="full"><ArrowRightIcon /></Button>
						<Button distinction="seamless" square borderRadius="gutter"><ArrowRightIcon /></Button>
					</Wrapper>
					Lorem ipsum
				</div>

				<div>
					<Wrapper>
						<Button distinction="outlined">Outlined</Button>
						<Button distinction="outlined" elevated>Elevated Outlined</Button>
						<Button distinction="outlined" active>Outlined</Button>
						<Button distinction="outlined">Go <ArrowRightIcon /></Button>
						<Button distinction="outlined" disabled>Outlined</Button>
						<Button distinction="outlined" square><ArrowRightIcon /></Button>
						<Button distinction="outlined" square borderRadius="full"><ArrowRightIcon /></Button>
						<Button distinction="outlined" square borderRadius="gutter"><ArrowRightIcon /></Button>
					</Wrapper>
					Lorem ipsum
				</div>

				<div>
					<Wrapper>
						<Button distinction="toned">Toned</Button>
						<Button distinction="toned" elevated>Elevated Toned</Button>
						<Button distinction="toned" active>Toned</Button>
						<Button distinction="toned">Go <ArrowRightIcon /></Button>
						<Button distinction="toned" disabled>Toned</Button>
						<Button distinction="toned" square><ArrowRightIcon /></Button>
						<Button distinction="toned" square borderRadius="full"><ArrowRightIcon /></Button>
						<Button distinction="toned" square borderRadius="gutter"><ArrowRightIcon /></Button>
					</Wrapper>
					Lorem ipsum
				</div>
			</Fragment>
		))}

	</>
)
