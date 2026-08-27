<!-- ============================================================
  App.vue — The root component. It is the "page switcher".
  It decides which screen to show based on login state:

    not logged in → Login screen  (or Register screen)
    logged in     → Dashboard (sidebar menu with Users + Profile)

  Who is logged in is stored in the Pinia auth store
  (stores/auth.ts), so App.vue simply reads `auth.user`:

    - When it is null, the login/register screens are shown.
    - The moment it is filled in, the Dashboard appears.

  Because the store is reactive, no events are needed to move
  between these screens — they react to the store automatically.
  ============================================================ -->
<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useAuthStore } from "./stores/auth";
import Login from "./components/Login.vue";
import Register from "./components/Register.vue";
import Dashboard from "./components/Dashboard.vue";

// One source of truth for the whole auth state.
const auth = useAuthStore();

// true = show the registration form instead of the login form.
// (Purely local UI state, so it stays a ref here.)
const showRegister = ref(false);

// ---- On app start: try to restore a saved session ----
// The store validates any saved JWT and fills `auth.user` (or not).
onMounted(() => auth.restore());
</script>

<template>
  <div id="top">
    <!-- Auth screens: centred, with the brand header -->
    <div v-if="!auth.isAuthenticated" class="page">
      <header>
        <div class="contact-actions">
          <p>Supporting people living with bipolar disorder in Nepal.</p>
          <p>Email: nepal.bipolar.foundation@gmail.com</p>
          <p style="color: blue">
            <a href="#login" style="color: blue">Login</a>/<a
              href="#login"
              style="color: blue"
              >Create an account</a
            >
          </p>
        </div>
      </header>
      <div class="card">
        <p>
          <span><b>Bipolar disorder</b></span
          >, also known as manic depression, is a mental
          <span><b>disorder</b></span> that causes periods of depression and
          periods of elevated mood. The elevated mood is significant and is
          known as mania or hypomania, depending on its severity, or whether
          symptoms of psychosis are present.
        </p>
        <p style="text-align: center">
          <strong>World Bipolar Day Event (March 30)</strong>
        </p>

        <p>
          <strong>Event Overview</strong><br />
          An annual community wellness drive held every March 30 to raise
          awareness, offer early diagnosis, and support individuals with bipolar
          disorder, OCD, and other mental health conditions.
        </p>

        <p><strong>Key Activities</strong></p>
        <ul>
          <li>
            <strong>Free Diagnostic Screening:</strong> Professional mental
            health consultations and check-ups for individuals seeking diagnosis
            or evaluation.
          </li>
          <li>
            <strong>Free Medicine Distribution:</strong> A complimentary 1-month
            supply of prescribed psychiatric medication for qualified
            participants.
          </li>
        </ul>

        <p><strong>Event Goals</strong></p>
        <ul>
          <li>
            <strong>Break Stigma:</strong> Promote open discussion around mental
            health conditions.
          </li>
          <li>
            <strong>Increase Access:</strong> Provide free medical care and
            immediate relief to underserved individuals.
          </li>
          <li>
            <strong>Ensure Continuity:</strong> Connect patients with long-term
            care resources after the initial event.
          </li>
        </ul>
      </div>
      <div id="login">
        <Login v-if="!showRegister" @go-register="showRegister = true" />
        <Register v-else @go-login="showRegister = false" />
      </div>
    </div>
    <!-- Logged in: the admin dashboard with the Users menu -->
    <Dashboard v-else />
  </div>
</template>

<!-- Non-scoped styles: applied to all child components too -->
<style>
* {
  box-sizing: border-box;
}
body {
  font-family:
    system-ui,
    -apple-system,
    sans-serif;
  margin: 0;
  background: #f6f8f7;
  color: #2b2b2b;
}
</style>

<style scoped>
/* 1. Remove default browser margins on body */
body {
  margin: 0;
  padding: 0;
}

/* 2. Ensure parent containers don't restrict width */
.page {
  width: 100%;
  box-sizing: border-box;
}

header {
  width: 100%;
  aspect-ratio: 16 / 5;

  /* Dark overlay for contrast over background image */
  background-image:
    linear-gradient(rgba(0, 0, 0, 0.45), rgba(0, 0, 0, 0.45)),
    url("/images/banner.png");

  background-size: cover;
  background-position: center center;
  background-repeat: no-repeat;

  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;

  /* Push text to the right half of the header */
  padding-left: 52%;
  box-sizing: border-box;
}

/* Container text adjustment to move it up and fine-tune placement */
header h1,
header p {
  /* Shifts elements up (-20px). Tweak -20px to move higher/lower */
  transform: translateY(-20px);
  text-align: left;
}

header h1 {
  font-size: 2.2rem;
  font-weight: 700;
  margin: 0 0 0.4rem 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
}

header p {
  color: #f0f0f0;
  font-size: 1.05rem;
  margin: 0;
}
header h1 .text-red {
  color: #dc2626; /* Nepal Red */
}

header h1 .text-green {
  color: #16a34a; /* Bipolar Green */
}

header h1 .text-blue {
  color: #2563eb; /* Foundation Blue */
}
.card {
  background: #fff;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}
@media screen and (max-width: 768px) {
  /* CSS rules apply only when screen width is 768px or less */
  header p {
    color: #f0f0f0;
    margin-right: 2px;
    font-size: 0.5rem;
  }
}
</style>
