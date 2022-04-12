import { defineConfig } from 'dumi';
import MonacoWebpackPlugin from 'monaco-editor-webpack-plugin';

export default defineConfig({
  title: 'json-schemaeditor-antd',
  favicon:
    'https://portrait.gitee.com/uploads/avatars/user/2779/8338200_furtherbank_1645079902.png!avatar200',
  logo: 'https://portrait.gitee.com/uploads/avatars/user/2779/8338200_furtherbank_1645079902.png!avatar200',
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
