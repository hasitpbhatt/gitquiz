// @ts-check

async function askAI() {
    if (!MISTRAL_PROXY_URL) return;

    const btn = document.getElementById('explain-more-btn');
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
        btn.innerHTML = 'Explain More with AI';
        return;
    }

    const prompt = 'You are a tutor helping a student understand a concept. ' +
        'They just answered a quiz question.\n\n' +
        'Question: ' + q.question + '\n' +
        'Context: ' + (q.content || 'N/A') + '\n' +
        'Scenario: ' + (q.description || 'N/A') + '\n' +
        'Correct Answer: ' + q.answer + '\n\n' +
        'The student selected: "' + lastSelectedAnswer + '" and was ' +
        (lastAnswerCorrect ? 'CORRECT' : 'INCORRECT') + '.\n\n' +
        'Provide a deeper, intuitive explanation of this concept with a fresh real-world example. ' +
        'Keep it concise (2-3 paragraphs).';

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
            responseDiv.innerHTML = content;
        } else {
            throw new Error('Empty response');
        }
    } catch (err) {
        responseDiv.innerHTML = 'AI explainer is not available right now.';
    } finally {
        btn.disabled = false;
        btn.innerHTML = 'Explain More with AI';
    }
}
