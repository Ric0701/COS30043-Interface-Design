<!-- views/account_setting.vue -->
<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../data/auth_store.js";
import { useGachaStore } from "../gacha_store.js";

const authStore = useAuthStore();
const gachaStore = useGachaStore();
const router = useRouter();

// Redirect if not logged in
onMounted(() => {
  if (!authStore.currentUser) {
    router.push("/login");
  }
});

// Current user details
const userDetails = computed(() => {
  return (
    authStore.users.find((u) => u.username === authStore.currentUser) || {}
  );
});

// Form states
const displayName = ref(userDetails.value.displayName || "");
const username = ref(userDetails.value.username || "");
const dateOfBirth = ref(userDetails.value.dateOfBirth || "");

const currentPassword = ref("");
const newPassword = ref("");
const confirmNewPassword = ref("");

const profileMsg = ref({ type: "", text: "" });
const passwordMsg = ref({ type: "", text: "" });

// Update Profile Action
const handleUpdateProfile = async () => {
  profileMsg.value = { type: "", text: "" };
  if (!username.value.trim()) {
    profileMsg.value = { type: "danger", text: "Username is required." };
    return;
  }

  const res = await authStore.updateProfile(
    username.value.trim(),
    displayName.value.trim(),
    dateOfBirth.value,
  );
  if (res.success) {
    profileMsg.value = { type: "success", text: res.message };
  } else {
    profileMsg.value = { type: "danger", text: res.message };
  }
};

// Change Password Action
const handleChangePassword = async () => {
  passwordMsg.value = { type: "", text: "" };

  if (
    !currentPassword.value ||
    !newPassword.value ||
    !confirmNewPassword.value
  ) {
    passwordMsg.value = {
      type: "danger",
      text: "All password fields are required.",
    };
    return;
  }

  if (newPassword.value !== confirmNewPassword.value) {
    passwordMsg.value = { type: "danger", text: "New passwords do not match." };
    return;
  }

  if (newPassword.value.length < 6) {
    passwordMsg.value = {
      type: "danger",
      text: "New password must be at least 6 characters.",
    };
    return;
  }

  const res = await authStore.changePassword(
    currentPassword.value,
    newPassword.value,
  );
  if (res.success) {
    passwordMsg.value = { type: "success", text: res.message };
    currentPassword.value = "";
    newPassword.value = "";
    confirmNewPassword.value = "";
  } else {
    passwordMsg.value = { type: "danger", text: res.message };
  }
};

// Clear Wish History
const handleClearWishHistory = () => {
  const confirmClear = confirm(
    "Are you sure you want to clear your wish history? This will permanently delete all logged pulls and reset your pity counters to 0.",
  );
  if (confirmClear) {
    gachaStore.resetData();
    gachaStore.saveData();
    alert("Wish history and pity counters have been cleared successfully.");
  }
};

// Sign Out
const handleSignOut = () => {
  authStore.logout();
  router.push("/login");
};

// Delete Account
const handleDeleteAccount = () => {
  const confirmDelete1 = confirm(
    "WARNING: Are you sure you want to delete your account? This action is permanent and cannot be undone.",
  );
  if (confirmDelete1) {
    const confirmDelete2 = confirm(
      "Double Confirmation: ALL your user data, including wish history and planning logs, will be permanently deleted. Do you want to proceed with deleting your account?",
    );
    if (confirmDelete2) {
      authStore.deleteAccount();
      router.push("/registration");
      alert(
        "Your account and all associated data have been permanently deleted.",
      );
    }
  }
};
</script>

<template>
  <div class="container py-5 mt-5">
    <div class="text-dark mb-4 text-center">
      <h1 class="fw-bold display-5">Account Settings</h1>
      <p class="text-muted">
        Manage your profile, password, security options, and data settings.
      </p>
    </div>

    <div class="row g-4">
      <!-- Left Side Cards -->
      <div class="col-12 col-lg-8">
        <!-- Personal Info -->
        <div
          class="card custom-dark-card p-4 shadow-sm border-0 mb-4 text-white"
        >
          <h3 class="fw-bold mb-3 text-white">
            <i class="bi bi-person-fill text-primary me-2"></i>Personal
            Information
          </h3>
          <p class="text-white-50 small mb-4">
            Update your display name, username, and date of birth.
          </p>

          <form @submit.prevent="handleUpdateProfile">
            <div
              v-if="profileMsg.text"
              :class="`alert alert-${profileMsg.type} py-2`"
              role="alert"
            >
              {{ profileMsg.text }}
            </div>

            <div class="row g-3 mb-3">
              <div class="col-md-6">
                <label class="form-label small fw-semibold text-white-50"
                  >Display Name</label
                >
                <input
                  type="text"
                  class="form-control custom-input bg-dark text-white border-secondary"
                  v-model="displayName"
                  placeholder="Enter display name"
                />
              </div>
              <div class="col-md-6">
                <label class="form-label small fw-semibold text-white-50"
                  >Username</label
                >
                <input
                  type="text"
                  class="form-control custom-input bg-dark text-white border-secondary"
                  v-model="username"
                  required
                  placeholder="Enter username"
                />
              </div>
            </div>

            <div class="mb-4">
              <label class="form-label small fw-semibold text-white-50"
                >Date of Birth</label
              >
              <input
                type="date"
                class="form-control custom-input bg-dark text-white border-secondary"
                v-model="dateOfBirth"
              />
            </div>

            <button
              type="submit"
              class="btn btn-primary px-4 py-2 fw-semibold shadow-sm"
            >
              <i class="bi bi-save me-2"></i>Update Profile
            </button>
          </form>
        </div>

        <!-- Password Change -->
        <div class="card custom-dark-card p-4 shadow-sm border-0 text-white">
          <h3 class="fw-bold mb-3 text-white">
            <i class="bi bi-shield-lock-fill text-warning me-2"></i>Change
            Password
          </h3>
          <p class="text-white-50 small mb-4">
            Ensure your account is secure by regularly updating your password.
          </p>

          <form @submit.prevent="handleChangePassword">
            <div
              v-if="passwordMsg.text"
              :class="`alert alert-${passwordMsg.type} py-2`"
              role="alert"
            >
              {{ passwordMsg.text }}
            </div>

            <div class="mb-3">
              <label class="form-label small fw-semibold text-white-50"
                >Current Password</label
              >
              <input
                type="password"
                class="form-control custom-input bg-dark text-white border-secondary"
                v-model="currentPassword"
                required
                placeholder="••••••••"
              />
            </div>

            <div class="row g-3 mb-4">
              <div class="col-md-6">
                <label class="form-label small fw-semibold text-white-50"
                  >New Password</label
                >
                <input
                  type="password"
                  class="form-control custom-input bg-dark text-white border-secondary"
                  v-model="newPassword"
                  required
                  placeholder="••••••••"
                />
              </div>
              <div class="col-md-6">
                <label class="form-label small fw-semibold text-white-50"
                  >Confirm New Password</label
                >
                <input
                  type="password"
                  class="form-control custom-input bg-dark text-white border-secondary"
                  v-model="confirmNewPassword"
                  required
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              class="btn btn-warning px-4 py-2 fw-semibold shadow-sm text-dark"
            >
              <i class="bi bi-key-fill me-2"></i>Change Password
            </button>
          </form>
        </div>
      </div>

      <!-- Right Side Cards -->
      <div class="col-12 col-lg-4">
        <!-- Data Management -->
        <div
          class="card custom-dark-card p-4 shadow-sm border-0 mb-4 text-white"
        >
          <h3 class="fw-bold mb-3 text-white">
            <i class="bi bi-database-fill-slash text-danger me-2"></i>Data
            Management
          </h3>
          <p class="text-white-50 small mb-4">
            Manage your stored local data and application logs.
          </p>

          <div
            class="p-3 border border-secondary rounded mb-4 bg-dark bg-opacity-25"
          >
            <h6 class="fw-bold mb-1">Clear Wish History</h6>
            <p class="text-white-50 small mb-3">
              Resets all 5★ and 4★ pity progress counters back to 0, and clears
              lifetime pull logs from your account.
            </p>
            <button
              class="btn btn-outline-danger btn-sm w-100 fw-bold"
              @click="handleClearWishHistory"
            >
              <i class="bi bi-trash3-fill me-2"></i>Clear Wish History
            </button>
          </div>
        </div>

        <!-- Session / Account Actions -->
        <div class="card custom-dark-card p-4 shadow-sm border-0 text-white">
          <h3 class="fw-bold mb-3 text-white">
            <i class="bi bi-gear-wide-connected text-secondary me-2"></i>Account
            Actions
          </h3>
          <p class="text-white-50 small mb-4">
            Manage active login sessions or permanently delete your account.
          </p>

          <button
            class="btn btn-secondary w-100 mb-3 fw-bold py-2 shadow-sm"
            @click="handleSignOut"
          >
            <i class="bi bi-box-arrow-right me-2"></i>Sign Out
          </button>

          <button
            class="btn btn-danger w-100 fw-bold py-2 shadow-sm"
            @click="handleDeleteAccount"
          >
            <i class="bi bi-person-x-fill me-2"></i>Delete Account
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
