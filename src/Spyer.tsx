import React from "react"
const Spyer = (props: { children: boolean | React.ReactChild | React.ReactFragment | React.ReactPortal | null | undefined; }) => {
    console.log('渲染')
    return (<div>{props.children}</div>)
}
export default Spyer