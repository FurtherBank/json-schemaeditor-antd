import React, { useMemo } from 'react'
import { concatAccess } from '../../../utils'
import { EditionProps } from '../../core/type/props'
import { ConstEdition } from './ConstEdition'
import { useObjectListContent } from '../../core/hooks/useObjectListContent'
import { useFatherInfo } from '../../core/hooks/useFatherInfo'
import { ListDisplayPanel } from '../base/ListDisplayPanel'

const ObjectEditionPanel = (props: EditionProps) => {
  const { viewport, data, route, field, schemaEntry, fieldInfo } = props
  const { valueEntry, mergedValueSchema } = fieldInfo

  console.assert(typeof data === 'object' && !(data instanceof Array))

  const access = useMemo(() => {
    return concatAccess(route, field)
  }, [route, field])

  const fatherInfo = useFatherInfo(data, schemaEntry, valueEntry, mergedValueSchema)

  const lists = useObjectListContent(data, schemaEntry, fieldInfo)

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

export const ObjectEdition = (props: EditionProps) => {
  const { short } = props
  return short ? <ConstEdition {...props} /> : <ObjectEditionPanel {...props} />
}
