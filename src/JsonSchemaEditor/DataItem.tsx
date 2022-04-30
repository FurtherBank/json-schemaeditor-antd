import React, { PropsWithChildren } from 'react';
import { TSelectableItemProps, createSelectable } from 'react-selectable-fast';

export type DataItemProps = {
  id: number;
};

const DataItem = createSelectable<DataItemProps>(
  (props: TSelectableItemProps & PropsWithChildren<DataItemProps>) => {
    const { selectableRef, isSelected, isSelecting, children } = props;

    const classNames = [
      'ant-select-item ant-select-item-option ant-select-item-option-active',
      false,
      isSelecting && 'ant-select-item-option-selected',
      isSelected && 'ant-select-item-option-selected',
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div ref={selectableRef} className={classNames}>
        {children}
      </div>
    );
  },
);

export default DataItem;
