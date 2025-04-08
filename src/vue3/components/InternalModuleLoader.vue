<script setup lang="ts">
import { Component, ComponentOptions, DefineComponent, onMounted, ref } from 'vue'
import { ModuleType, preloadModule } from '../../core'
import ModuleProvider from './ModuleProvider.vue'

export type VueComponent = Component | ComponentOptions | DefineComponent<unknown, unknown, unknown>

const props = defineProps<{
  module: ModuleType
  loadingComponent: VueComponent
  errorComponent: VueComponent
  isRootModule: boolean
}>()

const isLoaded = ref(false)
const error = ref<Error | null>(null)
const isLoading = ref(true)

onMounted(async () => {
  try {
    await preloadModule(props.module, props.isRootModule)
    isLoaded.value = true
  } catch (err) {
    console.error('Error loading module:', props.module.name, err)
    error.value = err instanceof Error ? err : new Error(String(err))
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <component :is="loadingComponent" v-if="isLoading" />
  <component :is="errorComponent" v-else-if="error" :error="error" />
  <ModuleProvider v-else-if="isLoaded" :module="module">
    <slot></slot>
  </ModuleProvider>
</template>
