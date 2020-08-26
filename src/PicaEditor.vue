<template>
  <form
    class="PicaEditor"
    @submit.prevent="loadRecord(inputPPN)">
    <div class="panel">
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
        <li v-if="dbkey && picabase">
          <a :href="picabase">{{ dbkey }}</a>
        </li>
        <li>
          <a
            v-if="picabase && ppn"
            :href="picabase+'PPNSET?PPN='+ppn"
            target="opac"><code>{{ ppn }}</code></a>
        </li>
      </ul>
    </div>
    <textarea
      ref="editor"
      v-model="text" />
    <div class="panel cm-s-default">
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
    // get record in PICA Plain from element content
    const slot = this.$slots.default
    this.setText(slot ? getTextChildren(slot()) : "")

    this.$watch("record", (record, oldRecord) => {
      // TODO: skip if record equals oldRecord
      if (record === oldRecord) return
      this.ppn = getPPN(record) || this.ppn
      this.$emit("change", { record, ppn: this.ppn })
    })
  },
  mounted: function() {
    const options = {
      readOnly: !this.editable,
      styleActiveLine: true,
      lineWrapping: true,
    }
    this.editor = CodeMirror.fromTextArea(this.$refs.editor, options)
    this.editor.on("change", editor => this.setText(editor.getValue()))
    this.editor.on("cursorActivity", () => {
      const pica = this.picaAtCursor() || {}
      this.field = pica.field
      this.subfield = pica.subfield
    })
  },
  methods: {
    picaAtCursor() {
      const { line, ch } = this.editor.getCursor()
      const tokens = this.editor.getLineTokens(line)
      if (tokens.length && tokens[0].type === "variable-2") {
        var field = tokens[0].string
        var subfield
        for(const tok of tokens) {
          if (tok.type === "keyword") subfield = tok.string
          if (tok.end>ch) break
        }
        return { field, subfield }
      }
      return 
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
@import './codemirror.min.css';

.PicaEditor {
  border: 1px solid #ddd;
}

.PicaEditor .CodeMirror {
  border-top: 1px solid #ddd;
  border-bottom: 1px solid #ddd;
  height: auto;
}

.PicaEditor .panel {
  background: #f7f7f7;
  padding: 3px 7px;
}
.PicaEditor .panel ul {
  display: inline;
  list-style: none;
  padding: 0;
}
.PicaEditor .panel li {
  display: inline;
  padding-right: 0.5em;
}
.PicaEditor .panel a {
  text-decoration: none;
}
.PicaEditor .panel a:hover {
  text-decoration: underline;
}
.helpline {
  padding: 3px;
  height: 1.2em;
}
</style>
