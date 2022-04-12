import { defineConfig } from 'dumi';
import MonacoWebpackPlugin from 'monaco-editor-webpack-plugin';

export default defineConfig({
  title: 'json-schemaeditor-antd',
  favicon:
    'https://user-images.githubusercontent.com/9554297/83762004-a0761b00-a6a9-11ea-83b4-9c8ff721d4b8.png',
  logo: 'https://user-images.githubusercontent.com/9554297/83762004-a0761b00-a6a9-11ea-83b4-9c8ff721d4b8.png',
  outputPath: 'docs-dist',
  mode: 'site',
  // more config: https://d.umijs.org/config
  antd: {
    compact: true,
  },

  chainWebpack: (config, { webpack }) => {
    config.plugin('monaco-editor').use(MonacoWebpackPlugin, [
      {
        languages: ['json'],
      },
    ]);
  },

  // dumi 文档发布需要做的事情
  history: {
    type: 'hash',
  },
  base: '/json-schemaeditor-antd/',
  publicPath: process.env.NODE_ENV === 'production' ? '/json-schemaeditor-antd/' : '/',
});
