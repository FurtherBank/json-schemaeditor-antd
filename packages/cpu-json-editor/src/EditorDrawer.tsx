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
  const [open, setOpen] = useState(false)
  useImperativeHandle(ref, () => ({
    setDrawer: (route: string[] | undefined, field: string | undefined, isVisible = true) => {
      setOpen(isVisible)
      setAccess({
        route,
        field
      })
    }
  }))

  const { route, field } = access

  const onClose = () => {
    setOpen(false)
  }

  const Drawer = ctx.getComponent(null, ['drawer'])

  return (
    <Drawer onClose={onClose} open={open}>
      {route !== undefined && open ? <Field viewport="drawer" route={route} field={field} canNotRename /> : null}
    </Drawer>
  )
}

const FieldDrawer = React.forwardRef(FieldDrawerBase)

export default FieldDrawer
