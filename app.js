const steps = Array.from(document.querySelectorAll('.step'));
let currentStep = 0;
let summaryLoaderTimeout;
const paypageUrl = 'paypage.html';

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
  lookingFor: [],
  libido: 50,
  kink: 50,
  nudity: 50,
  willing: [],
  scenarios: [],
  spicyPhotos: null,
  voiceMessages: null,
  specialVideos: null,
};

const ethnicityVideos = {
  Caucasian: 'https://get-honey.today/assets/white-DzMjtTkI.mp4',
  Asian: 'https://get-honey.today/assets/asian-BLmfsWPZ.mp4',
  Latina: 'https://get-honey.today/assets/latin-CPRm7M81.mp4',
  Black: 'https://get-honey.today/assets/black-BBZyLNic.mp4',
};

const reviewSlides = [
  {
    name: 'Nikita V.',
    text: 'The replies feel so real that I never want the chat to end.',
    avatar: 'assets/step-14-pricing/yuki-nakamura.jpg',
  },
  {
    name: 'Daria K.',
    text: 'Scenario customization is super easy, and every chat feels fresh.',
    avatar: 'assets/step-14-pricing/annette-boucher.jpeg',
  },
  {
    name: 'Alex P.',
    text: 'The personalization is the best I have tried in a long time.',
    avatar: 'assets/step-14-pricing/grace-wilson.jpeg',
  },
  {
    name: 'Kirill M.',
    text: 'The conversation quality is impressive and feels natural.',
    avatar: 'assets/step-14-pricing/veronika-krizova.jpeg',
  },
  {
    name: 'Sofia R.',
    text: 'Support and privacy are top-notch, which makes me feel at ease.',
    avatar: 'assets/step-14-pricing/isla-morgan.jpeg',
  },
];

const multiSteps = new Set([6, 8, 10, 11]);
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
  const resultsMode = index === steps.length - 1;
  const showTopbar = true;
  document.body.classList.toggle('show-topbar', showTopbar);
  document.body.classList.toggle('results-mode', resultsMode);
  document.body.classList.toggle('progress-only', !resultsMode);
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
    const collectionKey =
      stepIndex === 6
        ? 'preferences'
        : stepIndex === 8
          ? 'lookingFor'
          : stepIndex === 10
            ? 'willing'
            : 'scenarios';
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
  const modalImage = document.getElementById('analysisModalImage');
  const modalButtons = modal?.querySelectorAll('[data-modal-answer]') ?? [];

  if (!modal || !modalText || !modalImage) return;

  bars.forEach((bar) => (bar.style.width = '0%'));
  values.forEach((value) => (value.textContent = '0%'));

  const questions = [
    {
      key: 'spicyPhotos',
      text: 'Would you like to receive spicy photos?',
      image: 'assets/m_01.webp',
      alt: 'Spicy photos',
    },
    {
      key: 'voiceMessages',
      text: 'Would you like to receive voice messages?',
      image: 'assets/m_02.webp',
      alt: 'Voice messages',
    },
    {
      key: 'specialVideos',
      text: 'Would you like to receive special videos?',
      image: 'assets/m_03.webp',
      alt: 'Special videos',
    },
  ];

  let stage = 0;
  const progress = [0, 0, 0];
  let paused = false;

  const showModal = (index) => {
    modalText.textContent = questions[index].text;
    modalImage.src = questions[index].image;
    modalImage.alt = questions[index].alt;
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
    hasSelection = state.lookingFor.length > 0;
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

  const avatarVideo = document.querySelector('[data-summary-avatar]');
  if (avatarVideo) {
    const selectedOption = steps[0]?.querySelector('.option.selected video');
    const selectedSrc =
      selectedOption?.currentSrc || selectedOption?.getAttribute('src') || '';
    const selection = state.ethnicity || 'Caucasian';
    const videoSrc = selectedSrc || ethnicityVideos[selection] || ethnicityVideos.Caucasian;
    if (videoSrc && avatarVideo.getAttribute('data-active-src') !== videoSrc) {
      avatarVideo.innerHTML = '';
      const source = document.createElement('source');
      source.src = videoSrc;
      source.type = 'video/mp4';
      avatarVideo.appendChild(source);
      avatarVideo.setAttribute('data-active-src', videoSrc);
      avatarVideo.load();
      avatarVideo.play().catch(() => {});
    }
  }

  const joinList = (key, fallback) => (state[key].length ? state[key] : fallback);
  const tags = [
    state.figure || 'Extra skinny',
    `${state.breast || 'Small'} breasts`,
    `${state.butt || 'Small'} butt`,
    state.hair || 'Blonde',
    ...joinList('preferences', ['No makeup']),
    ...joinList('lookingFor', ['Romantic roleplay']),
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

function initReviewSlider() {
  const slider = document.querySelector('[data-review-slider]');
  const dots = document.querySelector('[data-review-dots]');
  if (!slider || !dots || reviewSlides.length === 0) return;

  slider.innerHTML = '';
  dots.innerHTML = '';

  const track = document.createElement('div');
  track.className = 'review-track';

  reviewSlides.forEach((review, index) => {
    const card = document.createElement('div');
    card.className = `review-card${index === 0 ? ' active' : ''}`;
    card.innerHTML = `
      <a class="review-avatar" href="${review.avatar}" target="_blank" rel="noopener noreferrer" aria-label="${review.name} avatar">
        <img src="${review.avatar}" alt="${review.name}" />
      </a>
      <div class="review-content">
        <div class="review-rating">★★★★★</div>
        <div class="review-name">${review.name}</div>
        <div class="review-text">${review.text}</div>
      </div>
    `;
    track.appendChild(card);

    const dot = document.createElement('span');
    if (index === 0) dot.classList.add('active');
    dots.appendChild(dot);
  });

  slider.appendChild(track);
  const cards = Array.from(track.querySelectorAll('.review-card'));
  const dotItems = Array.from(dots.querySelectorAll('span'));
  let activeIndex = 0;
  track.style.transform = 'translateX(0%)';

  setInterval(() => {
    cards[activeIndex].classList.remove('active');
    dotItems[activeIndex].classList.remove('active');
    activeIndex = (activeIndex + 1) % cards.length;
    cards[activeIndex].classList.add('active');
    dotItems[activeIndex].classList.add('active');
    track.style.transform = `translateX(-${activeIndex * 100}%)`;
  }, 3000);
}

bindOptionClicks();
bindContinueButtons();
bindBackButton();
bindSliders();
startTimer();
initProgressTrack();
showStep(getStepFromUrl());
initReviewSlider();

document.addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (!button) return;
  if (currentStep !== steps.length - 1) return;
  const resultsStep = steps[steps.length - 1];
  const topbar = document.querySelector('.topbar');
  if (!resultsStep?.contains(button) && !topbar?.contains(button)) return;
  event.preventDefault();
  window.location.href = paypageUrl;
});
