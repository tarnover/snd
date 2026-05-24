const html = require('choo/html');

module.exports = function howItWorksDialog() {
  return function(state, emit, close) {
    const t = key => state.translate(key);

    return html`
      <send-how-dialog class="snd-how">
        <button
          class="snd-how-close"
          onclick=${close}
          aria-label="${t('howItWorksCloseLabel')}"
        >
          ×
        </button>

        <h2 class="snd-display snd-how-title">${t('howItWorksTitle')}</h2>
        <p class="snd-body-sm snd-how-lede">${t('howItWorksLede')}</p>

        ${diagram(t)}

        <ol class="snd-how-steps" aria-label="${t('howItWorksStepsLabel')}">
          <li class="snd-how-step">
            <span class="snd-how-step-num">01</span>
            <div>
              <h3 class="snd-how-step-title">${t('howItWorksStep1Title')}</h3>
              <p class="snd-how-step-body">${t('howItWorksStep1Body')}</p>
            </div>
          </li>
          <li class="snd-how-step">
            <span class="snd-how-step-num">02</span>
            <div>
              <h3 class="snd-how-step-title">${t('howItWorksStep2Title')}</h3>
              <p class="snd-how-step-body">${t('howItWorksStep2Body')}</p>
            </div>
          </li>
          <li class="snd-how-step">
            <span class="snd-how-step-num">03</span>
            <div>
              <h3 class="snd-how-step-title">${t('howItWorksStep3Title')}</h3>
              <p class="snd-how-step-body">${t('howItWorksStep3Body')}</p>
            </div>
          </li>
          <li class="snd-how-step">
            <span class="snd-how-step-num">04</span>
            <div>
              <h3 class="snd-how-step-title">${t('howItWorksStep4Title')}</h3>
              <p class="snd-how-step-body">${t('howItWorksStep4Body')}</p>
            </div>
          </li>
        </ol>

        <p class="snd-how-foot snd-code-sm">${t('howItWorksFootnote')}</p>

        <button
          class="snd-btn snd-btn--primary snd-btn--full snd-how-cta"
          onclick=${close}
        >
          ${t('howItWorksClose')}
        </button>
      </send-how-dialog>
    `;
  };
};

function diagram(t) {
  return html`
    <figure
      class="snd-how-diagram"
      role="img"
      aria-label="${t('howItWorksDiagramAlt')}"
    >
      <svg viewBox="0 0 480 140" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="snd-how-wire" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stop-color="var(--snd-line)" />
            <stop offset="50%" stop-color="var(--snd-accent)" stop-opacity="0.6" />
            <stop offset="100%" stop-color="var(--snd-line)" />
          </linearGradient>
        </defs>

        <line
          x1="78" y1="70" x2="402" y2="70"
          stroke="url(#snd-how-wire)" stroke-width="1.5"
          stroke-dasharray="4 4"
        />

        <g class="snd-how-node" transform="translate(40,70)">
          <rect x="-32" y="-26" width="64" height="52" rx="0"
                fill="var(--snd-card)" stroke="var(--snd-line)" stroke-width="1.25"/>
          <path d="M -12 -10 H 6 L 12 -4 V 12 H -12 Z"
                fill="none" stroke="var(--snd-text)" stroke-width="1.25"
                stroke-linejoin="round" stroke-linecap="round"/>
          <line x1="-8" y1="-2" x2="8" y2="-2" stroke="var(--snd-text)" stroke-width="1"/>
          <line x1="-8" y1="3"  x2="8" y2="3"  stroke="var(--snd-text)" stroke-width="1"/>
          <line x1="-8" y1="8"  x2="4" y2="8"  stroke="var(--snd-text)" stroke-width="1"/>
          <text x="0" y="44" text-anchor="middle"
                font-family="var(--snd-font-mono)" font-size="9"
                fill="var(--snd-mute)" letter-spacing="0.06em">
            ${t('howItWorksDiagramYou')}
          </text>
        </g>

        <g class="snd-how-node" transform="translate(240,70)">
          <rect x="-36" y="-26" width="72" height="52" rx="0"
                fill="var(--snd-card)" stroke="var(--snd-line)" stroke-width="1.25"/>
          <path d="M -10 4 V -4 a 10 10 0 0 1 20 0 V 4"
                fill="none" stroke="var(--snd-accent)" stroke-width="1.5"
                stroke-linecap="round"/>
          <rect x="-14" y="4" width="28" height="14" rx="1"
                fill="none" stroke="var(--snd-accent)" stroke-width="1.5"/>
          <circle cx="0" cy="11" r="1.5" fill="var(--snd-accent)"/>
          <text x="0" y="44" text-anchor="middle"
                font-family="var(--snd-font-mono)" font-size="9"
                fill="var(--snd-mute)" letter-spacing="0.06em">
            ${t('howItWorksDiagramServer')}
          </text>
        </g>

        <g class="snd-how-node" transform="translate(440,70)">
          <rect x="-32" y="-26" width="64" height="52" rx="0"
                fill="var(--snd-card)" stroke="var(--snd-line)" stroke-width="1.25"/>
          <circle cx="0" cy="-6" r="6" fill="none"
                  stroke="var(--snd-text)" stroke-width="1.25"/>
          <path d="M -10 14 a 10 10 0 0 1 20 0" fill="none"
                stroke="var(--snd-text)" stroke-width="1.25" stroke-linecap="round"/>
          <text x="0" y="44" text-anchor="middle"
                font-family="var(--snd-font-mono)" font-size="9"
                fill="var(--snd-mute)" letter-spacing="0.06em">
            ${t('howItWorksDiagramRecipient')}
          </text>
        </g>

        <g class="snd-how-packet">
          <rect x="-6" y="-5" width="12" height="10" rx="0"
                fill="var(--snd-accent)" />
        </g>
      </svg>
    </figure>
  `;
}
