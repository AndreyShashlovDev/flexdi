<script setup lang="ts">
import { ModuleType } from '../../core'
import InternalModuleLoader, { VueComponent } from './InternalModuleLoader.vue'

const props = defineProps<{
  module: ModuleType
  loadingComponent: VueComponent
  errorComponent: VueComponent
}>()
</script>

<template>
  <InternalModuleLoader
      :module="props.module"
      :loading-component="props.loadingComponent"
      :error-component="props.errorComponent"
      :is-root-module='false'
  >
    <slot></slot>
  </InternalModuleLoader>
</template>
