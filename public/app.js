const form = document.getElementById('chatForm');
const input = document.getElementById('promptInput');
const chatLog = document.getElementById('chatLog');
const voiceButton = document.getElementById('voiceButton');

function appendMessage(role, text) {
  const div = document.createElement('div');
  div.className = `message ${role}`;
  div.innerHTML = `<strong>${role === 'assistant' ? 'Jarvis' : 'You'}:</strong> ${text}`;
  chatLog.appendChild(div);
  chatLog.scrollTop = chatLog.scrollHeight;
}

async function getJarvisReply(prompt) {
  const response = await fetch('/api/jarvis', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt })
  });

  if (!response.ok) {
    throw new Error('Unable to contact Jarvis backend.');
  }

  const data = await response.json();
  return data.reply.text;
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const prompt = input.value.trim();
  if (!prompt) {
    return;
  }

  appendMessage('user', prompt);
  input.value = '';

  try {
    const reply = await getJarvisReply(prompt);
    appendMessage('assistant', reply);

    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(reply);
      utterance.rate = 1;
      utterance.pitch = 1;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }
  } catch (error) {
    appendMessage('assistant', 'I am unable to respond right now. Please try again.');
  }
});

voiceButton.addEventListener('click', () => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    appendMessage('assistant', 'Voice recognition is not available in this browser.');
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = 'en-US';
  recognition.start();

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    input.value = transcript;
    form.requestSubmit();
  };

  recognition.onerror = () => {
    appendMessage('assistant', 'Voice input was interrupted. Please try again.');
  };
});
