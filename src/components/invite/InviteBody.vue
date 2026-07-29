<script setup lang="ts">
// Stub. One component per row lands here as each band of Frame 242 gets built.
// Band map and asset inventory: ../../../SLICING.md
const sections = [
  'Hero',
  'Quote',
  'Groom',
  'Divider',
  'Bride',
  'Glimpse',
  'Gallery',
  'Akad',
  'Resepsi',
  'Countdown',
  'Gift',
  'Rsvp',
  'Wish',
  'Footer',
]
</script>

<template>
  <div class="invite-body">
    <section v-for="name in sections" :key="name" class="invite-body__placeholder">
      {{ name }}
    </section>
  </div>
</template>

<style scoped>
.invite-body {
  background: #f2efe9;
}

.invite-body__placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 240px;
  border-bottom: 1px dashed #cfc6b4;
  font-size: 12px;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: #a89b83;
}
</style>
