<template>
  <div class="PicaEditor">
    <div
      v-if="header"
      class="PicaEditorPanel top">
      <ul>
        <li v-if="selectedDatabase.picabase">
          <a :href="selectedDatabase.picabase">{{ selectedDatabase.dbkey }}</a>
        </li>
        <li v-if="recordPPN">
          <label style="font-variant:small-caps">ppn </label>
          <a
            v-if="selectedDatabase.picabase"
            :href="`${selectedDatabase.picabase}PPNSET?PPN=${recordPPN}`"
            target="opac"><code>{{ recordPPN }}</code></a>
          <span v-else>
            <code>{{ recordPPN }}</code>
          </span>
        </li>
      </ul>
      <div style="text-align: right">
        <pica-loader
          :dbkey="dbkey"
          v-model:record="record"
          :ppn="ppn" 
          :unapi="unapi"
          :databases="databases" />
        <pica-editor-menu>
          <li v-if="avramSchema">
            <a
              v-if="avramSchema.url"
              target="help"
              :href="avramSchema.url">
              {{ avramSchema.title || 'Format-Informationen' }}
            </a>
            <span v-else>{{ avramSchema.title || 'Format-Informationen vorhanden' }}</span>
          </li>
          <li v-if="avramSchema && typeof avram === 'string'">
            <a :href="avram">Avram-Schema</a>&#xA0;<a href="https://format.gbv.de/schema/avram/specification">ⓘ</a>
          </li>
        </pica-editor-menu>
      </div>
    </div>
    <textarea ref="editor" />
    <div
      v-if="footer === true || (footer !== false && avramSchema && field)"
      class="PicaEditorPanel bottom cm-s-default">
      <PicaFieldInfo 
        :field="fieldSchedule || (field ? {unknown: picaFieldIdentifier(field)} : {})"
        :subfield="subfield" />
    </div>
  </div>
</template>

<script>
import { serializePica, parsePica, getPPN, picaFieldSchedule, picaFieldIdentifier, reduceRecord } from "pica-data"
import PicaFieldInfo from "./PicaFieldInfo.vue"
import PicaEditorMenu from "./PicaEditorMenu.vue"
import PicaLoader from "./PicaLoader.vue"
import CodeMirror from "codemirror"

import "./codemirror-pica.js"
import "./addon/lint.js"

// TODO: import from node_modules/codemirror
import "./addon/active-line.js"
import "./addon/lint.css"

// TODO: move to pica-data
function expandAvramSchema(schema) {    
  if (!schema || !schema.fields) return schema

  for (let key in schema.fields) {
    const schedule = schema.fields[key]
    if (key.indexOf("/") >= 0) {
      const [tag, occ] = key.split("/")
      schedule.tag = tag
      schedule.occurrence = occ
    } else if (key.indexOf("x") >= 0) {
      const [tag, counter] = key.split("x")
      schedule.tag = tag
      schedule.counter = counter
      if (schedule.subfields && !("x" in schedule.subfields)) {
        schedule.subfields.x = {
          code: "x",
          label: "x-Occurrence", // TODO: what's the proper name?
          repeatable: false,
          required: true,
        }
        // TODO: add pattern
      }
    } else {
      schedule.tag = key
    }
  }

  return schema
}

import { picaAtCursor, moveCursorNext, configureMouse } from "./PicaMirror.js"

function getTextChildren(nodes) {
  return nodes.map(node => typeof node.children === "string" ? node.children : "").join("").trim()
}

// CodeMirror instance for PICA Plain records
export default {
  components: { PicaFieldInfo, PicaEditorMenu, PicaLoader },
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
      default: undefined,
    },    
    // PICA databases
    databases: {
      type: Array,
      default: () => [],
    },
    // PPN of the record to be loaded or placed in the PPN field 
    ppn: {
      type: String,
      default: null,
    },
    // added to unAPI query to filter response format
    xpn: {
      type: String,
      default: "",
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
  emits: ["update:record", "update:dbkey", "update:ppn"],
  data() {
    const filterRecord = typeof this.filter === "function" ? this.filter : null
    return {
      text: "",          // record in PICA Plain
      record: [],        // record in PICA/JSON
      recordPPN: null,   // PPN found in the record
      field: null,       // field at cursor
      subfield: null,    // subfield code at cursor
      filterRecord,      // filter function
      avramSchema: null, // Avram Schema object
      editor: null,      // CodeMirror instance
    }
  },
  computed: {
    selectedDatabase() {
      return (this.databases || []).find(db => db.dbkey === this.dbkey) || { }
    },
    fieldSchedule() {
      return picaFieldSchedule(this.avramSchema, this.field)
    },    
  },
  watch: {
    text(text, old) {
      if (text !== old) {
        this.record = parsePica(text)
      }
    },
    record(record, old) {
      if (record === old || JSON.stringify(record) === JSON.stringify(old)) return
      this.recordPPN = getPPN(record)
      this.text = serializePica(record)
      if (this.editor) {
        this.editor.getDoc().setValue(this.text)
      }
      this.$emit("update:record", record)
    },
    recordPPN(value) {
      this.$emit("update:ppn", value)
    },
  },
  created() {
    const slot = this.$slots.default
    this.text = slot ? getTextChildren(slot()) : ""
  },
  mounted() {
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
    this.editor.on("change", editor => this.text = editor.getValue())

    const updateCursor = () => Object.assign(this, this.picaAtCursor(this.editor))
    this.editor.on("cursorActivity", updateCursor)
    updateCursor()
         
    const updateSchema = (schema) => {
      this.avramSchema = expandAvramSchema(schema)
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
        this.fetchJSON(avram).then(updateSchema) // TODO: catch error?
      } else {
        updateSchema(avram)
      }
    }

    this.$watch("avram", updateAvram)
    updateAvram(this.avram)
  },
  methods: {
    picaAtCursor,
    picaFieldIdentifier,
    setText(text) {
      if (this.editor) {
        this.editor.setValue(text)
      } else {
        this.text = text
      }
    },
    setRecord(record) {
      this.record = this.filterRecord ? this.filterRecord(record) : record
      this.setText(serializePica(this.record))
    },
    // load a JSON document, keeping track of loading indicator and errors
    async fetchJSON(url) {
      return fetch(url).then(response => {
        if (response.ok) {
          return response.json()
        } else {
          throw Error(response.statusText)
        }
      }).catch(error => {
        throw error
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
    position: relative;
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
  display: flex;
  height: 1.5em;
  justify-content: space-between;
  align-items: center;
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
  margin: 0;
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
