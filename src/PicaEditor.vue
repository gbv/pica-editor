<template>
  <form
    class="PicaEditor"
    @submit.prevent="loadRecord(inputPPN.trim())">
    <div
      v-if="header"
      class="PicaEditorPanel top">
      <div style="float:right">
        <span
          v-if="avramSchema"
          style="padding-right: 0.5em"
          :data-tooltip="avramSchema.title || 'Format-Informationen vorhanden'">
          <a
            v-if="avramSchema.url"
            target="help"
            :href="avramSchema.url">&#9432;</a>
          <a
            v-if="typeof avram === 'string'"
            :href="avram">⚙ </a>
        </span>
        <span v-if="srubase || (unapi && dbkey)">
          <input
            v-model="inputPPN"
            type="text"
            placeholder="PPN">
          <button
            type="submit"
            :disabled="!inputPPN">
            laden
          </button>
        </span>
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
      v-if="footer === true || (footer !== false && avramSchema && field)"
      class="PicaEditorPanel bottom cm-s-default">
      <PicaFieldInfo
        :field="fieldSchedule || {unknown: field}"
        :subfield="subfield" />
    </div>
  </form>
</template>

<script>
import { serializePica, parsePica, getPPN, picaFieldSchedule, reduceRecord } from "pica-data"
import PicaFieldInfo from "./PicaFieldInfo.vue"
import CodeMirror from "codemirror"

import "./codemirror-pica.js"
import "./addon/lint.js"

// TODO: import from node_modules/codemirror
import "./addon/active-line.js"
import "./addon/lint.css"

import { picaRecordViaSRU } from "./sru.js"

import { picaAtCursor, moveCursorNext, configureMouse } from "./PicaMirror.js"

function getTextChildren(nodes) {
  return nodes.map(node => typeof node.children === "string" ? node.children : "").join("").trim()
}

async function fetchJSON(url) {
  return fetch(url).then(response => response.ok ? response.json() : null)
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
      default: undefined, // show only if field info is available
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
    // SRU base URL to load records from
    srubase: {
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
    // Avram Schema or Schema URL
    avram: {
      type: [Object, String],
      default: null,
    },
    // filter loaded records      
    filter: {
      type: [Function, Boolean],
      default: null,
    },
  },
  emits: ["update:record", "update:ppn"],
  data: function() {
    const filterRecord = typeof this.filter === "function" ? this.filter : null
    return {
      text: "",          // record in PICA Plain
      record: [],        // record in PICA/JSON
      inputPPN: null,    // PPN in input field
      ppn: null,         // PPN found in the record
      field: null,       // field identifier at cursor
      subfield: null,    // subfield code at cursor
      filterRecord,      // filter function
      avramSchema: null, // Avram Schema object
    }
  },
  computed: {
    fieldSchedule() {
      return picaFieldSchedule(this.avramSchema, this.field)
    },
  },
  watch: {
    record(record, old) {
      if (record === old || JSON.stringify(record) === JSON.stringify(old)) return
      this.$emit("update:record", record)

      const ppn = getPPN(record)
      if (ppn && ppn !== this.ppn) {
        this.ppn = ppn
      }
    },
    ppn(ppn, old) {
      if (ppn === old) return
      this.$emit("update:ppn", ppn)
      if (!this.inputPPN) this.inputPPN = ppn
    },
  },
  created() {
    const slot = this.$slots.default
    this.setText(slot ? getTextChildren(slot()) : "")
  },
  mounted: function() {
    const options = {
      mode: "pica",
      value: this.text,
      readOnly: !this.editable,
      styleActiveLine: true,
      lineWrapping: true,
      extraKeys: {
        Tab: e => moveCursorNext(e, this.avramSchema),
      },
      configureMouse,
    }

    const ed = this.$refs.editor
    this.editor = CodeMirror(e => ed.parentNode.replaceChild(e, ed), options)

    this.editor.on("change", editor => this.setText(editor.getValue()))

    const updateCursor = () => Object.assign(this, this.picaAtCursor(this.editor))
    this.editor.on("cursorActivity", updateCursor)
    updateCursor()
         
    const updateSchema = (schema) => {
      this.avramSchema = schema
      if (schema && schema.fields) {            
        this.editor.setOption("gutters", ["CodeMirror-lint-markers"])
        this.editor.setOption("lint", { avram: schema })
        if (this.filter === true) {
          this.filterRecord = record => reduceRecord(record, schema)
          this.setRecord(this.record)            
        }
      } else {
        this.editor.setOption("lint", false)
        this.editor.setOption("gutters", [])
        if (this.filter === true) {
          this.filterRecord = null
        }
      }
    }

    const updateAvram = (avram) => {
      if (typeof avram === "string") {
        fetchJSON(avram).then(updateSchema)
      } else {
        updateSchema(avram)
      }
    }

    this.$watch("avram", updateAvram)
    updateAvram(this.avram)
  },
  methods: {
    picaAtCursor,
    setText(text) {
      this.text = text
      this.record = parsePica(text)
    },
    setRecord(record) {
      this.record = this.filterRecord ? this.filterRecord(record) : record
      this.text = serializePica(this.record)
      if (this.editor) { // editor may be not mounted yet
        this.editor.setValue(this.text)
      }
    },
    loadRecord(ppn) {
      const { unapi, srubase, dbkey } = this
      if (ppn) {
        this.ppn = ppn
      }
      if (!this.ppn || (unapi && !dbkey) || !(unapi || srubase)) {
        this.setRecord([])
        return
      }

      const fetchRecord = this.unapi
        ? fetchJSON(`${unapi}?format=picajson&id=${dbkey}:ppn:${this.ppn}`)
        : picaRecordViaSRU({ baseUrl: srubase }, this.ppn)

      fetchRecord.then(record => {
        if (record) this.setRecord(record)
        if (this.$router) this._pushRouter()
      })
    },
    // TODO: document this or remove
    _pushRouter() {
      // Push changed ppn and dbkey to router
      this.$router.push({
        query: {
          ppn: this.ppn,
          dbkey: this.dbkey,
        },
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
  padding: 0.5em;
}
.PicaEditor .CodeMirror-scroll {
  min-height: 1em;
  max-height: 36em;
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
