<template>
  <div
    class="pica-editor-menu"
    @mouseover="visible = true"
    @mouseleave="visible = false">
    <span class="pica-editor-menu-dots">&#xFE19;</span>
    <ul
      v-if="visible"
      class="pica-editor-menu-list">
      <slot />
    </ul>
  </div>
</template>

<script>
export default {
  data() {
    return {
      visible: 0,
    }
  },
}</script>

<style>
  .pica-editor-menu {
      display: inline;
  }
  .pica-editor-menu-dots {
      font-weight: bold;
      padding: 1em 0em 1em 1em;
  }
  .pica-editor-menu ul.pica-editor-menu-list {
      position: absolute;
      z-index: 10;
      right: 0;
      display: block;
      padding: 0.5em 0.5em 0.5em 0.5em;
      margin-top: 0.5em;
      line-height: 1.5em;
      background: #f7f7f7;
      border-left: 1px solid #ddd;
      border-bottom: 1px solid #ddd;
      border-top: none;
  }
  ul.pica-editor-menu-list li {
      display: block;
  }
</style>
