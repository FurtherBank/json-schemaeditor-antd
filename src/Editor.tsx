import React from 'react';
import { createStore, Store } from 'redux';
import { Provider } from 'react-redux';
import Field from './Field';
import { reducer } from './reducer';

interface EditorProps {
  editionName: string;
  onChange?: (data: any) => void | null;
  data?: any;
}

export default class Editor extends React.Component<EditorProps> {
  static defaultProps: { onChange: null };
  store: Store;
  constructor(props: EditorProps) {
    super(props);
    // const change = () => {
    //   if (this.props.onChange && typeof this.props.onChange == 'function') {
    //     this.props.onChange(this.store.getState().data);
    //   }
    // };
    // 异步加载的时候，可以在加载完schema和json，并设置完store的时候正式render一次
    const initialState = {
      data: props.data,
      editionName: props.editionName,
      schema: {},
      lastChangedRoute: [],
      lastChangedField: []
    };
    this.store = createStore(reducer, initialState);
    // this.store.subscribe(change)
  }

  render() {
    // const { doAction } = this.props;
    // route 由 react 组件控制，data 由 redux 控制
    return (
      <Provider store={this.store}>
        <Field route={[]} field={null} />
      </Provider>
    );
  }
}

// connect(null, { doAction })(Editor);
