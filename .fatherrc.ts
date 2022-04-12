// https://github.com/umijs/father
// 注意有些单词的大小写
export default {
  esm: 'babel',
  umd: {
    file: 'umd',
    sourcemap: true,
  },
  extraBabelPlugins: [
    // https://github.com/umijs/father#extrababelplugins
    [
      'babel-plugin-import',
      {
        libraryName: 'antd',
        libraryDirectory: 'es',
        style: true,
      },
    ],
  ],
  lessInBabelMode: true, // https://github.com/umijs/father#lessinbabelmode
};
