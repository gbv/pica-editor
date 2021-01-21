import vue from "@vitejs/plugin-vue"

module.exports = {
  plugins: [vue()],
  optimizeDeps: {
    include: [
      "codemirror",
    ],
  },
  build: {
    target: "es2015",
  },
  server: {
    open: "/example/"
  }
}
