const steps = Array.from(document.querySelectorAll('.step'));
let currentStep = 0;

const stepSlugs = [
  'ethnicity',
  'age',
  'figure',
  'breast-size',
  'butt-size',
  'hair',
  'preferences',
  'intro',
  'looking-for',
  'traits',
  'try',
  'scenarios',
  'analysis-1',
  'spicy-photos',
  'analysis-2',
  'voice-messages',
  'analysis-3',
  'special-videos',
  'summary',
  'pricing',
];

const state = {
  ethnicity: null,
  age: null,
  figure: null,
  breast: null,
  butt: null,
  hair: null,
  preferences: [],
  lookingFor: null,
  libido: 50,
  kink: 50,
  nudity: 50,
  willing: [],
  scenarios: [],
  spicyPhotos: null,
  voiceMessages: null,
  specialVideos: null,
};

const multiSteps = new Set([6, 10, 11]);
const autoAdvanceSteps = new Set([0, 1, 2, 3, 4, 5, 13, 15, 17]);
const analysisSteps = new Set([12, 14, 16]);
const selectionRequiredSteps = new Set([6, 8, 10, 11]);

const selectionsMap = {
  0: 'ethnicity',
  1: 'age',
  2: 'figure',
  3: 'breast',
  4: 'butt',
  5: 'hair',
  8: 'lookingFor',
  13: 'spicyPhotos',
  15: 'voiceMessages',
  17: 'specialVideos',
};

function updateUrlForStep(index) {
  const slug = stepSlugs[index] ?? `step-${index + 1}`;
  const url = new URL(window.location.href);
  url.searchParams.set('quizStep', slug);
  window.history.replaceState({ quizStep: slug }, '', url.toString());
}

function getStepFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('quizStep');
  if (!slug) return 0;
  const index = stepSlugs.indexOf(slug);
  return index >= 0 ? index : 0;
}

function showStep(index) {
  steps.forEach((step, idx) => {
    step.classList.toggle('active', idx === index);
  });
  currentStep = index;
  updateUrlForStep(index);
  updateProgressTrack(index);
  updateContinueState(index);
  if (analysisSteps.has(index)) {
    runProgressAnimation(index);
  }
  if (index === 18) {
    updateSummary();
  }
}

function nextStep() {
  if (currentStep < steps.length - 1) {
    showStep(currentStep + 1);
  }
}

function handleOptionClick(option, stepIndex) {
  const value = option.dataset.value;
  if (!value) return;

  const step = steps[stepIndex];
  const options = step.querySelectorAll('.option');
  options.forEach((item) => {
    if (item !== option && !multiSteps.has(stepIndex)) {
      item.classList.remove('selected');
    }
  });

  if (multiSteps.has(stepIndex)) {
    option.classList.toggle('selected');
    const collectionKey = stepIndex === 6 ? 'preferences' : stepIndex === 10 ? 'willing' : 'scenarios';
    const list = state[collectionKey];
    if (option.classList.contains('selected')) {
      if (!list.includes(value)) list.push(value);
    } else {
      state[collectionKey] = list.filter((item) => item !== value);
    }
    updateContinueState(stepIndex);
    return;
  }

  const key = selectionsMap[stepIndex];
  if (key) {
    state[key] = value;
  }
  option.classList.add('selected');
  updateContinueState(stepIndex);

  if (autoAdvanceSteps.has(stepIndex)) {
    nextStep();
  }
}

function bindOptionClicks() {
  steps.forEach((step, index) => {
    const options = step.querySelectorAll('.option');
    options.forEach((option) => {
      option.addEventListener('click', () => handleOptionClick(option, index));
    });
  });
}

function bindContinueButtons() {
  document.querySelectorAll('[data-action="continue"]').forEach((button) => {
    button.addEventListener('click', () => nextStep());
  });
}

function bindSliders() {
  document.querySelectorAll('[data-slider]').forEach((input) => {
    input.addEventListener('input', () => {
      const key = input.dataset.slider;
      const value = Number(input.value);
      state[key] = value;
      const output = document.querySelector(`[data-slider-value="${key}"]`);
      if (output) {
        output.textContent = `${value}%`;
      }
    });
  });
}

function runProgressAnimation(stepIndex) {
  const step = steps[stepIndex];
  const bars = step.querySelectorAll('.bar');
  const values = step.querySelectorAll('.progress-value');

  bars.forEach((bar) => (bar.style.width = '0%'));
  values.forEach((value) => (value.textContent = '0%'));

  const targets = [100, stepIndex === 12 ? 65 : stepIndex === 14 ? 80 : 100, stepIndex === 16 ? 40 : 15];
  let progress = [0, 0, 0];

  const interval = setInterval(() => {
    progress = progress.map((value, idx) => Math.min(value + Math.ceil(Math.random() * 7), targets[idx]));
    bars.forEach((bar, idx) => {
      bar.style.width = `${progress[idx]}%`;
    });
    values.forEach((value, idx) => {
      value.textContent = `${progress[idx]}%`;
    });

    if (progress.every((value, idx) => value >= targets[idx])) {
      clearInterval(interval);
      setTimeout(() => {
        if (currentStep === stepIndex) {
          nextStep();
        }
      }, 800);
    }
  }, 160);
}

function initProgressTrack() {
  const track = document.getElementById('progressTrack');
  if (!track) return;
  track.innerHTML = '';
  steps.forEach(() => {
    const span = document.createElement('span');
    track.appendChild(span);
  });
}

function updateProgressTrack(index) {
  const track = document.getElementById('progressTrack');
  if (!track) return;
  const segments = Array.from(track.children);
  segments.forEach((segment, idx) => {
    segment.classList.toggle('active', idx <= index);
  });
}

function updateContinueState(stepIndex) {
  if (!selectionRequiredSteps.has(stepIndex)) return;
  const step = steps[stepIndex];
  const button = step.querySelector('[data-action="continue"]');
  if (!button) return;

  let hasSelection = false;
  if (stepIndex === 6) {
    hasSelection = state.preferences.length > 0;
  } else if (stepIndex === 8) {
    hasSelection = Boolean(state.lookingFor);
  } else if (stepIndex === 10) {
    hasSelection = state.willing.length > 0;
  } else if (stepIndex === 11) {
    hasSelection = state.scenarios.length > 0;
  }
  button.disabled = !hasSelection;
}

function updateSummary() {
  const setText = (key, fallback) => {
    const target = document.querySelector(`[data-summary="${key}"]`);
    if (!target) return;
    const value = state[key] || fallback;
    target.textContent = value;
  };

  setText('lookingFor', 'Romantic roleplay');
  setText('figure', 'Extra skinny');
  setText('breast', 'Small');
  setText('butt', 'Small');
  setText('hair', 'Blonde');
  setText('libido', `${state.libido}%`);
  setText('kink', `${state.kink}%`);
  setText('nudity', `${state.nudity}%`);

  const joinList = (key, fallback) => (state[key].length ? state[key].join(', ') : fallback);

  const preferences = document.querySelector('[data-summary="preferences"]');
  if (preferences) preferences.textContent = joinList('preferences', 'Tattoos');
  const willing = document.querySelector('[data-summary="willing"]');
  if (willing) willing.textContent = joinList('willing', 'Threesome');
  const scenarios = document.querySelector('[data-summary="scenarios"]');
  if (scenarios) scenarios.textContent = joinList('scenarios', 'Doctor & Patient');

  const extras = document.querySelector('[data-summary="extras"]');
  if (extras) {
    extras.innerHTML = '';
    const extrasList = [
      state.spicyPhotos === 'Yes' ? 'Spicy photos' : null,
      state.voiceMessages === 'Yes' ? 'Voice messages' : null,
      state.specialVideos === 'Yes' ? 'Special videos' : null,
    ].filter(Boolean);
    (extrasList.length ? extrasList : ['Spicy photos', 'Voice messages', 'Special videos']).forEach((item) => {
      const tag = document.createElement('span');
      tag.className = 'tag';
      tag.textContent = item;
      extras.appendChild(tag);
    });
  }
}

function startTimer() {
  const timer = document.querySelector('[data-timer]');
  if (!timer) return;

  let remaining = 9 * 60 * 60 + 55 * 60 + 1;
  setInterval(() => {
    remaining = Math.max(0, remaining - 1);
    const hours = String(Math.floor(remaining / 3600)).padStart(2, '0');
    const minutes = String(Math.floor((remaining % 3600) / 60)).padStart(2, '0');
    const seconds = String(remaining % 60).padStart(2, '0');
    timer.textContent = `${hours}:${minutes}:${seconds}`;
  }, 1000);
}

bindOptionClicks();
bindContinueButtons();
bindSliders();
startTimer();
initProgressTrack();
showStep(getStepFromUrl());
