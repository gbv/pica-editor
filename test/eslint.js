const lint = require("mocha-eslint")

let paths = [
  "src/**/*.js",
  "src/**/*.vue",
  "example/**/*.js",
  "example/**/*.vue",
]
let options = {
  contextName: "ESLint",
}
lint(paths, options)
