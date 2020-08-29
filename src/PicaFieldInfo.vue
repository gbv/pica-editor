<template>
  <table
    v-if="field"
    class="PicaFieldInfo">
    <tr>
      <td style="text-align:right">
        <code class="cm-variable-2">
          <span>{{ field.tag }}</span>
          <span v-if="field.occurrence">/{{ field.occurrence }}</span>
        </code>
      </td>
      <td>
        <code v-if="field.pica3">{{ field.pica3 }}</code>
      </td>
      <td>
        <a
          v-if="field.url"
          :href="field.url">&#9432;</a>
      </td>
      <td>{{ field.label }}</td>
      <td>
        <span v-if="'repeatable' in field">
          ({{ field.repeatable ? '+' : '1' }})
        </span>
      </td>
    </tr>
    <tr v-if="field.subfields && subfield">
      <td style="text-align:right">
        <code class="cm-comment">&nbsp;&nbsp;$</code>
        <code class="cm-keyword">{{ subfield }}</code>
      </td>
      <td>
        <code v-if="sf && sf.pica3">{{ sf.pica3 }}</code>
      </td>
      <td>
        <a
          v-if="sf && sf.url"
          :href="sf.url">&#9432;</a>
        <span v-else-if="!sf">❓</span>
      </td>
      <td v-if="sf">
        {{ sf.label }}
      </td>
    </tr>
    <tr v-else-if="field.subfields">
      <td>&nbsp;</td>
    </tr>
  </table>
</template>

<script>
export default {
  props: {
    // field definition
    field: {
      type: Object,
      default: null,
    },
    // subfield code
    subfield: {
      type: String,
      default: null,
    },
  },
  computed: {
    sf() { 
      return (this.subfields||{})[this.subfield]
    },
  },
}
</script>
