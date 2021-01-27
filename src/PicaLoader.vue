<template>
  <form
    v-if="unapi && databases.length"
    :class="{ 'pica-loader': true, 'pica-loader-error': error }"
    @submit.prevent="load">
    <ul>
      <li>
        <select
          v-if="databases.length > 1"
          @change="$emit('update:dbkey',$event.target.value)">
          <option
            v-for="db in databases"
            :key="db.dbkey"
            :value="db.dbkey"
            :selected="selectedDatabase === db">
            <database-name :database="db" />
          </option>
        </select>
        <database-name
          v-else
          :database="selectedDatabase" />
      </li>
      <li>
        <input
          v-model="inputPPN"
          type="text"
          placeholder="PPN">
        <button
          type="submit"
          :disabled="isLoading || !validPPN"
          :style="{ fontWeight: inputPPN === loadedPPN ? 'normal' : 'bold' }">
          laden
        </button>
        <label>
          <input
            v-model="xpn"
            type="checkbox">
          <small>expand</small>
        </label>
        <a
          v-if="source"
          :href="source"
          class="pica-loader-source"
          title="PICA/JSON" />
      </li>
    </ul>
  </form>
</template>

<script>
import DatabaseName from "./DatabaseName.vue"

import { getPPN } from "pica-data"

const dbkeyPattern = new RegExp("^[a-z][a-z0-9-]*[a-z0-9]$")
const ppnPattern = new RegExp("^[0-9]+X?$")

export default {
  components: { DatabaseName },
  props: {
    // unAPI base URL to load records from
    unapi: {
      type: String,
      required: true,
    },      
    // List of available PICA databases with dbkey and optional title and picabase
    databases: {
      type: Array,
      validator: (value) => value.every(db => dbkeyPattern.exec(db.dbkey)),
      required: true,
    },

    // key of selected database (optional, can be bound with `v-model:dbkey`)
    dbkey: {
      type: String,        
      default: () => "",
    },    
    // PPN of the record (to be) loaded (optional, can be bound with `v-model:ppn`)
    ppn: {
      type: String,        
      default: () => "",
    },
    // enable offline expansion (default, can be bound with `v-model:expand`)      
    expand: {
      type: Boolean,
      default: true,
    },
    // record that has been loaded
    record: {
      type: Array,
      default: () => null,
    },
  },
  emits: ["update:dbkey", "update:ppn", "update:xpn", "update:record", "update:error", "update:source", "update:expand"],
  data() {
    return {
      inputPPN: this.ppn || getPPN(this.record),        
      loadedPPN: null,
      xpn: this.expand,
      isLoading: false,
      source: null,
      error: null,
    }
  },
  computed: {
    selectedDatabase() {
      const { databases, dbkey } = this        
      if (databases.length === 1 || !dbkey) return databases[0]
      return databases.find(db => db.dbkey === dbkey)
    },
    validPPN() {
      return (ppnPattern.exec(this.inputPPN) || [])[0]
    },
  },
  watch: {
    source(value) {
      this.$emit("update:source", value)
    },
    error(value) {
      this.$emit("update:error", value)
    },
    xpn(value, old) {
      if (value !== old && this.loadedPPN) {
        this.load()
      }
      this.$emit("update:expand", value)
    },
    ppn(value) {
      if (value !== this.inputPPN) {
        this.inputPPN = value
      }
      // trigger record loading
      if (!this.isLoading && value !== this.loadedPPN) {
        this.load()
      }
    },
    record(value) {
      const ppn = getPPN(value)
      if (ppn) {
        this.inputPPN = getPPN(value)
      }
    },
    dbkey(value, old) {
      if (this.inputPPN && old && old !== (this.selectedDatabase || {}).dbkey) {
        this.load()
      }
    },
  },
  created() {
    // make sure dbkey is one of the available databases
    const db = this.selectedDatabase
    if (db && db.dbkey !== this.dbkey) {
      this.$emit("update:dbkey", db.dbkey)
    }

    // automatically load record if PPN was given
    if (this.ppn) {
      this.load()
    }
  },
  methods: {
    // load selected record. Emits v-model change on `error` and `record` (on success)
    load() {
      const db = this.selectedDatabase || {}
      const ppn = this.validPPN

      var error = null

      if (!ppn) {
        error = "PPN fehlt oder syntaktisch fehlerhaft"
      } else if (!dbkeyPattern.exec(db.dbkey)) {
        error = "dbkey fehlt oder syntaktisch fehlerhaft"
      } else if (!this.unapi) {
        error = "unAPI-Konfiguration fehlt"
      }
        
      this.error = error
      if (error) return

      const xpn = this.xpn ? "" : "!xpn%3Donline"
      const source = `${this.unapi}?format=picajson&id=${db.dbkey}${xpn}:ppn:${ppn}`

      this.isLoading++
      fetch(source).then(response => {
        if (response.ok) {
          this.isLoading--
          response.json().then(record => {
            this.loadedPPN = getPPN(record) 
            this.$emit("update:record", record)
            if (this.ppn != ppn && this.loadedPPN === ppn) {
              this.$emit("update:ppn", ppn)
            }
            this.source = source
          })
        } else {
          throw Error(response.statusText)
        }
      }).catch(() => {
        this.isLoading--
        this.error = "Failed to load PICA record"
      })
    },
  },
}
</script>

<style>
.pica-loader {
  display: inline;
}
.pica-loader ul {
  display: inline;
  margin: 0;
  list-style: none;
  padding: 0;
}
.pica-loader li {
  display: inline;
  padding: 0 0.2em;
}
.pica-loader-error input {
  border: 1px solid #d00;
  background: #faa;
}
a.pica-loader-source::before {
  font-family: monospace;
  font-weight: bold;
  content: "[]";
  padding: 0 0.2em;
}
a.pica-loader-source {
  text-decoration: none;
}
a.pica-loader-source:hover {
  text-decoration: underline;
}
</style>
