import * as path from 'path'
import { fileURLToPath, URL } from 'node:url'
import legacyPlugin from '@vitejs/plugin-legacy'
import postcssImport from 'postcss-import'
import babel from 'vite-plugin-babel'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import autoprefixer from 'autoprefixer'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    legacyPlugin({
      targets: ['chrome 52', 'ie >= 11'], // 需要兼容的目标列表，可以设置多个
      additionalLegacyPolyfills: ['regenerator-runtime/runtime'] // 面向IE11时需要此插件
    }),
    babel({
      babelHelpers: 'bundled',
      presets: [
        [
          '@babel/preset-env',
          {
            targets: {
              ie: '11'
            },
            useBuiltIns: 'entry',
            corejs: 3
          }
        ]
      ]
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  base: './',
  build: {
    target: ['es2015', 'chrome68', 'safari15', 'firefox78'],
    minify: 'terser', // 使用 terser 进行压缩
    assetsDir: 'assets'
  },
  css: {
    postcss: {
      plugins: [
        autoprefixer(),
        postcssImport({
          root: process.cwd(), // 根目录
          path: ['src'], // 别名路径
          resolveId: (id, basedir) => {
            if (id.startsWith('@')) { // 打包时处理css中的@别名
              return id.replace('@', path.join(basedir, '..', 'src'))
            }
            return id
          }
        })
      ],
    },
  },
  pluginOptions: {
    electronBuilder: {
      builderOptions: {
        appId: 'com.example.params-validate-tool',
        productName: 'Params Validate Tool',
        // 更多配置选项...
      }
    }
  }
})
