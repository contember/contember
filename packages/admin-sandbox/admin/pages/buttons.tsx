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
				<Wrapper>
					<Button>Default</Button>
					<Button active>Default</Button>
					<Button>Go <ArrowRightIcon /></Button>
					<Button disabled>Default</Button>
					<Button flow="squarish"><ArrowRightIcon /></Button>
					<Button flow="circular"><ArrowRightIcon /></Button>
				</Wrapper>

				<Wrapper>
					<Button distinction="primary">Primary</Button>
					<Button distinction="primary" active>Primary</Button>
					<Button distinction="primary">Go <ArrowRightIcon /></Button>
					<Button distinction="primary" disabled>Primary</Button>
					<Button distinction="primary" flow="squarish"><ArrowRightIcon /></Button>
					<Button distinction="primary" flow="circular"><ArrowRightIcon /></Button>
				</Wrapper>

				<Wrapper>
					<Button distinction="seamless">Seamless</Button>
					<Button distinction="seamless" active>Seamless</Button>
					<Button distinction="seamless">Go <ArrowRightIcon /></Button>
					<Button distinction="seamless" disabled>Seamless</Button>
					<Button distinction="seamless" flow="squarish"><ArrowRightIcon /></Button>
					<Button distinction="seamless" flow="circular"><ArrowRightIcon /></Button>
				</Wrapper>

				<Wrapper>
					<Button distinction="outlined">Outlined</Button>
					<Button distinction="outlined" active>Outlined</Button>
					<Button distinction="outlined">Go <ArrowRightIcon /></Button>
					<Button distinction="outlined" disabled>Outlined</Button>
					<Button distinction="outlined" flow="squarish"><ArrowRightIcon /></Button>
					<Button distinction="outlined" flow="circular"><ArrowRightIcon /></Button>
				</Wrapper>

				<Wrapper>
					<Button distinction="toned">Toned</Button>
					<Button distinction="toned" active>Toned</Button>
					<Button distinction="toned">Go <ArrowRightIcon /></Button>
					<Button distinction="toned" disabled>Toned</Button>
					<Button distinction="toned" flow="squarish"><ArrowRightIcon /></Button>
					<Button distinction="toned" flow="circular"><ArrowRightIcon /></Button>
				</Wrapper>
			</Fragment>
		))}

	</>
)
