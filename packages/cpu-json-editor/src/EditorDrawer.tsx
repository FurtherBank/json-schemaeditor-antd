import React, { useContext, useImperativeHandle, useState } from 'react'
import Field from './Field'
import { InfoContext } from './JsonSchemaEditor'

interface DrawerAccess {
  route: string[] | undefined
  field: string | undefined
}

const FieldDrawerBase = (props: any, ref: React.Ref<unknown> | undefined) => {
  const ctx = useContext(InfoContext)
  const [access, setAccess] = useState<DrawerAccess>({
    route: undefined,
    field: undefined
  })
  const [visible, setVisible] = useState(false)
  useImperativeHandle(ref, () => ({
    setDrawer: (route: string[] | undefined, field: string | undefined, isVisible = true) => {
      setVisible(isVisible)
      setAccess({
        route,
        field
      })
    }
  }))

  const { route, field } = access

  const onClose = () => {
    setVisible(false)
  }

  const Drawer = ctx.getComponent(null, ['drawer'])

  return (
    <Drawer onClose={onClose} visible={visible}>
      {route !== undefined && visible ? <Field viewport="drawer" route={route} field={field} canNotRename /> : null}
    </Drawer>
  )
}

const FieldDrawer = React.forwardRef(FieldDrawerBase)

export default FieldDrawer
