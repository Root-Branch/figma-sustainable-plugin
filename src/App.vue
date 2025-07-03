<template>
  <div class="p-4 space-y-4">
    <div class="flex items-center space-x-3 mb-2">
      <img src="./assets/logo.png" alt="Cardamon Logo" class="w-auto h-8" />
      <div>
        <h1 class="text-xl font-bold text-ds-gray-100">Sustainable Advisor</h1>
        <p class="text-sm text-ds-gray-400">A Cardamon Tool</p>
      </div>
    </div>
    
    <!-- Tabs -->
    <div class="border-b border-ds-gray-500">
      <nav class="-mb-px flex space-x-6" aria-label="Tabs">
        <button
          v-for="tab in tabs"
          :key="tab.name"
          @click="currentTab = tab.name"
          :class="[
            currentTab === tab.name
              ? 'border-ds-teal-100 text-ds-teal-100'
              : 'border-transparent text-ds-gray-400 hover:text-ds-gray-100 hover:border-ds-gray-400',
            'whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm'
          ]"
        >
          {{ tab.name }}
        </button>
      </nav>
    </div>

    <!-- Tab Content -->
    <div>
      <keep-alive>
        <component :is="currentTabComponent" />
      </keep-alive>
    </div>
  </div>
</template>

<script setup>
import { shallowRef, computed } from 'vue';
import ColorAnalyzer from './components/ColorAnalyzer.vue';
import AISuggestion from './components/AISuggestion.vue';

const tabs = [
  { name: 'Color Analyzer' },
  { name: 'AI Suggestion' }
];

const currentTab = shallowRef('Color Analyzer');

const currentTabComponent = computed(() => {
  if (currentTab.value === 'AI Suggestion') {
    return AISuggestion;
  }
  return ColorAnalyzer;
});
</script> 