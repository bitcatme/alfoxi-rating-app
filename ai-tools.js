(function () {
  const form = document.getElementById('aiForm');
  if (!form) return;

  const input = document.getElementById('aiQuestion');
  const output = document.getElementById('aiAnswer');
  const button = form.querySelector('button');

  function show(text, isError) {
    output.textContent = text;
    output.classList.toggle('error', !!isError);
  }

  async function ask(question) {
    button.disabled = true;
    show('Cryp Rat is thinking...');
    try {
      const res = await fetch('/.netlify/functions/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, assets: getAssetCards() })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) show(data.error || 'Something went wrong.', true);
      else show(data.answer);
    } catch {
      show('Could not reach the AI service.', true);
    } finally {
      button.disabled = false;
    }
  }

  form.addEventListener('submit', e => {
    e.preventDefault();
    const q = input.value.trim();
    if (q) ask(q);
  });

  document.querySelectorAll('.ai-chip').forEach(chip =>
    chip.addEventListener('click', () => {
      input.value = chip.textContent;
      ask(chip.textContent);
    })
  );
})();
