import { Slots } from '../components/slots'
import { PersistButton } from '../components/binding/PersistButton'
import { Binding } from '../components/binding/Binding'
import { EntitySubTree, Field, useField } from '@contember/interface'
import { InputField } from '../components/form'
import * as React from 'react'
import { Button } from '../components/ui/button'


export const basic = () => <>
    <Binding>
        <Slots.Actions>
            <PersistButton/>
        </Slots.Actions>
        <EntitySubTree entity={'InputRoot(unique=unique)'} setOnCreate={'(unique=unique)'}>
            <div className={'space-y-4'}>
                <InputField field={'textValue'} label={'Text'} description={'Hello world'}/>
                <InputField field={'intValue'} label={'Number'} />
                <InputField field={'floatValue'} label={'Float'} />
                <InputField field={'dateValue'} label={'Date'} />
                <InputField field={'datetimeValue'} label={'Date time'} />
            </div>
        </EntitySubTree>
    </Binding>
</>


const FillValue = () => {
    const field = useField('textValue')
    return <>
        <Button onClick={() => field.updateValue('123')}>Fill invalid</Button>
        <Button onClick={() => field.updateValue('abc')}>Fill valid</Button>
    </>
}
export const clientValidation = () => <>
    <Binding>
        <Slots.Actions>
            <PersistButton/>
        </Slots.Actions>
        <EntitySubTree entity={'InputRoot(unique=unique)'} setOnCreate={'(unique=unique)'}>
            <div className={'space-y-4'}>
                <div className={'pl-52 space-x-4'}>
                    <FillValue/>
                </div>
                <InputField field={'textValue'} label={'Name'} inputProps={{ pattern: '[a-z]+' }}/>
            </div>
        </EntitySubTree>
    </Binding>
</>
