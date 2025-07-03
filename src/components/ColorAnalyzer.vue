<template>
  <div class="space-y-4">
    <div class="bg-ds-teal-100/20 border border-ds-teal-100 p-3 rounded">
      <p class="text-sm text-ds-gray-100">
        Select a frame to analyze its color profile for energy efficiency.
      </p>
    </div>
    
    <button
      @click="analyzeColors"
      :disabled="isLoading"
      class="w-full bg-ds-teal-100 text-ds-white font-medium py-2 px-4 rounded hover:bg-ds-teal-200 disabled:bg-ds-gray-400"
    >
      {{ isLoading ? 'Analyzing...' : 'Analyze Colors' }}
    </button>

    <div v-if="analysisResult" class="space-y-4">
      <!-- Screenshot -->
      <div class="bg-ds-white border border-ds-gray-500 rounded p-4">
        <h3 class="font-bold text-lg mb-3 text-ds-gray-100">Selected Frame</h3>
        <div class="bg-ds-gray-700 rounded p-2">
          <img :src="screenshotUrl" class="w-full h-auto max-h-32 object-contain border rounded bg-ds-white" />
        </div>
      </div>

      <!-- Power Efficiency Score -->
      <div class="bg-ds-white border border-ds-gray-500 rounded p-4">
        <h3 class="font-bold text-lg mb-3 text-ds-gray-100">Power Efficiency Score</h3>
        <div class="text-center">
          <div class="mb-2">
            <span class="text-3xl font-bold" :class="getScoreColor(analysisResult.powerMetrics.powerEfficiencyScore)">
              {{ analysisResult.powerMetrics.powerEfficiencyScore }}
            </span>
            <span class="text-lg text-ds-gray-400 ml-1">/ 100</span>
          </div>
          <div class="w-full bg-ds-gray-600 rounded h-2 mb-2">
            <div 
              class="h-2 rounded"
              :class="getScoreBarColor(analysisResult.powerMetrics.powerEfficiencyScore)"
              :style="{ width: analysisResult.powerMetrics.powerEfficiencyScore + '%' }"
            ></div>
          </div>
          <p class="text-xs" :class="getScoreTextColor(analysisResult.powerMetrics.powerEfficiencyScore)">
            {{ getScoreDescription(analysisResult.powerMetrics.powerEfficiencyScore) }}
          </p>
        </div>
      </div>
      
      <!-- Color Analysis -->
      <div class="bg-ds-white border border-ds-gray-500 rounded p-4">
        <h3 class="font-bold text-lg mb-3 text-ds-gray-100">Color Energy Analysis</h3>
        <div class="space-y-2">
          <div v-for="color in analysisResult.dominantColors" :key="color.color" 
               class="bg-ds-gray-700 border rounded p-3">
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center space-x-2">
                <div class="w-6 h-6 rounded border" :style="{ backgroundColor: color.color }"></div>
                                  <div>
                    <span class="font-mono text-xs font-medium text-ds-gray-100">{{ color.color.toUpperCase() }}</span>
                    <div class="text-xs text-ds-gray-400">{{ color.percentage.toFixed(1) }}%</div>
                  </div>
              </div>
              <div class="text-right">
                <span class="text-sm font-medium" :class="color.powerImpact.class">
                  {{ color.powerImpact.label }}
                </span>
              </div>
                          </div>
              <div class="flex justify-between items-center mb-1">
                <span class="text-xs text-ds-gray-400">Power Score</span>
                <span class="text-xs font-mono" :class="color.powerImpact.class">
                  {{ color.powerScore }}/100
                </span>
              </div>
              <div class="w-full bg-ds-gray-600 rounded h-1 mb-2">
              <div 
                class="h-1 rounded"
                :class="color.powerImpact.barClass"
                :style="{ width: color.powerScore + '%' }"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div v-if="error" class="bg-red-50 border border-red-200 p-3 rounded">
      <span class="text-red-800 text-sm">{{ error }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const isLoading = ref(false);
const error = ref(null);
const analysisResult = ref(null);
const screenshotUrl = ref('');

const analyzeColors = () => {
  isLoading.value = true;
  error.value = null;
  analysisResult.value = null;
  parent.postMessage({ pluginMessage: { type: 'get-screenshot' } }, '*');
};

const getScoreColor = (score) => {
  if (score >= 80) return 'text-ds-teal-100';
  if (score >= 60) return 'text-orange-600';
  return 'text-red-600';
};

const getScoreBarColor = (score) => {
  if (score >= 80) return 'bg-ds-teal-100';
  if (score >= 60) return 'bg-orange-500';
  return 'bg-red-500';
};

const getScoreTextColor = (score) => {
  if (score >= 80) return 'text-ds-teal-200';
  if (score >= 60) return 'text-orange-600';
  return 'text-red-700';
};

const getScoreDescription = (score) => {
  if (score >= 80) return 'Excellent! Very energy efficient design.';
  if (score >= 60) return 'Good! Room for improvement in energy efficiency.';
  return 'Poor. Consider using darker colors to improve efficiency.';
};

const analyzeColorPowerImpact = (color) => {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  const kR = 0.7;
  const kG = 1.0;
  const kB = 1.5;
  const maxPowerPerPixel = (kR + kG + kB) * 255;
  const colorPower = (kR * r + kG * g + kB * b) / maxPowerPerPixel;
  const powerScore = Math.round((1 - colorPower) * 100);
  
  let impact;
  if (powerScore >= 80) {
    impact = {
      label: 'Excellent',
      class: 'text-ds-teal-100',
      barClass: 'bg-ds-teal-100',
      advice: 'This dark color is very energy efficient. Great choice!'
    };
  } else if (powerScore >= 60) {
    impact = {
      label: 'Good',
      class: 'text-orange-600',
      barClass: 'bg-orange-500',
      advice: 'Moderately energy efficient. Consider darker alternatives for even better efficiency.'
    };
  } else if (powerScore >= 40) {
    impact = {
      label: 'Fair',
      class: 'text-orange-600',
      barClass: 'bg-orange-500',
      advice: 'This color consumes significant power. Try using darker shades when possible.'
    };
  } else {
    impact = {
      label: 'Poor',
      class: 'text-red-600',
      barClass: 'bg-red-500',
      advice: 'High power consumption! Consider replacing with darker colors to save battery.'
    };
  }
  
  return { powerScore, ...impact };
};

// Listen for messages from the plugin's main code
window.onmessage = async (event) => {
  const msg = event.data.pluginMessage;
  if (msg && msg.type === 'screenshot-data') {
    try {
      const blob = new Blob([msg.imageData], { type: 'image/jpeg' });
      screenshotUrl.value = URL.createObjectURL(blob);
      
      const result = await runColorAnalysis(msg.imageData);
      analysisResult.value = result;
    } catch (e) {
      error.value = `Error analyzing image: ${e.message}`;
    } finally {
      isLoading.value = false;
    }
  } else if (msg && msg.type === 'error') {
    error.value = msg.message;
    isLoading.value = false;
  }
};

async function runColorAnalysis(imageData) {
  const image = await createImageBitmap(new Blob([imageData], { type: 'image/jpeg' }));
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(image, 0, 0);
  
  const pixelData = ctx.getImageData(0, 0, image.width, image.height).data;

  const kR = 0.7;
  const kG = 1.0;
  const kB = 1.5;
  const maxPowerPerPixel = (kR + kG + kB) * 255;
  
  const colorMap = new Map();
  let totalPower = 0;
  let pixelCount = 0;

  for (let i = 0; i < pixelData.length; i += 4) {
    const r = pixelData[i];
    const g = pixelData[i+1];
    const b = pixelData[i+2];
    const a = pixelData[i+3];

    if (a > 0) {
      const alphaFactor = a / 255;
      const pixelPower = (kR * r + kG * g + kB * b) * alphaFactor / maxPowerPerPixel;
      totalPower += pixelPower;
      
      const color = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
      colorMap.set(color, (colorMap.get(color) || 0) + 1);
      pixelCount++;
    }
  }

  const dominantColors = Array.from(colorMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([color, count]) => ({
      color,
      percentage: (count / pixelCount) * 100,
      powerImpact: analyzeColorPowerImpact(color),
      powerScore: analyzeColorPowerImpact(color).powerScore
    }));
  
  const averagePower = pixelCount > 0 ? totalPower / pixelCount : 0;
  const powerEfficiencyScore = Math.round((1 - averagePower) * 100);
  
  return {
    dominantColors,
    powerMetrics: {
      powerEfficiencyScore,
    },
  };
}
</script> 