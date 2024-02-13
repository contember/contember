import { Slots } from '../components/slots'
import { PersistButton } from '../components/binding/PersistButton'
import { Binding } from '../components/binding/Binding'
import { EntitySubTree } from '@contember/interface'
import * as React from 'react'
import { MultiSelectField, SelectField, SortableMultiSelectField } from '../components/select'
import { ScrollArea } from '../components/ui/scroll-area'
import { Field } from '@contember/react-binding'


export const hasOne = () => <>
    <Binding>
        <Slots.Actions>
            <PersistButton/>
        </Slots.Actions>
        <EntitySubTree entity={'SelectRoot(unique=unique)'} setOnCreate={'(unique=unique)'}>
            <div className={'space-y-4'}>
                <SelectField field={'hasOne'} options={'SelectValue'} filterField={'name'}>
                    <Field field={'name'}/>
                </SelectField>
            </div>
        </EntitySubTree>
    </Binding>
</>
export const hasMany = () => <>
    <Binding>
        <Slots.Actions>
            <PersistButton/>
        </Slots.Actions>
        <EntitySubTree entity={'SelectRoot(unique=unique)'} setOnCreate={'(unique=unique)'}>
            <div className={'space-y-4'}>
                <MultiSelectField field={'hasMany'} options={'SelectValue'} filterField={'name'}>
                    <Field field={'name'}/>
                </MultiSelectField>
            </div>
        </EntitySubTree>
    </Binding>
</>
export const hasManySortable = () => <>
    <Binding>
        <Slots.Actions>
            <PersistButton/>
        </Slots.Actions>
        <EntitySubTree entity={'SelectRoot(unique=unique)'} setOnCreate={'(unique=unique)'}>
            <div className={'space-y-4'}>
                <SortableMultiSelectField field={'hasManySorted'} options={'SelectValue'} filterField={'name'} connectAt={'value'} sortableBy={'order'}>
                    <Field field={'name'}/>
                </SortableMultiSelectField>
            </div>
        </EntitySubTree>
    </Binding>
</>
