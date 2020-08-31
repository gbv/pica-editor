# pica-editor

![Test and build](https://github.com/gbv/pica-editor/workflows/Test%20and%20build/badge.svg)
![npm release](https://img.shields.io/npm/v/pica-editor)

[PICA+] record display and editor as Vue3 component based on [codemirror].

[codemirror]:https://codemirror.net/
[PICA+]: https://format.gbv.de/pica/plus

## Usage

### Direct usage as UMD module in the browser

First include CodeMirror and Vue.js 3 libraries:

~~~html
<script src="https://unpkg.com/codemirror"></script>
<script src="https://unpkg.com/vue@next"></script>
~~~

Then include the pica-editor library and its CSS file. The latter contains CodeMirror CSS, so no additional stylesheets are needed:

~~~html
<script src="https://unpkg.com/pica-editor"></script>
<link rel="stylesheet" href="https://unpkg.com/pica-editor/dist/pica-editor.css">
~~~

Finally create a Vue application that registers the `PicaEditor` component and make
use of the `<pica-editor>` element:

~~~html
<div id="app">
  ...
  <pica-editor>003@ $012345</pica-editor>
  ...
</div>
<script>
  Vue.createApp({ components: { PicaEditor } }).mount("#app")
</script>
~~~

### Usage as ES Module in web applications

*...not documented yet...*

### Configuration

*...not documented yet...*

## Development

During development run a webservice with vite:

~~~
npm run dev
~~~

To create distribution files in `dist/`:

~~~
npm run build
~~~

All commits should be done to the `dev` branch or to feature branches. For releases run `npm run release minor` or `npm run release patch`, this automatically tags and merges into the `release` branch and pushes to GitHub where the release is published at <https://www.npmjs.com/package/pica-editor> and as GitHub release.

## LICENSE

[MIT License](LICENSE)
