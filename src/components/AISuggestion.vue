<template>
  <div class="space-y-4">
    <div class="bg-ds-teal-100/20 border border-ds-teal-100 p-3 rounded">
      <p class="text-sm text-ds-gray-100">
        Select a frame to get AI-powered sustainability recommendations.
      </p>
    </div>
    
    <button
      @click="getSuggestion"
      :disabled="isLoading"
      class="w-full bg-ds-teal-100 text-ds-white font-medium py-2 px-4 rounded hover:bg-ds-teal-200 disabled:bg-ds-gray-400"
    >
      {{ isLoading ? 'Generating...' : 'Get Sustainable Suggestion' }}
    </button>

    <div v-if="message.text" class="p-3 rounded" :class="message.type === 'error' ? 'bg-red-50 border border-red-200 text-red-800' : message.type === 'warning' ? 'bg-orange-50 border border-orange-200 text-orange-800' : 'bg-ds-teal-100/20 border border-ds-teal-100 text-ds-gray-100'">
      {{ message.text }}
    </div>

    <div v-if="result.screenshotUrl" class="space-y-4">
              <div class="bg-ds-white border border-ds-gray-500 rounded p-4">
          <h3 class="font-bold text-lg mb-3 text-ds-gray-100">Selected Frame</h3>
          <div class="bg-ds-gray-600 rounded p-2">
            <img :src="result.screenshotUrl" class="w-full h-auto max-h-32 object-contain border rounded bg-ds-white" />
          </div>
        </div>

              <div class="bg-ds-white border border-ds-gray-500 rounded p-4">
          <h3 class="font-bold text-lg mb-3 text-ds-gray-100">AI Suggestions</h3>
          <div class="p-4 bg-ds-white rounded border border-ds-gray-500">
            <div v-if="isStreaming && !suggestions" class="flex gap-1">
              <div class="w-1.5 h-1.5 bg-ds-teal-100 rounded-full animate-pulse"></div>
              <div class="w-1.5 h-1.5 bg-ds-teal-100 rounded-full animate-pulse animation-delay-200"></div>
              <div class="w-1.5 h-1.5 bg-ds-teal-100 rounded-full animate-pulse animation-delay-400"></div>
            </div>
            <div class="suggestions-content" v-html="formattedSuggestions"></div>
            <div v-if="isStreaming && suggestions" class="mt-2 flex gap-1">
              <div class="w-1.5 h-1.5 bg-ds-teal-100 rounded-full animate-pulse"></div>
              <div class="w-1.5 h-1.5 bg-ds-teal-100 rounded-full animate-pulse animation-delay-200"></div>
              <div class="w-1.5 h-1.5 bg-ds-teal-100 rounded-full animate-pulse animation-delay-400"></div>
            </div>
          </div>
        </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import MarkdownIt from 'markdown-it';

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  breaks: true
});

md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
  const token = tokens[idx];
  token.attrPush(['class', 'text-ds-teal-100 hover:text-ds-teal-200 transition-colors']);
  token.attrPush(['target', '_blank']);
  token.attrPush(['rel', 'noopener noreferrer']);
  return self.renderToken(tokens, idx, options);
};

const isLoading = ref(false);
const message = ref({ text: '', type: '' });
const result = ref({ screenshotUrl: '', suggestionHtml: '' });
const suggestions = ref('');
const isStreaming = ref(false);

const formattedSuggestions = computed(() => {
  if (!suggestions.value) return '';
  return md.render(suggestions.value);
});

const getSuggestion = () => {
  isLoading.value = true;
  message.value = { text: 'Getting data from Figma...', type: 'info' };
  result.value = { screenshotUrl: '', suggestionHtml: '' };
  parent.postMessage({ pluginMessage: { type: 'get-layer-data' } }, '*');
};

function uint8ArrayToBase64(bytes) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

async function fetchSuggestionStream(figmaStructure, figmaScreenshot) {
  result.value.screenshotUrl = figmaScreenshot.startsWith('data:') ? figmaScreenshot : `data:image/jpeg;base64,${figmaScreenshot}`;
  let fullSuggestionText = '';

  try {
    const response = await fetch('http://localhost:3000/app/figma/suggestion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ figmaStructure, figmaScreenshot }),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    
    message.value = { text: '', type: '' };
    isStreaming.value = true;
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const dataContent = line.substring(6);
          if (dataContent === '[DONE]') {
            isStreaming.value = false;
            continue;
          }
          
          const parsed = JSON.parse(dataContent);
          const delta = parsed.choices[0]?.delta?.content;
          if (delta) {
            fullSuggestionText += delta;
            suggestions.value = fullSuggestionText;
          }
        }
      }
    }
  } catch (error) {
    message.value = { text: `Error: ${error.message}. Is the server running?`, type: 'error' };
  } finally {
    isLoading.value = false;
    isStreaming.value = false;
  }
}

onMounted(() => {
  window.addEventListener('message', (event) => {
    const msg = event.data.pluginMessage;
    if (!msg) return;

    switch (msg.type) {
      case 'layer-data': {
        if (msg.warning) {
          message.value = { text: msg.warning, type: 'warning' };
        } else {
          message.value = { text: 'Generating suggestion...', type: 'info' };
        }
        const base64Screenshot = uint8ArrayToBase64(msg.imageData);
        fetchSuggestionStream(msg.structure, base64Screenshot);
        break;
      }
      case 'no-selection':
        message.value = { text: 'Please select a frame first.', type: 'info' };
        isLoading.value = false;
        break;
      case 'error':
        message.value = { text: msg.message, type: 'error' };
        isLoading.value = false;
        break;
    }
  });
});
</script>

<style scoped>
.suggestions-content :deep(h1) {
  @apply text-xl font-bold text-ds-black mt-6 mb-3 pb-2 border-b border-ds-gray-500;
}

.suggestions-content :deep(h2) {
  @apply text-lg font-semibold text-ds-black mt-5 mb-2 pb-1 border-b border-ds-gray-500/50;
}

.suggestions-content :deep(h3) {
  @apply text-base font-medium text-ds-black mt-4 mb-2;
}

.suggestions-content :deep(p) {
  @apply text-ds-black leading-relaxed mb-4;
}

.suggestions-content :deep(ul) {
  @apply pl-5 mb-4 space-y-2;
}

.suggestions-content :deep(ol) {
  @apply pl-5 mb-4 space-y-2 list-decimal;
}

.suggestions-content :deep(li) {
  @apply text-ds-black leading-relaxed;
  position: relative;
}

.suggestions-content :deep(ul > li) {
  @apply pl-1;
}

.suggestions-content :deep(ul > li::before) {
  content: '•';
  @apply text-ds-teal-100 font-bold absolute -left-4;
}

.suggestions-content :deep(a) {
  @apply text-ds-teal-100 hover:text-ds-teal-200 transition-colors underline-offset-2 font-medium;
}

.suggestions-content :deep(blockquote) {
  @apply pl-4 italic border-l-4 border-ds-gray-500 text-ds-black my-4;
}

.suggestions-content :deep(code) {
  @apply bg-ds-gray-600 px-1.5 py-0.5 rounded text-sm font-mono text-ds-white;
}

.suggestions-content :deep(pre) {
  @apply bg-ds-gray-600 p-3 rounded-md overflow-x-auto my-4;
}

.suggestions-content :deep(pre code) {
  @apply bg-transparent p-0 text-ds-white;
}

.suggestions-content :deep(hr) {
  @apply my-6 border-ds-gray-500;
}

.suggestions-content :deep(strong) {
  @apply text-ds-black font-bold;
}

.suggestions-content :deep(table) {
  @apply w-full border-collapse my-4;
}

.suggestions-content :deep(th) {
  @apply border border-ds-gray-500 px-4 py-2 text-left bg-ds-gray-600 font-medium text-ds-white;
}

.suggestions-content :deep(td) {
  @apply border border-ds-gray-500 px-4 py-2 text-ds-black;
}

.suggestions-content :deep(img) {
  @apply max-w-full h-auto rounded-md my-4;
}

.animation-delay-200 {
  animation-delay: 200ms;
}

.animation-delay-400 {
  animation-delay: 400ms;
}
</style> 