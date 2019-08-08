import * as React from 'react'
import { storiesOf } from '@storybook/react'
import { Toaster } from '../../src/components/ui/Toaster'
import { DummyAdmin } from '../DummyAdmin'
import { ToastType } from '../../src/state/toasts'

storiesOf('Toaster', module).add('simple', () => (
	<DummyAdmin
		toasts={[
			{ message: 'Success', type: ToastType.Success, id: '1' },
			{ message: 'Warning', type: ToastType.Warning, id: '2' },
			{ message: 'Fail', type: ToastType.Error, id: '3' },
			{ message: 'Info', type: ToastType.Info, id: '4' },
		]}
	>
		<Toaster />
	</DummyAdmin>
))
