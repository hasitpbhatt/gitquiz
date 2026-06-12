// @ts-check

const MAX_TURNS = 5;

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

function buildInitialPrompt(persona) {
  const q = quizData[currentIdx];
  if (!q) return '';
  return 'The student just answered a quiz question and needs an explanation.\n\n' +
    'Question: ' + q.question + '\n' +
    'Context: ' + (q.content || 'N/A') + '\n' +
    'Scenario: ' + (q.description || 'N/A') + '\n' +
    'Correct Answer: ' + q.answer + '\n\n' +
    'The student selected: "' + lastSelectedAnswer + '" and was ' +
    (lastAnswerCorrect ? 'CORRECT' : 'INCORRECT') + '.\n\n' +
    (persona !== 'socratic'
      ? 'Provide a concise explanation (2-3 paragraphs).'
      : 'Respond with 2-3 Socratic questions to guide the student.');
}

async function askAI(persona) {
  if (!MISTRAL_PROXY_URL) return;

  const personaDef = PERSONAS[persona];
  if (!personaDef) return;

  const btn = document.querySelector(`.ai-persona-btn[data-persona="${persona}"]`);
  const responseDiv = document.getElementById('ai-response');
  if (!btn || !responseDiv) return;

  const q = quizData[currentIdx];
  if (!q) {
    responseDiv.classList.remove('hidden');
    responseDiv.innerHTML = 'No question data available.';
    return;
  }

  currentAiPersona = persona;
  aiConversation = {
    messages: [
      { role: 'system', content: personaDef.system },
      { role: 'user', content: buildInitialPrompt(persona) }
    ],
    turn: 0
  };

  btn.disabled = true;
  btn.innerHTML = '<span class="inline-block animate-spin mr-1">?</span> Thinking...';
  responseDiv.innerHTML = '';
  responseDiv.classList.remove('hidden');
  hideChatInput();

  try {
    const res = await fetch(MISTRAL_PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'mistral-small-latest',
        messages: aiConversation.messages
      })
    });

    if (!res.ok) throw new Error('HTTP ' + res.status);

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || data.content || '';

    if (content) {
      aiConversation.messages.push({ role: 'assistant', content });
      aiConversation.turn = 1;
      renderConversation();
      updateChatUI();
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

async function sendFollowUp() {
  const input = document.getElementById('chat-input');
  const sendBtn = document.getElementById('chat-send-btn');
  const text = input ? input.value.trim() : '';
  if (!text || !currentAiPersona || !sendBtn) return;

  const conv = aiConversation;
  if (!conv || conv.turn >= MAX_TURNS) return;

  input.value = '';
  input.disabled = true;
  sendBtn.disabled = true;
  sendBtn._origText = sendBtn.innerHTML;
  sendBtn.innerHTML = '<span class="inline-block animate-spin mr-1">⏳</span> Sending...';

  conv.messages.push({ role: 'user', content: text });
  renderConversation();

  try {
    const res = await fetch(MISTRAL_PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'mistral-small-latest',
        messages: conv.messages
      })
    });

    if (!res.ok) throw new Error('HTTP ' + res.status);

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || data.content || '';

    if (content) {
      conv.messages.push({ role: 'assistant', content });
      conv.turn++;
      renderConversation();
      updateChatUI();
    } else {
      throw new Error('Empty response');
    }
  } catch (err) {
    const responseDiv = document.getElementById('ai-response');
    if (responseDiv) {
      const lastChild = responseDiv.lastElementChild;
      const isAlreadyError = lastChild && lastChild.classList.contains('error');
      if (!isAlreadyError) {
        responseDiv.insertAdjacentHTML('beforeend', '<div class="chat-bubble error">⚠️ AI explainer is not available right now. Please try again.</div>');
        responseDiv.scrollTop = responseDiv.scrollHeight;
      }
    }
  } finally {
    const limitReached = conv && conv.turn >= MAX_TURNS;
    if (!limitReached) {
      input.disabled = false;
      sendBtn.disabled = false;
      sendBtn.innerHTML = sendBtn._origText || 'Send →';
    }
    delete sendBtn._origText;
    input.focus();
  }
}

function sanitizeHtml(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  doc.querySelectorAll('script, iframe, object, embed').forEach(el => el.remove());
  doc.querySelectorAll('*').forEach(el => {
    for (const attr of [...el.attributes]) {
      if (attr.name.startsWith('on') ||
          (attr.name === 'href' && /^\s*javascript\s*:/i.test(attr.value)) ||
          (attr.name === 'src' && /^\s*javascript\s*:/i.test(attr.value))) {
        el.removeAttribute(attr.name);
      }
    }
  });
  return doc.body.innerHTML;
}

function mdToHtml(text) {
  if (typeof marked !== 'undefined' && marked.parse) {
    return sanitizeHtml(marked.parse(text, { breaks: true }));
  }
  return text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function renderConversation() {
  const responseDiv = document.getElementById('ai-response');
  if (!responseDiv) return;

  const conv = aiConversation;
  if (!conv || conv.messages.length === 0) return;

  responseDiv.classList.remove('hidden');

  let html = '';
  let started = false;

  for (const msg of conv.messages) {
    if (msg.role === 'system') continue;
    if (!started) {
      if (msg.role === 'assistant') started = true;
      else continue;
    }

    if (msg.role === 'user') {
      html += `<div class="chat-bubble user"><span class="font-700 text-xs uppercase tracking-wider text-slate-400">You</span><p class="mt-1">${escapeHtml(msg.content)}</p></div>`;
    } else {
      html += `<div class="chat-bubble assistant"><span class="font-700 text-xs uppercase tracking-wider text-indigo-400">${PERSONAS[currentAiPersona]?.icon || ''} ${PERSONAS[currentAiPersona]?.label || currentAiPersona}</span><div class="mt-2">${mdToHtml(msg.content)}</div></div>`;
    }
  }

  responseDiv.innerHTML = html;
  responseDiv.scrollTop = responseDiv.scrollHeight;
}

function updateChatUI() {
  const conv = aiConversation;
  const inputArea = document.getElementById('chat-input-area');
  const turnInfo = document.getElementById('chat-turn-info');
  const input = document.getElementById('chat-input');
  const sendBtn = document.getElementById('chat-send-btn');

  if (!conv || conv.turn === 0 || !inputArea || !turnInfo) return;

  inputArea.classList.remove('hidden');
  turnInfo.classList.remove('hidden');

  if (conv.turn >= MAX_TURNS) {
    if (input) input.disabled = true;
    if (sendBtn) sendBtn.disabled = true;
    turnInfo.textContent = 'Conversation limit reached (max ' + MAX_TURNS + ' exchanges)';
  } else {
    if (input) input.disabled = false;
    if (sendBtn) sendBtn.disabled = false;
    turnInfo.textContent = 'Exchange ' + conv.turn + ' of ' + MAX_TURNS;
  }
}

function hideChatInput() {
  const inputArea = document.getElementById('chat-input-area');
  const turnInfo = document.getElementById('chat-turn-info');
  if (inputArea) inputArea.classList.add('hidden');
  if (turnInfo) turnInfo.classList.add('hidden');
}

function resetAiChat() {
  aiConversation = { messages: [], turn: 0 };
  currentAiPersona = '';
  const responseDiv = document.getElementById('ai-response');
  if (responseDiv) {
    responseDiv.innerHTML = '';
    responseDiv.classList.add('hidden');
  }
  hideChatInput();
}
