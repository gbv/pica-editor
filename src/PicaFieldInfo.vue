<template>
  <table class="PicaFieldInfo">
    <tr v-if="field.unknown">
      <td style="text-align:right">
        <code class="cm-variable-2">{{ field.unknown }}</code>
      </td>
      <td />
      <td>❓</td>
      <td class="error">
        Unbekanntes Feld
      </td>
    </tr>
    <tr v-else>
      <td style="text-align:right">
        <code class="cm-variable-2">
          <span>{{ field.tag }}</span>
          <span v-if="field.occurrence">/{{ field.occurrence }}</span>
        </code>
      </td>
      <td>
        <code
          v-if="field.pica3"
          data-tooltip="Pica3"
          class="tooltip">{{ field.pica3 }}
        </code>
      </td>
      <td>
        <a
          v-if="field.url"
          target="help"
          data-tooltip="zur Dokumentation"
          :href="field.url">&#9432;</a>
      </td>
      <td style="width:100%">
        {{ field.label }}
        <span
          class="cardinality"
          v-text="cardinality(field)" />
      </td>
    </tr>
    <tr v-if="subfield || sf">
      <td>
        <code class="cm-comment">&nbsp;$</code>
        <code class="cm-keyword">{{ code }}</code>
      </td>
      <td>
        <code
          v-if="sf && sf.pica3"
          data-tooltip="Pica3">{{ sf.pica3 }}</code>
      </td>
      <td v-if="!sf">
        ❓
      </td>
      <td v-else>
        <a
          v-if="sf && sf.url"
          target="help"
          :href="sf.url">&#9432;</a>
      </td>
      <td v-if="sf">
        {{ sf.label }}
        <span
          class="cardinality"
          v-text="cardinality(sf)" />
      </td>
      <td
        v-else
        class="error">
        Unbekanntes Unterfeld
      </td>
    </tr>
    <tr v-else>
      <td colspan="3">
&nbsp;
      </td>
      <td v-if="field.subfields">
        <span
          v-for="(about, sfcode) in field.subfields"
          :key="sfcode"
          style="padding-right: 0.3em;"
          :data-tooltip="about.label">
          <a
            v-if="about.url"
            target="help"
            :href="about.url">
            <code class="cm-comment">$</code>
            <code class="cm-keyword">{{ sfcode }}</code>
          </a>
          <span v-else>
            <code class="cm-comment">$</code>
            <code class="cm-keyword">{{ sfcode }}</code>
          </span>
        </span>
      </td>
    </tr>
  </table>
</template>

<script>
export default {
  props: {
    // field definition
    field: {
      type: Object,
      required: true,
    },
    // subfield code
    subfield: {
      type: String,
      default: undefined,
    },
  },
  computed: {
    subfields() { return (this.field||{}).subfields || {} },
    code() {
      if (this.subfield) return this.subfield
      const codes = Object.keys(this.subfields)
      return (codes.length === 1 ? codes[0] : undefined)
    },
    sf() {
      return this.subfields[this.code]
    },
  },
  methods: {
    cardinality(field) {
      const msg = []
      if ("required" in field) msg.push(field.required ? "notwendig" : "optional")
      if ("repeatable" in field) msg.push(field.repeatable ? "wiederholbar" : "einmalig")
      return msg.join(", ")
    },
  },
}
</script>

<style scoped>
.error { color: #8b0000; }
.cardinality {
  float:right;
  color: #666;
}

[data-tooltip] {
  position: relative;
}

[data-tooltip]::after {
  content: attr(data-tooltip);

  display: block;
  white-space: nowrap;
  position: absolute;
  z-index: 100;
  left: 1.5em;
  bottom: -50%;

  transition: opacity 0.5s;
  color: #000;
  background: #ccc;
  font-family: sans-serif;
  border: 2px solid #f7f7f7;
  padding: 0.2em;

  visibility: hidden;  
  pointer-events: none;
  opacity: 0;
}

[data-tooltip]:hover::after {
  visibility: visible;
  opacity: 1;
}
</style>
