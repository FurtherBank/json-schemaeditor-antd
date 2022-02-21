import { jsonDataType } from "./utils";

const maxCollapseLayer = 5;

const toEnumName = (v: any) => {
  const t = jsonDataType(v);
  switch (t) {
    case "object":
      return v.hasOwnProperty("name")
        ? v.name.toString()
        : `Object[${Object.keys(v).length}]`;
    case "array":
      return `Array[${v.length}]`;
    case "null":
      return "null"; // 注意 null 没有 toString
    default:
      return v.toString();
  }
};

export { maxCollapseLayer, toEnumName };
