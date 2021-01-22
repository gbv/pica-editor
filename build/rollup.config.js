import commonjs from "@rollup/plugin-commonjs"
import resolve from "@rollup/plugin-node-resolve"
import babel from "@rollup/plugin-babel"
import json from "@rollup/plugin-json"
import vue from "rollup-plugin-vue"
import css from "rollup-plugin-css-only"

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
    resolve(),
    vue({
      compileTemplate: true,
    }),
    commonjs(),
    css({ output: "pica-editor.css" }),
    json(),
    babel({
      babelHelpers: "bundled",
    }),
  ],
}
