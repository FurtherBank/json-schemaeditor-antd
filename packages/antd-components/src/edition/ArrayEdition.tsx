import React, { useMemo } from 'react'
import { concatAccess } from '../../../utils'
import { EditionProps } from '../@cpu-studio/json-editor/type/props'
import { ConstEdition } from './ConstEdition'
import { useArrayListContent } from '../@cpu-studio/json-editor/hooks/useArrayListContent'
import { useFatherInfo } from '../@cpu-studio/json-editor/hooks/useFatherInfo'
import { ListDisplayPanel } from '../base/ListDisplayPanel'

const ArrayEditionPanel = (props: EditionProps) => {
  const { viewport, data, route, field, schemaEntry, fieldInfo } = props
  const { valueEntry, mergedValueSchema } = fieldInfo

  console.assert(data instanceof Array)

  const access = useMemo(() => {
    return concatAccess(route, field)
  }, [route, field])

  const fatherInfo = useFatherInfo(data, schemaEntry, valueEntry, mergedValueSchema)

  const lists = useArrayListContent(data, schemaEntry, fieldInfo)

  return (
    <ListDisplayPanel
      viewport={viewport}
      lists={lists}
      data={data}
      fieldInfo={fieldInfo}
      fatherInfo={fatherInfo}
      access={access}
    />
  )
}

export const ArrayEdition = (props: EditionProps) => {
  const { short } = props
  return short ? <ConstEdition {...props} /> : <ArrayEditionPanel {...props} />
}
