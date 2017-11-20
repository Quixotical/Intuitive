import css from 'rollup-plugin-css-only'

export default {
  entry: 'js/main.js',
  dest: 'public/bundle.js',
  format: "iife",
  watch: {
    include: './**'
  },
  plugins: [
    css({ output: 'public/bundle.css' })
  ]
}
 //-w --o public/bundle.js -f umd --name "myBundle"
