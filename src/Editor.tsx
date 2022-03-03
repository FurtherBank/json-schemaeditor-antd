import React from "react"
import { createStore, Store } from "redux"
import { Provider } from "react-redux"
import Field from "./Field"
import { ajvInstance, reducer } from "./reducer"
import FieldDrawer from "./FieldDrawer"
import Alert from "antd/lib/alert"

interface EditorProps {
  editionName: string
  onChange?: (data: any) => void | null
  data?: any
  schema: RootSchema | boolean
}

export default class Editor extends React.Component<EditorProps> {
  static defaultProps = { schema: true }
  store: Store
  drawerRef: React.RefObject<{ setDrawer: Function }>
  constructor(props: EditorProps) {
    super(props)
    this.drawerRef = React.createRef()
    const change = () => {
      if (this.props.onChange && typeof this.props.onChange == "function") {
        this.props.onChange(this.store.getState().data)
      }
    }
    let validate = undefined
    let schemaErrors = null
    try {
      validate = ajvInstance.compile(props.schema)
    } catch (error) {
      schemaErrors = error
    }
    // 异步加载的时候，可以在加载完schema和json，并设置完store的时候正式render一次
    const initialState = {
      data: props.data,
      editionName: props.editionName,
      rootSchema: this.props.schema,
      lastChangedRoute: [],
      lastChangedField: [],
      dataErrors: [],
      schemaErrors,
      cache: {
        ofCache: new Map(),
        propertyCache: new Map(),
        itemCache: new Map(),
      },
      validate: schemaErrors ? undefined : validate,
    }
    this.store = createStore(reducer, initialState)
    this.store.subscribe(change)
  }

  render() {
    // const { doAction } = this.props;
    const setDrawer = (...args: any[]) => {
      console.log("setDrawer", this.drawerRef.current, args)

      if (this.drawerRef.current) this.drawerRef.current.setDrawer(...args)
    }
    // route 由 react 组件控制，data 由 redux 控制
    return (
      <Provider store={this.store}>
        {/* {schemaErrors ? <Alert
      message="Error"
      description={schemaErrors}
      type="error"
      showIcon
    /> : null} */}
        <Field route={[]} field={null} schemaEntry="#" setDrawer={setDrawer} />
        <FieldDrawer ref={this.drawerRef} />
      </Provider>
    )
  }
}
