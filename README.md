# pica-editor

[![Test and build](https://github.com/gbv/pica-editor/workflows/Test%20and%20build/badge.svg)](https://github.com/gbv/pica-editor/actions?query=workflow%3A%22Test+and+build%22)
[![npm release](https://img.shields.io/npm/v/pica-editor)](https://www.npmjs.com/package/pica-editor)

[PICA+] record display and editor as Vue3 component based on [CodeMirror].

[CodeMirror]:https://codemirror.net/
[PICA+]: https://format.gbv.de/pica/plus

![Screenshot](docs/pica-editor-screenshot.png)

## Usage

Try online at <https://gbv.github.io/pica-editor/>.

## Installation

### Direct use as UMD module in the browser

First include Vue.js 3 and CodeMirror libraries and CodeMirror CSS:

~~~html
<script src="https://unpkg.com/vue@next"></script>
<script src="https://unpkg.com/codemirror"></script>
<link rel="stylesheet" href="https://unpkg.com/codemirror/lib/codemirror.css">
~~~

Then include the pica-editor library and its CSS file.

~~~html
<script src="https://unpkg.com/pica-editor"></script>
<link rel="stylesheet" href="https://unpkg.com/pica-editor/dist/pica-editor.css">
~~~

Finally create a Vue application that registers the `PicaEditor` component and make use of the `<pica-editor>` element:

~~~html
<div id="app">
  ...
  <pica-editor>
    <pre>003@ $012345</pre>
  </pica-editor>
  ...
</div>
<script>
  Vue.createApp({
    components: { PicaEditor }
    // ...possibly extend your Vue app
  }).mount("#app")
</script>
~~~

### Use as ES Module in web applications

Not documented yet. The `example/*` subfolder contains project files to possibly learn from.

### Configuration

Editor instances can be configured with:

* `picabase`
* `unAPI`
* `dbkey`
* `fields`
* `avram`
* `editable`
* `@change`

See [source code](https://github.com/gbv/pica-editor/blob/dev/src/PicaEditor.vue) for details and examples at <https://gbv.github.io/pica-editor/#examples> for different configurations in practice.

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
