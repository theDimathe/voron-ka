const steps = Array.from(document.querySelectorAll('.step'));
let currentStep = 0;
let summaryLoaderTimeout;

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
  'analysis',
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
const autoAdvanceSteps = new Set([0, 1, 2, 3, 4, 5]);
const analysisSteps = new Set([12]);
const selectionRequiredSteps = new Set([6, 8, 10, 11]);

const selectionsMap = {
  0: 'ethnicity',
  1: 'age',
  2: 'figure',
  3: 'breast',
  4: 'butt',
  5: 'hair',
  8: 'lookingFor',
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
    runAnalysisFlow(index);
  }
  if (index === 13) {
    updateSummary();
    startSummaryLoader();
  }
}

function nextStep() {
  if (currentStep < steps.length - 1) {
    showStep(currentStep + 1);
  }
}

function prevStep() {
  if (currentStep > 0) {
    showStep(currentStep - 1);
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

function bindBackButton() {
  const backButton = document.getElementById('backButton');
  if (!backButton) return;
  backButton.addEventListener('click', () => prevStep());
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

function runAnalysisFlow(stepIndex) {
  const step = steps[stepIndex];
  const bars = step.querySelectorAll('.bar');
  const values = step.querySelectorAll('.progress-value');
  const modal = document.getElementById('analysisModal');
  const modalText = document.getElementById('analysisModalText');
  const modalButtons = modal?.querySelectorAll('[data-modal-answer]') ?? [];

  if (!modal || !modalText) return;

  bars.forEach((bar) => (bar.style.width = '0%'));
  values.forEach((value) => (value.textContent = '0%'));

  const questions = [
    { key: 'spicyPhotos', text: 'Would you like to receive spicy photos?' },
    { key: 'voiceMessages', text: 'Would you like to receive voice messages?' },
    { key: 'specialVideos', text: 'Would you like to receive special videos?' },
  ];

  let stage = 0;
  const progress = [0, 0, 0];
  let paused = false;

  const showModal = (index) => {
    modalText.textContent = questions[index].text;
    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');
    paused = true;
  };

  const hideModal = () => {
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
    paused = false;
  };

  const buttons = Array.from(modalButtons).map((button) => {
    const clone = button.cloneNode(true);
    button.replaceWith(clone);
    return clone;
  });

  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      const answer = button.dataset.modalAnswer;
      if (answer && questions[stage]) {
        state[questions[stage].key] = answer;
      }
      hideModal();
      stage += 1;
      if (stage >= questions.length) {
        setTimeout(() => {
          if (currentStep === stepIndex) {
            nextStep();
          }
        }, 600);
      }
    });
  });

  const interval = setInterval(() => {
    if (currentStep !== stepIndex) {
      clearInterval(interval);
      return;
    }

    if (paused || stage >= questions.length) {
      return;
    }

    progress[stage] = Math.min(progress[stage] + Math.ceil(Math.random() * 7), 100);
    bars.forEach((bar, idx) => {
      bar.style.width = `${progress[idx]}%`;
    });
    values.forEach((value, idx) => {
      value.textContent = `${progress[idx]}%`;
    });

    if (progress[stage] >= 100) {
      showModal(stage);
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

  setText('libido', `${state.libido}%`);
  setText('kink', `${state.kink}%`);
  setText('nudity', `${state.nudity}%`);

  const joinList = (key, fallback) => (state[key].length ? state[key] : fallback);
  const tags = [
    state.figure || 'Extra skinny',
    `${state.breast || 'Small'} breasts`,
    `${state.butt || 'Small'} butt`,
    state.hair || 'Blonde',
    ...joinList('preferences', ['No makeup']),
    state.lookingFor || 'Romantic roleplay',
    ...joinList('willing', ['Backdoor action']),
    ...joinList('scenarios', ['Doctor & Patient']),
  ].filter(Boolean);

  const tagsContainer = document.querySelector('[data-summary-tags="core"]');
  if (tagsContainer) {
    tagsContainer.innerHTML = '';
    tags.forEach((item) => {
      const tag = document.createElement('span');
      tag.className = 'summary-tag';
      tag.textContent = item;
      tagsContainer.appendChild(tag);
    });
  }

  const setMeter = (key, value) => {
    const meter = document.querySelector(`[data-summary-meter="${key}"]`);
    if (meter) {
      meter.style.setProperty('--percent', value);
    }
  };

  setMeter('libido', state.libido);
  setMeter('kink', state.kink);
  setMeter('nudity', state.nudity);

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
      tag.className = 'summary-extra';
      tag.textContent = item;
      extras.appendChild(tag);
    });
  }
}

function startSummaryLoader() {
  const frame = document.querySelector('.summary-avatar-frame');
  if (!frame) return;
  const loader = frame.querySelector('.summary-loader');
  const avatar = frame.querySelector('.summary-avatar');
  if (!loader || !avatar) return;

  avatar.classList.add('is-hidden');
  loader.classList.add('is-visible');
  clearTimeout(summaryLoaderTimeout);
  summaryLoaderTimeout = setTimeout(() => {
    if (currentStep !== 13) return;
    loader.classList.remove('is-visible');
    avatar.classList.remove('is-hidden');
  }, 3000);
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
bindBackButton();
bindSliders();
startTimer();
initProgressTrack();
showStep(getStepFromUrl());
