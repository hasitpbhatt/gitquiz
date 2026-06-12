// @ts-check

const PERSONAS = {
  child: {
    label: 'Like I\'m 10',
    icon: '🧒',
    system: 'You are explaining to a 10-year-old child. Use simple words, fun analogies, and everyday examples. No jargon. Keep it engaging and easy to understand.'
  },
  deep: {
    label: 'Deep Dive',
    icon: '🔬',
    system: 'You are a domain expert. Provide deep, nuanced insights and connect the concept to advanced research, industry practices, or expert-level perspectives. Assume the student has strong foundational knowledge.'
  },
  'first-principles': {
    label: 'First Principles',
    icon: '🧠',
    system: 'You are a first-principles thinker. Break the concept down to its most fundamental truths and derive the explanation from base principles. Use logical reasoning, and where applicable, mathematical or formal foundations. Assume the student is comfortable with abstract thinking.'
  },
  socratic: {
    label: 'Socratic Tutor',
    icon: '❓',
    system: 'You are a Socratic tutor. Do not give direct answers. Instead, ask guiding questions that lead the student to discover the concept themselves. Challenge their assumptions and help them reason step by step.'
  }
};

async function askAI(persona) {
  if (!MISTRAL_PROXY_URL) return;

  const personaDef = PERSONAS[persona];
  if (!personaDef) return;

  const btn = document.querySelector(`.ai-persona-btn[data-persona="${persona}"]`);
  const responseDiv = document.getElementById('ai-response');
  if (!btn || !responseDiv) return;

  btn.disabled = true;
  btn.innerHTML = '<span class="inline-block animate-spin mr-1">?</span> Thinking...';
  responseDiv.innerHTML = '';
  responseDiv.classList.remove('hidden');

  const q = quizData[currentIdx];
  if (!q) {
    responseDiv.innerHTML = 'No question data available.';
    btn.disabled = false;
    btn.innerHTML = personaDef.icon + ' ' + personaDef.label;
    return;
  }

  const prompt = personaDef.system + '\n\n' +
    'The student just answered a quiz question and needs an explanation.\n\n' +
    'Question: ' + q.question + '\n' +
    'Context: ' + (q.content || 'N/A') + '\n' +
    'Scenario: ' + (q.description || 'N/A') + '\n' +
    'Correct Answer: ' + q.answer + '\n\n' +
    'The student selected: "' + lastSelectedAnswer + '" and was ' +
    (lastAnswerCorrect ? 'CORRECT' : 'INCORRECT') + '.\n\n' +
    (persona !== 'socratic'
      ? 'Provide a concise explanation (2-3 paragraphs).'
      : 'Respond with 2-3 Socratic questions to guide the student.');

  try {
    const res = await fetch(MISTRAL_PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'mistral-small-latest',
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!res.ok) throw new Error('HTTP ' + res.status);

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || data.content || '';

    if (content) {
      responseDiv.innerHTML = '<span class="font-700 text-xs uppercase tracking-wider text-indigo-400">' + personaDef.icon + ' ' + personaDef.label + '</span><div class="mt-2">' + content + '</div>';
    } else {
      throw new Error('Empty response');
    }
  } catch (err) {
    responseDiv.innerHTML = 'AI explainer is not available right now.';
  } finally {
    btn.disabled = false;
    btn.innerHTML = personaDef.icon + ' ' + personaDef.label;
  }
}
