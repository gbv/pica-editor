import commonjs from "@rollup/plugin-commonjs"
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
    vue({
      compileTemplate: true,
    }),
    css({
      output: (_, styles) => {
        if (!fs.existsSync("dist")) fs.mkdirSync("dist")
        fs.writeFileSync("dist/pica-editor.css", Object.values(styles).filter(css => !css.match(/^\.CodeMirror{/)).join("\n"))
      },
    }),
    babel({
      babelHelpers: "bundled",
    }),
  ],
}
