import commonjs from "@rollup/plugin-commonjs"
import babel from "@rollup/plugin-babel"
import vue from "rollup-plugin-vue"
import css from "rollup-plugin-css-only"

export default {
  input: "src/PicaEditor.vue",
  output: {
    name: "PicaEditor",
    exports: "named",
    globals: {
      vue: "Vue",
      codemirror: "CodeMirror",
    },
  },
  plugins: [
    commonjs(),
    vue({
      css: true,
      compileTemplate: true,
    }),
    css({ output: "dist/pica-editor.css" }),
    babel(),
  ],
}
