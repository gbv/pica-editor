<template>
  <form
    class="PicaEditor"
    @submit.prevent="loadRecord(inputPPN)">
    <div class="PicaEditorPanel">
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
    <div class="PicaEditorPanel cm-s-default">
      <code
        v-if="field"
        class="cm-variable-2">{{ field }}</code>
      <span v-if="subfield">
        <code class="cm-comment">$</code>
        <code class="cm-keyword">{{ subfield }}</code>
      </span>
    </div>
  </form>
</template>

<script>
import { serializePica, parsePica, getPPN, filterPicaFields } from "./pica.js"
import CodeMirror from "codemirror"
import "./codemirror-pica.js"

// TODO: import from node_modules/codemirror
import "./codemirror.min.css"
import "./addon/active-line.js"

function getTextChildren(nodes) {
  return nodes.map(node => typeof node.children === "string" ? node.children : "").join("")
}

// CodeMirror instance for PICA Plain records
export default {
  props: {
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
    // list of PICA Path expressions to filter loaded records
    fields: {
      type: Array,
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
    schema: {
      type: Object,
      default: null,
    },
  },
  emits: ["change"],
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
  created() {
    this.$watch("record", (record, oldRecord) => {
      // TODO: skip if record deep-equals oldRecord
      if (record === oldRecord) return
      this.ppn = getPPN(record) || this.ppn
      this.$emit("change", { record, ppn: this.ppn })
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
    }
    this.editor = CodeMirror.fromTextArea(this.$refs.editor, options)
    this.editor.on("change", editor => this.setText(editor.getValue()))
    const updateCursor = () => Object.assign(this, this.picaAtCursor())
    this.editor.on("cursorActivity", updateCursor)
    updateCursor()
  },
  methods: {
    picaAtCursor() {
      const { line, ch } = this.editor.getCursor()
      const tokens = this.editor.getLineTokens(line)
      var field
      var subfield
      if (tokens.length && tokens[0].type === "variable-2") {
        field = tokens[0].string
        for(const tok of tokens) {
          if (tok.type === "keyword") subfield = tok.string
          if (tok.end>ch) break
        }
      }
      return { field, subfield } 
    },
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
            this.setRecord(this.fields ? filterPicaFields(record, this.fields) : record)
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
.PicaEditor .CodeMirror {
  border: none; 
  height: auto;
  padding: 3px;
}
.PicaEditorPanel {
  background: #f7f7f7;
  padding: 3px 7px;
  height: 1.25em;
  border-top: 1px solid #ddd;
  border-bottom: 1px solid #ddd;
  box-sizing: content-box;
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
