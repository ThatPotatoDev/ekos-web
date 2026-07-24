<template>
  <!-- Toggle button -->
  <v-btn
    icon
    class="ma-2"
    :color="settingsVisible ? 'cyan-darken-2' : 'grey-darken-3'"
    variant="flat"
    @click="toggleControls"
  >
    <v-icon icon="mdi-cog" class="w-7 h-7" />
  </v-btn>

  <!-- Dialog -->
  <v-dialog v-model="settingsVisible" max-width="900">
    <v-card>
      <v-card-title class="d-flex align-center justify-space-between">
        <span>{{ $t('stellarium.settings.title') }}</span>
        <v-btn icon="mdi-close" variant="text" @click="settingsVisible = false" />
      </v-card-title>
      <v-divider />

      <v-card-text>
        <v-container fluid>
          <v-row density="comfortable">

            <!-- CONSTELLATIONS -->
            <v-col cols="12">
              <v-card variant="outlined" class="pa-2">
                <v-row align="center" justify="space-between">
                  <v-col>
                    {{ $t('stellarium.settings.constellations_lines_visible') }}
                  </v-col>
                  <v-col cols="auto">
                    <v-switch
                      v-model="settingsStore.stellarium.constellationsLinesVisible"
                      hide-details
                      density="compact"
                    />
                  </v-col>
                </v-row>
              </v-card>
            </v-col>

            <!-- AZIMUTHAL -->
            <v-col cols="12">
              <v-card variant="outlined" class="pa-2">
                <v-row align="center" justify="space-between">
                  <v-col>
                    {{ $t('stellarium.settings.azimuthal_lines_visible') }}
                  </v-col>
                  <v-col cols="auto">
                    <v-switch
                      v-model="settingsStore.stellarium.azimuthalLinesVisible"
                      hide-details
                      density="compact"
                    />
                  </v-col>
                </v-row>
              </v-card>
            </v-col>

            <!-- EQUATORIAL -->
            <v-col cols="12">
              <v-card variant="outlined" class="pa-2">
                <v-row align="center" justify="space-between">
                  <v-col>
                    {{ $t('stellarium.settings.equatorial_lines_visible') }}
                  </v-col>
                  <v-col cols="auto">
                    <v-switch
                      v-model="settingsStore.stellarium.equatorialLinesVisible"
                      hide-details
                      density="compact"
                    />
                  </v-col>
                </v-row>
              </v-card>
            </v-col>

            <!-- MERIDIAN -->
            <v-col cols="12">
              <v-card variant="outlined" class="pa-2">
                <v-row align="center" justify="space-between">
                  <v-col>
                    {{ $t('stellarium.settings.meridian_lines_visible') }}
                  </v-col>
                  <v-col cols="auto">
                    <v-switch
                      v-model="settingsStore.stellarium.meridianLinesVisible"
                      hide-details
                      density="compact"
                    />
                  </v-col>
                </v-row>
              </v-card>
            </v-col>

            <!-- ECLIPTIC -->
            <v-col cols="12">
              <v-card variant="outlined" class="pa-2">
                <v-row align="center" justify="space-between">
                  <v-col>
                    {{ $t('stellarium.settings.ecliptic_lines_visible') }}
                  </v-col>
                  <v-col cols="auto">
                    <v-switch
                      v-model="settingsStore.stellarium.eclipticLinesVisible"
                      hide-details
                      density="compact"
                    />
                  </v-col>
                </v-row>
              </v-card>
            </v-col>

            <!-- ATMOSPHERE -->
            <v-col cols="12">
              <v-card variant="outlined" class="pa-2">
                <v-row align="center" justify="space-between">
                  <v-col>
                    {{ $t('stellarium.settings.atmosphere_visible') }}
                  </v-col>
                  <v-col cols="auto">
                    <v-switch
                      v-model="settingsStore.stellarium.atmosphereVisible"
                      hide-details
                      density="compact"
                    />
                  </v-col>
                </v-row>
              </v-card>
            </v-col>

            <!-- LANDSCAPES -->
            <v-col cols="12">
              <v-card variant="outlined" class="pa-2">
                <v-row align="center" justify="space-between">
                  <v-col>
                    {{ $t('stellarium.settings.landscapes_visible') }}
                  </v-col>
                  <v-col cols="auto">
                    <v-switch
                      v-model="settingsStore.stellarium.landscapesVisible"
                      hide-details
                      density="compact"
                      @change="showLandscape"
                    />
                  </v-col>
                </v-row>

                <div v-if="settingsStore.stellarium.landscapesVisible" class="mt-4">

                  <!-- SOURCE MODE -->
                  <v-select
                    v-model="landscapeSourceSelection"
                    :items="[
                      {
                        title: $t('stellarium.settings.landscape_source_default'),
                        value: 'default',
                      },
                      {
                        title: $t('stellarium.settings.landscape_source_neutral'),
                        value: 'neutral',
                      },
                      ...listedLandscapeOptions.map(option => ({
                        title: $t('stellarium.settings.landscape_option_label', {
                          title: option.title,
                        }),
                        value: option.value,
                      })),
                      {
                        title: $t('stellarium.settings.landscape_source_custom'),
                        value: 'custom',
                      },
                    ]"
                    item-title="title"
                    item-value="value"
                    variant="outlined"
                    density="compact"
                    hide-details
                  />

                  <!-- CUSTOM FIELDS -->
                  <div v-if="settingsStore.stellarium.landscapeSourceMode === 'custom'">
                    <v-text-field
                      v-model="settingsStore.stellarium.customLandscapeUrl"
                      label="Custom landscape URL"
                      variant="outlined"
                      density="compact"
                      class="mb-2"
                    />

                    <v-text-field
                      v-model="settingsStore.stellarium.customLandscapeKey"
                      label="Custom landscape key"
                      variant="outlined"
                      density="compact"
                    />
                  </div>

                  <!-- SAVE -->
                  <v-btn
                    class="mt-3"
                    color="cyan-darken-2"
                    size="small"
                    :disabled="!landscapeSourceDirty"
                    @click="saveLandscapeSourceSettings"
                  >
                    {{ $t('general.save') }}
                  </v-btn>

                  <!-- AVAILABLE LANDSCAPES -->
                  <v-card variant="tonal" class="mt-4 pa-2">

                    <v-row align="center" justify="space-between">
                      <v-col>
                        {{ $t('stellarium.settings.available_landscapes') }}
                      </v-col>

                      <v-col cols="auto">
                        <v-btn
                          size="x-small"
                          variant="outlined"
                          :disabled="landscapeListLoading"
                          @click="fetchAvailableLandscapes"
                        >
                          {{ $t('common.refresh') }}
                        </v-btn>
                      </v-col>
                    </v-row>

                    <div class="mt-2">
                      <p v-if="landscapeListLoading">
                        {{ $t('common.loading') }}
                      </p>

                      <p v-else-if="landscapeListError" class="text-red">
                        {{ landscapeListError }}
                      </p>

                      <p v-else-if="landscapeListLoaded && availableLandscapes.length === 0">
                        {{ $t('stellarium.settings.no_landscapes_available') }}
                      </p>

                      <v-list v-else max-height="220" class="overflow-y-auto">
                        <v-list-item
                          v-for="(landscape, index) in availableLandscapes"
                          :key="`${landscape.folderName || 'unknown'}-${index}`"
                        >
                          <v-card variant="outlined" class="pa-2 w-100">

                            <div class="d-flex justify-space-between">
                              <div class="font-weight-medium">
                                {{
                                  landscape.title ||
                                  landscape.folderName ||
                                  $t('stellarium.settings.untitled_landscape')
                                }}
                              </div>

                              <v-chip
                                size="x-small"
                                :color="landscape.hasAllsky ? 'green' : 'yellow-darken-2'"
                              >
                                {{
                                  landscape.hasAllsky
                                    ? $t('stellarium.settings.has_allsky')
                                    : $t('stellarium.settings.no_allsky')
                                }}
                              </v-chip>
                            </div>

                            <div class="text-caption mt-1">
                              {{ $t('stellarium.settings.folder_name_label') }}:
                              {{ landscape.folderName || '—' }}
                            </div>

                            <div class="text-caption">
                              {{ $t('stellarium.settings.service_url_label') }}:
                              {{ landscape.serviceUrl || '—' }}
                            </div>

                          </v-card>
                        </v-list-item>
                      </v-list>

                    </div>
                  </v-card>

                </div>
              </v-card>
            </v-col>

            <!-- DSOS -->
            <v-col cols="12">
              <v-card variant="outlined" class="pa-2">
                <v-row align="center" justify="space-between">
                  <v-col>
                    {{ $t('stellarium.settings.dsos_visible') }}
                  </v-col>
                  <v-col cols="auto">
                    <v-switch
                      v-model="settingsStore.stellarium.dsosVisible"
                      hide-details
                      density="compact"
                    />
                  </v-col>
                </v-row>
              </v-card>
            </v-col>

          </v-row>
        </v-container>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { useStore } from "vuex"
// import toggleButton from '@/components/helpers/toggleButton.vue';
import { watch, ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
// import { useOrientation } from '@/composables/useOrientation';
// import apiService from '@/services/apiService';

const { t } = useI18n();
const store = useStore()
const stellariumStore = store.state.stelStore;
const settingsStore = stellariumStore.settings;
const settingsVisible = ref(false);
const landscapeSourceDirty = ref(false);
const availableLandscapes = ref([]);
const landscapeListLoading = ref(false);
const landscapeListLoaded = ref(false);
const landscapeListError = ref('');

function normalizeLandscapePath(path) {
  return String(path || '')
    .trim()
    .replace(/\/+$/g, '')
    .toLowerCase();
}

const listedLandscapeOptions = computed(() => {
  return availableLandscapes.value
    .filter((item) => {
      const folder = String(item?.folderName || '').toLowerCase();
      return Boolean(folder) && folder !== 'gray' && folder !== 'guereins';
    })
    .map((item) => {
      const folderName = item.folderName;
      const title = item.title || folderName;
      return {
        value: `listed:${folderName}`,
        title,
        folderName,
        serviceUrl: item.serviceUrl,
      };
    });
});

function applyListedLandscapeSelection(folderName) {
  const selected = listedLandscapeOptions.value.find((option) => option.folderName === folderName);
  if (!selected) return;

  settingsStore.stellarium.landscapeSourceMode = 'custom';
  settingsStore.stellarium.customLandscapeUrl = selected.serviceUrl || `landscapes/${folderName}`;
  settingsStore.stellarium.customLandscapeKey = folderName || 'custom';
}

const landscapeSourceSelection = computed({
  get() {
    const mode = settingsStore.stellarium.landscapeSourceMode;
    if (mode === 'default' || mode === 'neutral') {
      return mode;
    }

    if (mode === 'custom') {
      const customUrl = normalizeLandscapePath(settingsStore.stellarium.customLandscapeUrl);
      const customKey = String(settingsStore.stellarium.customLandscapeKey || '')
        .trim()
        .toLowerCase();

      const listedMatch = listedLandscapeOptions.value.find((option) => {
        const optionUrl = normalizeLandscapePath(option.serviceUrl);
        const optionFolder = String(option.folderName || '')
          .trim()
          .toLowerCase();

        return (
          (customUrl && optionUrl && customUrl === optionUrl) ||
          (customKey && optionFolder && customKey === optionFolder)
        );
      });

      if (listedMatch) {
        return listedMatch.value;
      }

      return 'custom';
    }

    return 'default';
  },
  set(value) {
    if (value === 'default' || value === 'neutral' || value === 'custom') {
      settingsStore.stellarium.landscapeSourceMode = value;
      return;
    }

    if (typeof value === 'string' && value.startsWith('listed:')) {
      const folderName = value.slice('listed:'.length);
      applyListedLandscapeSelection(folderName);
    }
  },
});

function toggleControls() {
  settingsVisible.value = !settingsVisible.value;
}

function requestStellariumRefresh() {
  // store.dispatch("refreshRouterView");
}

function saveLandscapeSourceSettings() {
  requestStellariumRefresh();
  landscapeSourceDirty.value = false;
}

function showLandscape() {
  requestStellariumRefresh();
}

async function fetchAvailableLandscapes() {
  landscapeListLoading.value = true;
  landscapeListError.value = '';

  try {
    const response = await apiService.listStellariumLandscapes();
    if (response?.success === true) {
      const rawItems = Array.isArray(response.landscapes) ? response.landscapes : [];
      availableLandscapes.value = rawItems.map((item) => ({
        folderName: item?.folderName ?? item?.FolderName ?? '',
        title: item?.title ?? item?.Title ?? '',
        serviceUrl: item?.serviceUrl ?? item?.ServiceUrl ?? '',
        hasAllsky: item?.hasAllsky ?? item?.HasAllsky ?? false,
      }));
    } else {
      availableLandscapes.value = [];
      landscapeListError.value =
        response?.message || t('stellarium.settings.landscape_list_load_failed');
    }
  } catch (error) {
    const responseMessage = error?.response?.data?.message || error?.response?.data?.error;
    landscapeListError.value =
      responseMessage ||
      error?.message ||
      t('stellarium.settings.landscape_list_load_failed');
    availableLandscapes.value = [];
  } finally {
    landscapeListLoading.value = false;
    landscapeListLoaded.value = true;
  }
}

// Check if in landscape mode
// const { isLandscape } = useOrientation();

// Settings container classes for grid layout
const settingsContainerClasses = computed(() => ({
  // Portrait mode - single column
  'flex flex-col gap-1': !isLandscape.value,
  // Landscape mode - two columns
  'grid grid-cols-2 gap-2': isLandscape.value,
}));

onMounted(() => {
  fetchAvailableLandscapes();
});
watch(
  () => [
    settingsStore.stellarium.constellationsLinesVisible,
    settingsStore.stellarium.azimuthalLinesVisible,
    settingsStore.stellarium.equatorialLinesVisible,
    settingsStore.stellarium.meridianLinesVisible,
    settingsStore.stellarium.eclipticLinesVisible,
    settingsStore.stellarium.atmosphereVisible,
    settingsStore.stellarium.landscapesVisible,
    settingsStore.stellarium.dsosVisible,
  ],
  () => {
    store.dispatch('updateStellariumCore');
  }
);

watch(
  () => [
    settingsStore.stellarium.landscapeSourceMode,
    settingsStore.stellarium.customLandscapeUrl,
    settingsStore.stellarium.customLandscapeKey,
  ],
  () => {
    landscapeSourceDirty.value = true;
  }
);
</script>
<style scoped>
/* Scrollbar styling for landscape mode */
@media screen and (orientation: landscape) {
  .overflow-y-auto::-webkit-scrollbar {
    width: 4px;
  }

  .overflow-y-auto::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.3);
    border-radius: 2px;
  }

  .overflow-y-auto::-webkit-scrollbar-thumb {
    background: rgba(6, 182, 212, 0.5);
    border-radius: 2px;
  }

  .overflow-y-auto::-webkit-scrollbar-thumb:hover {
    background: rgba(6, 182, 212, 0.7);
  }
}

/* Responsive adjustments */
@media screen and (orientation: landscape) and (max-height: 600px) {
  /* For very short landscape screens */
  .max-h-\[80vh\] {
    max-height: 90vh !important;
  }
}
</style>