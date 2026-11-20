// The conversation history we send to OpenAI.
// The "system" message tells the AI how to behave.
const messages = [
    {
        role: 'system',
        content: 'You are the friendly assistant for Offbeat Retreats, a site with quirky vacation rentals. Help visitors find their perfect offbeat retreat. Before recommending anything, ask the visitor 2-3 simple questions, one at a time, to learn their preferences. Base your questions on the rental data, like the vibe or theme they want (spooky, silly, cozy, out-of-this-world), the location or region they prefer, and how important ratings are to them. After they answer, recommend the top 1-2 rentals from the list that best match their answers and explain why. Keep your replies short and friendly, like a helpful travel buddy. Format your replies for easy reading: use line breaks between ideas and simple dashes (-) for bullet points. Do not use markdown symbols like asterisks, because the chat window shows plain text only.'
    }
];

// Load the rental data and add it to the system message
// so the AI can recommend rentals that match the user's preferences
async function loadRentals() {
    // Fetch the rentals.json file and wait for the response
    const response = await fetch('./rentals.json');

    // Turn the response into a JavaScript object
    const data = await response.json();

    // Add the rental data to the system message so the AI knows about it.
    // JSON.stringify turns the object back into text the AI can read.
    messages[0].content += ` Only recommend rentals from this list: ${JSON.stringify(data.rentals)}`;
}

// Send the full conversation to the OpenAI Chat Completions API
// and return the AI's reply as text
async function getAIResponse() {
    // Call the API and wait for the response
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            // The API key comes from js/secrets.js
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: 'gpt-4o',
            messages: messages, // the whole conversation so far
            temperature: 0.8, // a little creativity for a natural, conversational tone
            max_tokens: 300 // keep replies short so they fit nicely in the chat window
        })
    });

    // Turn the response into a JavaScript object
    const data = await response.json();

    // Return the text of the AI's reply
    return data.choices[0].message.content;
}

// Main function to initialize the chat interface
function initChat() {
    // Get all required DOM elements
    const chatToggle = document.getElementById('chatToggle');
    const chatBox = document.getElementById('chatBox');
    const userInput = document.getElementById('userInput');
    const chatMessages = document.getElementById('chatMessages');
    const openIcon = document.querySelector('.open-icon');
    const closeIcon = document.querySelector('.close-icon');

    // Toggle chat visibility and swap icons
    chatToggle.addEventListener('click', function() {
        chatBox.classList.toggle('active');
        openIcon.style.display = chatBox.classList.contains('active') ? 'none' : 'block';
        closeIcon.style.display = chatBox.classList.contains('active') ? 'block' : 'none';
    });

    // Handle user input and process messages
    async function handleUserInput(e) {
        e.preventDefault();
        const message = userInput.value.trim();
        if (message) {
            userInput.value = '';

            // Display the user's message
            const userMessage = document.createElement('div');
            userMessage.classList.add('message', 'user');
            userMessage.textContent = message;
            chatMessages.appendChild(userMessage);

            // Add the user's message to the conversation history
            messages.push({ role: 'user', content: message });

            // Show a temporary "typing" message while we wait for the AI
            const botMessage = document.createElement('div');
            botMessage.classList.add('message', 'bot');
            botMessage.textContent = '...';
            chatMessages.appendChild(botMessage);

            // Scroll to the latest message
            chatMessages.scrollTop = chatMessages.scrollHeight;

            try {
                // Get the AI's reply and show it in the chat window
                const reply = await getAIResponse();
                botMessage.textContent = reply;

                // Add the AI's reply to the conversation history
                // so it remembers the whole conversation
                messages.push({ role: 'assistant', content: reply });
            } catch (error) {
                // Show a friendly message if something goes wrong
                botMessage.textContent = 'Sorry, something went wrong. Please try again.';
                console.error(`Error talking to OpenAI: ${error}`);
            }

            // Scroll to the latest message again
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }

    // Listen for form submission
    document.getElementById('chatForm').addEventListener('submit', handleUserInput);
}

// Load the rental data, then initialize the chat interface
loadRentals();
initChat();
