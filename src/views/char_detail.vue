<script setup>
import { ref, onMounted } from "vue";
import { getCharacterSummary, characterCache } from "../services/ai_summarizer.js";

const linneaData = ref(characterCache.get("Linnea") || null);
const isLoadingLinnea = ref(!characterCache.has("Linnea"));
const showMoreLinnea = ref(false);

const ChascaData = ref(characterCache.get("Chasca") || null);
const isLoadingChasca = ref(!characterCache.has("Chasca"));
const showMoreChasca = ref(false);

const fetchCharacterData = async (name, dataRef, loadingRef) => {
  // Check the cache first using name as key
  if (characterCache.has(name)) {
    dataRef.value = characterCache.get(name);
    loadingRef.value = false;
    return;
  }

  // Not in cache, proceed with loading and API call
  loadingRef.value = true;
  try {
    const data = await getCharacterSummary(name);
    dataRef.value = data;
    // Save to session memory cache
    characterCache.set(name, data);
  } catch (error) {
    console.error(`Error loading ${name}:`, error);
    dataRef.value = {
      character_name: name,
      description: `System Error: ${error.message}`,
      strengths: [],
      important_details: "",
      worth_pulling: "",
    };
  } finally {
    loadingRef.value = false;
  }
};

onMounted(() => {
  fetchCharacterData("Linnea", linneaData, isLoadingLinnea);
  fetchCharacterData("Chasca", ChascaData, isLoadingChasca);
});
</script>

<template>
  <div class="banner-details-container">
    <h2 class="section-title fw-bold">Current Banner Details</h2>

    <div class="character-grid">
      <div class="portrait-card">
        <div class="image-placeholder">
          <img
            class="profile-image-details"
            src="../assets/lib/Linnea-Profile.png"
            alt="Linnea Profile"
          />
        </div>

        <div class="card-content">
          <div v-if="isLoadingLinnea" class="loading-state">
            <p>AI Analyzing Linnea...</p>
          </div>

          <div v-else>
            <h3 class="h3-character-name">{{ linneaData.character_name }}</h3>
            <p class="description-text">{{ linneaData.description }}</p>

            <div v-if="showMoreLinnea" class="expanded-details">
              <h4>Strengths</h4>
              <ul>
                <li
                  v-for="(strength, i) in linneaData.strengths"
                  :key="'lin-' + i"
                >
                  {{ strength }}
                </li>
              </ul>

              <h4>Details</h4>
              <p>{{ linneaData.important_details }}</p>

              <div class="pull-verdict">
                <strong>Worth Pulling?</strong> {{ linneaData.worth_pulling }}
              </div>
            </div>
          </div>
        </div>

        <button
          v-if="!isLoadingLinnea"
          class="toggle-button"
          @click="showMoreLinnea = !showMoreLinnea"
        >
          {{ showMoreLinnea ? "Show Less" : "More" }}
        </button>
      </div>

      <div class="portrait-card">
        <div class="image-placeholder">
          <img
            class="profile-image-details"
            src="../assets/lib/Chasca-Profile.png"
            alt="Chasca Profile"
          />
        </div>

        <div class="card-content">
          <div v-if="isLoadingChasca" class="loading-state">
            <p>AI Analyzing Chasca...</p>
          </div>

          <div v-else>
            <h3 class="h3-character-name">{{ ChascaData.character_name }}</h3>
            <p class="description-text">{{ ChascaData.description }}</p>

            <div v-if="showMoreChasca" class="expanded-details">
              <h4>Strengths</h4>
              <ul>
                <li
                  v-for="(strength, i) in ChascaData.strengths"
                  :key="'cha-' + i"
                >
                  {{ strength }}
                </li>
              </ul>

              <h4>Details</h4>
              <p>{{ ChascaData.important_details }}</p>

              <div class="pull-verdict">
                <strong>Worth Pulling?</strong> {{ ChascaData.worth_pulling }}
              </div>
            </div>
          </div>
        </div>

        <button
          v-if="!isLoadingChasca"
          class="toggle-button"
          @click="showMoreChasca = !showMoreChasca"
        >
          {{ showMoreChasca ? "Show Less" : "More" }}
        </button>
      </div>
    </div>
  </div>
</template>
