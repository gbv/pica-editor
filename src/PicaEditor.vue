<template>
  <form
    class="PicaEditor"
    @submit.prevent="loadRecord(inputPPN.trim())">
    <div
      v-if="header"
      class="PicaEditorPanel top">
      <div
        v-if="unapi && dbkey"
        style="float: right">
        <input
          v-model="inputPPN"
          type="text"
          placeholder="PPN">
        <button
          type="submit"
          :disabled="!inputPPN">
          laden
        </button>
      </div>
      <ul>
        <li v-if="picabase && dbkey">
          <a :href="picabase">{{ dbkey }}</a>
        </li>
        <li v-if="ppn">
          <label style="font-variant:small-caps">ppn </label>
          <a
            v-if="picabase"
            :href="picabase+'PPNSET?PPN='+ppn"
            target="opac"><code>{{ ppn }}</code></a>
          <span v-else>
            <code>{{ ppn }}</code>
          </span>
        </li>
      </ul>
    </div>
    <textarea
      ref="editor"
      v-model="text" />
    <div
      v-if="footer === true || (footer !== false && avram && field)"
      class="PicaEditorPanel bottom cm-s-default">
      <PicaFieldInfo
        :field="fieldSchedule || {unknown: field}"
        :subfield="subfield" />
    </div>
  </form>
</template>

<script>
import { serializePica, parsePica, getPPN, picaFieldSchedule } from "./pica.js"
import PicaFieldInfo from "./PicaFieldInfo.vue"
import CodeMirror from "codemirror"

import "./codemirror-pica.js"
import "./addon/lint.js"

// TODO: import from node_modules/codemirror
import "./codemirror.min.css"
import "./addon/active-line.js"
import "./addon/lint.css"

import { picaAtCursor, moveCursorNext } from "./PicaMirror.js"

function getTextChildren(nodes) {
  return nodes.map(node => typeof node.children === "string" ? node.children : "").join("")
}

// CodeMirror instance for PICA Plain records
export default {
  components: { PicaFieldInfo },
  props: {
    // display header
    header: {
      type: Boolean,
      default: true,
    },
    // display footer
    footer: {
      type: Boolean,
      default: undefined, // = if field info is available
    },
    // unAPI base URL to load records from
    unapi: {
      type: String,
      default: null,
    },
    // database key to load records from via unAPI
    dbkey: {
      type: String,
      default: null,
    },
    // base URL of catalog to link into
    picabase: {
      type: String,
      default: null,
    },
    // whether PICA record can be edited
    editable: {
      type: Boolean,
      default: true,
    },
    // Avram Schema
    avram: {
      type: Object,
      default: null,
    },
    // filter loaded records      
    filter: {
      type: Function,
      default: null,
    },
  },
  emits: ["update:record", "update:ppn"],
  data: function() {
    return {
      text: "",         // record in PICA Plain
      record: [],       // record in PICA/JSON
      inputPPN: null,   // PPN in input field
      ppn: null,        // PPN found in the record
      field: null,      // field identifier at cursor
      subfield: null,   // subfield code at cursor
    }
  },
  computed: {
    fieldSchedule() {
      return picaFieldSchedule(this.avram, this.field)
    },
  },
  created() {
    this.$watch("record", (record, old) => {
      if (record === old || JSON.stringify(record) === JSON.stringify(old)) return
      this.$emit("update:record", record)

      const ppn = getPPN(record)
      if (ppn && ppn !== this.ppn) {
        this.ppn = ppn
      }
    })

    this.$watch("ppn", (ppn, old) => {
      if (ppn === old) return
      this.$emit("update:ppn", ppn)
      if (!this.inputPPN) this.inputPPN = ppn
    })

    // get record in PICA Plain from element content
    const slot = this.$slots.default
    this.setText(slot ? getTextChildren(slot()) : "")
  },
  mounted: function() {
    const options = {
      mode: "pica",
      readOnly: !this.editable,
      styleActiveLine: true,
      lineWrapping: true,
      extraKeys: {
        Tab: e => moveCursorNext(e, this.avram),
      },
    }
    if (this.avram) {
      options.gutters = ["CodeMirror-lint-markers"]
    }
    this.$refs.editor.value = this.$refs.editor.value.trim()
    this.editor = CodeMirror.fromTextArea(this.$refs.editor, options)
    this.editor.on("change", editor => this.setText(editor.getValue()))
    const updateCursor = () => Object.assign(this, this.picaAtCursor(this.editor))
    this.editor.on("cursorActivity", updateCursor)
    updateCursor()
    this.$watch("avram", (avram) => {
      this.editor.setOption("lint", { avram })
    })
  },
  methods: {
    picaAtCursor,
    setText(text) {
      this.text = text
      this.record = parsePica(text)
    },
    setRecord(record) {
      this.record = record
      this.text = serializePica(record)
      if (this.editor) { // editor may not be mounted yet
        this.editor.setValue(this.text)
      }
    },
    loadRecord(ppn) {
      if (ppn) {
        this.ppn = ppn
      }
      if (!this.ppn || !this.dbkey) {
        this.setRecord([])
        return
      }
      fetch(`${this.unapi}?format=picajson&id=${this.dbkey}:ppn:${this.ppn}`)
        .then(response => response.ok ? response.json() : null)
        .then(record => {
          if (record) {
            if (this.filter) record = this.filter(record)
            this.setRecord(record)
          }
          if (this.$router) {
          // Push changed ppn and dbkey to router
            this.$router.push({
              query: {
                ppn: this.ppn,
                dbkey: this.dbkey,
              },
            })
          }
        })
    },
  },
}
</script>

<style>
.PicaEditor {
  border-left: 1px solid #ddd;
  border-right: 1px solid #ddd;
  font-size: 1rem;
}
.PicaEditor .CodeMirror-gutters {
  background: white;
  border: none;
}
.PicaEditor .CodeMirror-lint-mark-error,
.PicaEditor .CodeMirror-lint-mark-warning {
  background: #fcc;
}
.PicaEditor .CodeMirror {
  border-top: 1px solid #ddd;
  border-bottom: 1px solid #ddd;
  height: auto;
}
.PicaEditor .CodeMirror-scroll {
  min-height: 5em;
  max-height: 36em;
  padding: 0.5em;
}
.CodeMirror-hints { /* injected at the end of the DOM, out of .PicaEditor */
  font-size: 1rem;
}
.PicaEditorPanel {
  background: #f7f7f7;
  padding: 3px 7px;
  box-sizing: content-box;
  background: #f7f7f7;
  overflow: hidden;
}
.PicaEditorPanel.top {
  border-top: 1px solid #ddd;
  padding: 0.5em 0.7em;
}    
.PicaEditorPanel.bottom {
  border-bottom: 1px solid #ddd;
}    
.PicaEditorPanel label {
  color: #666;
}
.PicaEditorPanel code {
  font-family: monospace;
  font-size: 1rem;
  margin: 0;
  padding: 0;
  color: #000;
}
.PicaEditorPanel ul {
  display: inline;
  list-style: none;
  padding: 0;
}
.PicaEditorPanel li {
  display: inline;
  padding-right: 0.5em;
}
.PicaEditorPanel a {
  text-decoration: none;
}
.PicaEditorPanel a:hover {
  text-decoration: underline;
}
</style>
