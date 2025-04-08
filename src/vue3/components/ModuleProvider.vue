<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { ModuleManagerFactory, ModuleType } from '../../core'
import { provideModule } from '../context/moduleContext'

const props = defineProps<{
  module: ModuleType
}>()

provideModule(props.module)

onMounted(async () => {
  const moduleManager = ModuleManagerFactory.getInstance()

  try {
    if (!moduleManager.isModuleLoaded(props.module)) {
      await moduleManager.loadModule(props.module)
    }
  } catch (error) {
    console.error(`Error loading module ${props.module.name}:`, error)
  }
})

onUnmounted(() => {
  ModuleManagerFactory.getInstance().unloadModule(props.module)
})
</script>

<template>
<slot></slot>
</template>
