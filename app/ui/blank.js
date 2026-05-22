const html = require('choo/html');

module.exports = function() {
  return html`
    <main class="snd-main snd-main--centered">
      <section class="snd-recipient">
        <div class="md:mr-6 md:w-1/2 w-full"></div>
        <div class="md:w-1/2 mt-6 md:mt-0 w-full"></div>
      </section>
    </main>
  `;
};
