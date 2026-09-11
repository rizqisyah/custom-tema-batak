<script setup lang="ts">
/*
 * Band 10 — reservation (RSVP). Frame 9 (2129:12) y 9767 - 10332.
 *
 * This band has NO art: Figma builds it entirely from filled container frames, so every
 * pixel of it is CSS. Four white fields at radius 11 and an olive Send at radius 99, all
 * at the design's own coordinates.
 *
 * Two of the four "fields" are not text inputs despite Figma calling them all "Button":
 * "Will you be joining us?" is a choice and "Number of Guests:" is a count, so they are a
 * <select> and a number input. A text box for either would accept "maybe, about 4" and
 * post it straight through to the couple's guest list.
 *
 * `submitRsvp` THROWS in design mode by construction (api.ts), which is what stops a
 * slicing session posting into production. The catch below prints that message rather
 * than swallowing it, so the form still works end to end in the only mode it is seen in.
 */
import { ref } from 'vue'
import { useReveal } from '../../composables/useReveal'
import { submitRsvpGAS } from '../../lib/gscript'

const { el, shown } = useReveal()

const form = ref({ nama: '', hp: '', hadir: '', jumlah: '' })
const state = ref<'idle' | 'sending' | 'done' | 'error'>('idle')
const message = ref('')

async function send() {
  if (!form.value.nama.trim() || !form.value.hadir) {
    state.value = 'error'
    message.value = 'Nama dan konfirmasi kehadiran wajib diisi.'
    return
  }
  state.value = 'sending'
  try {
    await submitRsvpGAS({
      nama: form.value.nama.trim(),
      no_hp: form.value.hp.trim(),
      hadir: form.value.hadir,
      jumlah: Number(form.value.jumlah) || 1,
    })
    state.value = 'done'
    message.value = 'Terima kasih, konfirmasi kehadiran Anda sudah kami terima.'
    form.value = { nama: '', hp: '', hadir: '', jumlah: '' }
  } catch (e) {
    state.value = 'error'
    message.value = e instanceof Error ? e.message : 'Gagal mengirim, coba lagi.'
  }
}
</script>

<template>
  <section :ref="el" class="band rsvp" :class="{ 'is-in': shown }">
    <h2 class="rsvp__title">Reservation</h2>

    <form class="rsvp__form" @submit.prevent="send">
      <input v-model="form.nama" class="rsvp__in" type="text" placeholder="Nama" />
      <input v-model="form.hp" class="rsvp__in" type="tel" placeholder="No Hp" />
      <select v-model="form.hadir" class="rsvp__in rsvp__in--select">
        <option value="" disabled>Will you be joining us?</option>
        <option value="hadir">Ya, saya akan hadir</option>
        <option value="tidak">Maaf, saya berhalangan</option>
      </select>
      <input
        v-model="form.jumlah"
        class="rsvp__in"
        type="number"
        min="1"
        max="10"
        placeholder="Number of Guests:"
      />
      <button class="rsvp__send" type="submit" :disabled="state === 'sending'">
        {{ state === 'sending' ? 'Mengirim…' : 'Send' }}
      </button>
      <p
        v-if="message"
        class="rsvp__msg"
        :class="{ 'rsvp__msg--err': state === 'error' }"
        :role="state === 'error' ? 'alert' : 'status'"
      >
        {{ message }}
      </p>
    </form>
  </section>
</template>

<style scoped>
.rsvp {
  height: calc(565 * var(--px));
}

/* 2141:1394 — Creattion Demo at 132.67, the largest script on the sheet after the cover. */
.rsvp__title {
  left: calc(118 * var(--px));
  top: 0;
  width: calc(348 * var(--px));
  font-family: var(--font-script);
  font-size: calc(132.67 * var(--px) * var(--script-k));
  line-height: calc(83 * var(--px));
  font-weight: 400;
  color: var(--ink);
  --delay: 0ms;
}

.rsvp__form {
  left: calc(42 * var(--px));
  top: calc(121 * var(--px));
  width: calc(514 * var(--px));
  display: grid;
  gap: calc(7 * var(--px));
  --delay: 120ms;
}

/* 2141:1399 and siblings — white, radius 11, 54 tall, 61 apart. */
.rsvp__in {
  width: 100%;
  height: calc(54 * var(--px));
  padding: 0 calc(12.8 * var(--px));
  border: 0;
  border-radius: calc(11 * var(--px));
  background: #fff;
  font-family: "Bellefair", serif;
  font-size: calc(20 * var(--px));
  line-height: calc(22.92 * var(--px));
  color: #1e3c72;
  text-align: left;
}

/* The design prints every placeholder in this navy, not in a grey. */
.rsvp__in::placeholder { color: #1e3c72; opacity: 1; }
.rsvp__in:focus-visible { outline: 2px solid var(--maroon); outline-offset: 2px; }

/* A select needs its own reset or the platform paints a chrome the design does not have. */
.rsvp__in--select {
  appearance: none;
  background-image: linear-gradient(45deg, transparent 50%, #1e3c72 50%),
    linear-gradient(135deg, #1e3c72 50%, transparent 50%);
  background-position:
    calc(100% - 22px) calc(50% + 2px),
    calc(100% - 16px) calc(50% + 2px);
  background-size: 6px 6px, 6px 6px;
  background-repeat: no-repeat;
}

/* 2141:1407 — olive, radius 99, 42 tall, and 20px wider than the fields on each side. */
.rsvp__send {
  width: calc(516 * var(--px));
  height: calc(42 * var(--px));
  margin: calc(19 * var(--px)) 0 0 calc(-2 * var(--px));
  border: 0;
  border-radius: calc(99 * var(--px));
  background: var(--olive);
  color: #fff;
  font-family: "Bellefair", serif;
  font-size: calc(20 * var(--px));
  cursor: pointer;
}

.rsvp__send:hover { filter: brightness(1.08); }
.rsvp__send:disabled { opacity: 0.7; cursor: default; }

.rsvp__msg {
  font-family: var(--font-sans);
  font-size: calc(14 * var(--px));
  color: var(--ink);
}

.rsvp__msg--err { color: var(--maroon); }
</style>
