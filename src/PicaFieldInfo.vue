<template>
  <table class="PicaFieldInfo">
    <tr v-if="field">
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
          target="help"
          :href="field.url">&#9432;</a>
      </td>
      <td>{{ field.label }}</td>
      <td>
        <span v-if="'repeatable' in field">
          ({{ field.repeatable ? '+' : '1' }})
        </span>
      </td>
    </tr>
    <tr v-else>
      <td>&nbsp;</td>
    </tr>
    <tr v-if="subfield">
      <td style="text-align:right">
        <code class="cm-comment">&nbsp;&nbsp;$</code>
        <code class="cm-keyword">{{ subfield }}</code>
      </td>
      <td>
        <code v-if="sf && sf.pica3">{{ sf.pica3 }}</code>
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
      </td>
    </tr>
    <tr v-else>
      <td colspan="3">
&nbsp;
      </td>
      <td v-if="field.subfields">
        <span
          v-for="(about, code) in field.subfields"
          :key="code"
          style="padding-right: 0.3em;"
          :title="about.label">
          <a
            v-if="about.url"
            target="help"
            :href="about.url">
            <code class="cm-comment">$</code>
            <code class="cm-keyword">{{ code }}</code>
          </a>
          <span v-else>
            <code class="cm-comment">$</code>
            <code class="cm-keyword">{{ code }}</code>
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
      return ((this.field||{}).subfields||{})[this.subfield]
    },
  },
}
</script>
