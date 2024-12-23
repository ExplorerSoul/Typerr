const words = [
    "apple", "banana", "grape", "orange", "kiwi", "mango", "peach", "pineapple", "strawberry", "blueberry","cherry", "watermelon", "papaya", "coconut", "pear", "plum", "apricot", "fig", "date", "lemon","lime", "raspberry", "blackberry", "tangerine", "pomegranate","cantaloupe", "honeydew", "nectarine", "passionfruit", "dragonfruit","carrot", "broccoli", "spinach", "lettuce", "cucumber","tomato", "pepper", "onion", "garlic", "potato","sweet potato", "zucchini", "eggplant", "pumpkin", "radish","beetroot", "turnip", "cauliflower", "asparagus", "celery","corn", "peas", "green bean", "kale", "arugula","quinoa", "rice", "pasta", "bread", "bagel",
    "croissant", "tortilla", "pizza", "burger", "sandwich","sushi", "noodle","soup","salad","cereal","oatmeal","yogurt","cheese","butter","cream","milk","egg","chicken","beef","fish","shrimp","tofu","nuts","seeds","chocolate","cookie","cake","pie","pudding","ice cream","jelly","jam","syrup","honey","sugar","adventure", "journey", "exploration", "discovery", "imagination","creativity", "innovation", "inspiration", "motivation", "determination","success", "failure", "challenge", "opportunity", "experience","knowledge", "wisdom", "insight", "perspective","understanding","growth", "change", "transformation", "progress", "development","friendship", "love", "family", "community", "connection","trust", "loyalty", "kindness", "compassion", "empathy","happiness", "joy", "peace", "serenity", "contentment","gratitude", "appreciation", "celebration", "harmony", "balance","nature", "environment", "ocean", "mountain", "forest","desert", "river", "lake", "sky", "sunshine", "moonlight", "starlight", "clouds", "rainbow", "storm", "wind", "earth", "fire", "water", "air","music", "art", "dance", "theater", "literature","film", "photography", "poetry", "storytelling", "history","culture", "tradition", "heritage", "identity", "language","science", "technology", "engineering", "mathematics", "physics","chemistry", "biology", "astronomy", "geography", "psychology","philosophy", "economics", "politics", "law", "justice","computer", "internet", "software", "hardware", "programming","data", "information", "networking", "security", "privacy","innovation", "design", "development", "testing", "deployment","run", "jump", "swim", "dance", "sing","write", "read", "listen", "speak", "create","build", "develop","analyze","explore","discover","beautiful", "happy","sad","exciting","boring","interesting","challenging","easy","difficult","simple","red","blue","green","yellow","purple","circle","square","triangle","rectangle","oval","dog","cat","bird","fish","horse","lion","tiger","elephant","giraffe","zebra","city","town","village","country","continent","Ocean","mountain range","desert region","forest area","umbrella","backpack","notebook","pencil","eraser","table","chair","window","door","floor","roof","wall","garden","park","street","phone","television","radio","camera","watch","shoe","clothes","hat","gloves","scarf","spaghetti","sushi rolls","hamburger buns","salmon fillet","vegetable stir fry","adventure park","amusement ride"
];


let startTime, endTime;

// Function to generate a random sentence based on difficulty
function generateRandomSentence(difficulty) {
    let wordCount;

    // Set word count range based on difficulty level
    switch (difficulty) {
        case 'easy':
            wordCount = Math.floor(Math.random() * 11) + 20; // Randomly between 20 and 30
            break;
        case 'medium':
            wordCount = Math.floor(Math.random() * 11) + 40; // Randomly between 40 and 50
            break;
        case 'hard':
            wordCount = Math.floor(Math.random() * 11) + 60; // Randomly between 60 and 70
            break;
        default:
            wordCount = 20; // Default to easy if something goes wrong
    }

    // Generate a random sentence with the specified number of words
    let sentenceArray = [];
    for (let i = 0; i < wordCount; i++) {
        const randomIndex = Math.floor(Math.random() * words.length);
        sentenceArray.push(words[randomIndex]);
    }

    return sentenceArray.join(' ') + '.'; // Join words into a sentence and add a period
}

// Start typing test function
function startTypingTest() {
    const sentenceDisplay = document.getElementById('sentence-display');
    const inputBox = document.getElementById('input-box');
    const difficultyLevel = document.getElementById('difficulty').value;

    // Reset input box and results
    inputBox.value = '';
    document.getElementById('wpm-display').textContent = '';
    document.getElementById('accuracy-display').textContent = '';

    // Get a random sentence based on difficulty
    const randomSentence = generateRandomSentence(difficultyLevel);
    sentenceDisplay.textContent = randomSentence;

    // Start timer
    startTime = new Date().getTime();

    // Enable input box
    inputBox.disabled = false;

    // Clear previous input event listeners before adding a new one
    inputBox.removeEventListener('input', checkInput);
    
    // Add event listener for input
    inputBox.addEventListener('input', () => checkInput(randomSentence));
}

// Check user input against the current sentence
function checkInput(currentSentence) {
    const inputText = document.getElementById('input-box').value;

    if (inputText === currentSentence) {
        endTime = new Date().getTime();
        calculateResults(inputText, currentSentence);
        document.getElementById('input-box').disabled = true; // Disable input after completion
    }
}

// Calculate results after completion
function calculateResults(inputText, currentSentence) {
    const timeTaken = (endTime - startTime) / 1000 / 60; // time in minutes
    const wordsTyped = inputText.split(' ').length;

    const speed = Math.round(wordsTyped / timeTaken);

    document.getElementById('wpm-display').textContent = `WPM: ${speed}`;

    // Calculate accuracy
    const accuracy = (inputText.length / currentSentence.length) * 100;

    document.getElementById('accuracy-display').textContent = `Accuracy: ${Math.round(accuracy)}%`;
}

// Event listener for starting the typing test
document.getElementById('start-button').addEventListener('click', startTypingTest);
