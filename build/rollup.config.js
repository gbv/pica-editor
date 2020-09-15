import commonjs from "@rollup/plugin-commonjs"
import resolve from '@rollup/plugin-node-resolve'
import babel from "@rollup/plugin-babel"
import vue from "rollup-plugin-vue"
import css from "rollup-plugin-css-only"
import fs from "fs"

export default {
  input: "src/PicaEditor.vue",
  output: {
    name: "PicaEditor",
    format: "umd",
    exports: "default",
    globals: {
      vue: "Vue",
      codemirror: "CodeMirror",
    },
  },
  external: ["vue", "codemirror"],
  plugins: [
    commonjs(),
    resolve(),
    vue({
      compileTemplate: true,
    }),
    css({ output: "dist/pica-editor.css" }),
    babel({
      babelHelpers: "bundled",
    }),
  ],
}
