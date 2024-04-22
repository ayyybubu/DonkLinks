const channel = "ayyybubu"; // Replace with your Twitch channel name
let processedLinks = {}; // Object to store processed links
let twitterLinks = {}; // Object to store Twitter links and their corresponding cards
let isConnected = false; // Flag to indicate if connected to Twitch chat
let cardCount = 0; // Counter for the number of cards
let isQueueOpen = false; // Flag to indicate if the queue is open (default closed)

function fetchChat() {
    const cardsContainer = document.getElementById("cards-container");

    const webSocket = new WebSocket(`wss://irc-ws.chat.twitch.tv:443`);
    webSocket.onopen = function (event) {
        isConnected = true; // Set connection status to true when connected
        updateStatusIndicator(); // Update status indicator
        // Join the Twitch channel
        webSocket.send(`NICK justinfan123`); // Just a temporary anonymous username
        webSocket.send(`JOIN #${channel}`);
    };

    webSocket.onmessage = function (event) {
        if (!isQueueOpen) return; // Exit if the queue is closed
        const message = event.data;
        console.log(message); // Log the received message

        // Save the message first
        const savedMessage = extractMessageText(message);

// Parse message for links
const linkRegex = /(?:https?:\/\/)?(?:www\.)?(?:[\w-]+\.)+[a-z]{2,}(?:\/(?:@[\w-]+\/video\/)?[\w-./?=&%#]*)?/gi;


const links = message.match(linkRegex);


        if (links && links.length > 0) {
            // Extract username from the message
            const username = message.split("!")[0].substring(1);

            // Add links to the cards container if not already processed
            links.forEach(link => {
                if (!processedLinks[link]) {
                    // Check if the link is from YouTube, TikTok, Twitch, Twitter, or an image
                    let embedCode = '';
                    let type = '';

                    if (link.includes("youtube.com") || link.includes("youtu.be")) {
                        const videoId = getYouTubeVideoId(link);
                        if (videoId) {
                            embedCode = `<iframe width="100%" height="100%" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
                            type = 'default';
                        }
                    } else if (link.includes("tiktok.com")) {
                        const videoId = getTikTokVideoId(link);
                        if (videoId) {
                            embedCode = `<iframe width="100%" src="https://www.tiktok.com/embed/v2/${videoId}" autoplay="0" frameborder="0" scrolling="no" allow="encrypted-media" allowfullscreen ></iframe>`;
                            type = 'tiktok';
                        } else {
                            embedCode = `<a href="${link}" target="_blank">${link}</a>`; // Create a link card for unsupported TikTok links
                            type = 'link';
                        }    
                    } else if (link.includes("clips.twitch.tv")) {
                        const clipId = getTwitchClipId(link);
                        if (clipId) {
                            embedCode = `<iframe src="https://clips.twitch.tv/embed?clip=${clipId}&parent=ayyybubu.github.io&autoplay=false" width="100%" frameborder="0" scrolling="no" allowfullscreen="true"></iframe>`;
                            type = 'default';
                        }
                    } else if (link.includes("twitch.tv")) {
                        const videoId = getTwitchVideoId(link);
                        if (videoId) {
                            embedCode = `<iframe src="https://player.twitch.tv/?video=${videoId}&parent=ayyybubu.github.io&autoplay=false" width="100%" frameborder="0" scrolling="no" allowfullscreen="true"></iframe>`;
                            type = 'default';
                        }
                    } else if (link.includes("twitter.com")) {
                        const videoId = getTwitterVideoId(link);
                        if (videoId) {
                            embedCode = `<div class="twitter-container" style="display: flex; justify-content: center;"></div>`;
                            type = 'twitter';
                        }
                    } else if (isImageLink(link)) {
                        embedCode = `<img src="${link}" alt="Image" style="width: 100%; max-width: 100%; height: auto;">`;
                        type = 'image';
                    } else {
                        embedCode = `<a href="${link}" target="_blank">${link}</a>`; // Create a link card for unsupported links
                        type = 'link';
                    }

                    if (embedCode) {
                        // Add the saved message text to the card
                        const cardContent = `<div>${embedCode}</div>`;
// Inside fetchChat function
addCard(username, link, embedCode, type, savedMessage);

                        processedLinks[link] = true; // Mark link as processed
                        cardCount++; // Increment card count
                        updateCardCount(); // Update card count display
                    }
                }
            });
        }
    };
}

function extractMessageText(message) {
    const firstColonIndex = message.indexOf(":");
    if (firstColonIndex !== -1) {
        const usernameEndIndex = message.indexOf("!");
        const colonAfterUsername = message.indexOf(":", usernameEndIndex);
        if (colonAfterUsername !== -1) {
            let messageText = message.substring(colonAfterUsername + 1).trim();
            // Replace link with "LINK"
            messageText = messageText.replace(/(?:(?:https?:\/\/|www\.)\S+|\b\S+\.\S+)/gi, "");

            return messageText;
        }
    }
    return "";
}


// Function to update the card count display
function updateCardCount() {
    const cardCountButton = document.getElementById("card-count-button");
    cardCountButton.textContent = `Links: ${cardCount}`;

    // Display "No links submitted" text if link count is 0
    if (cardCount === 0) {
        const cardsContainer = document.getElementById("cards-container");
        cardsContainer.innerHTML = '<div id="no-links-text">No links submitted</div>';
    } else {
        // Remove "No links submitted" text if link count is not 0
        const noLinksText = document.getElementById("no-links-text");
        if (noLinksText) {
            noLinksText.remove();
        }
    }
}
// Function to extract YouTube video ID from URL
function getYouTubeVideoId(url) {
    const regExp = /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(regExp);
    return match && match[1];
}

// Function to extract TikTok video ID from URL
function getTikTokVideoId(url) {
    const regExp = /\/video\/(\d+)/;
    const match = url.match(regExp);
    return match && match[1];
}

function getTwitchClipId(url) {
    const regExp = /clips.twitch.tv\/([a-zA-Z0-9_-]+)/;
    const match = url.match(regExp);
    return match ? match[1] : null;
}


// Function to extract Twitch video ID from URL
function getTwitchVideoId(url) {
    const regExp = /videos\/(\d+)/;
    const match = url.match(regExp);
    return match && match[1];
}
// Function to extract Twitter video ID from URL
function getTwitterVideoId(url) {
    // Prepend "https://" to the link if it doesn't already start with it
    if (!url.startsWith('https://') && !url.startsWith('http://')) {
        url = 'https://' + url;
    }

    // Regular expression to match Twitter status URL patterns
    const regExp = /twitter\.com\/[^/]+\/status\/(\d+)/;
    const regExpWithX = /x\.com\/[^/]+\/status\/(\d+)/;
    const match = url.match(regExp) || url.match(regExpWithX);
    return match && match[1];
}


function createCard(username, link, embedCode, type, savedMessage) {
    const card = document.createElement('div');
    card.classList.add('card');
    if (type === 'tiktok') {
        card.classList.add('tiktok-card');
    }
    card.dataset.link = link;

    // Create headerInfo container
    const headerInfo = document.createElement('div');
    headerInfo.classList.add('header-info');

    // Create cardHeader
    const cardHeader = document.createElement('div');
    cardHeader.classList.add('card-header');
    cardHeader.innerHTML = `
        <div style="display: flex; align-items: center;">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#FF69B4" viewBox="0 0 256 256">
                <path d="M234.38,210a123.36,123.36,0,0,0-60.78-53.23,76,76,0,1,0-91.2,0A123.36,123.36,0,0,0,21.62,210a12,12,0,1,0,20.77,12c18.12-31.32,50.12-50,85.61-50s67.49,18.69,85.61,50a12,12,0,0,0,20.77-12ZM76,96a52,52,0,1,1,52,52A52.06,52.06,0,0,1,76,96Z"></path>
            </svg>
            <span style="font-weight: bold; font-size: 16px;">${username}</span>
        </div>
        <div class="button-group">
            ${type !== 'link' ? '<button class="toggle-button">Show/Hide</button>' : ''}
            <button class="toggle-button delete-button">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#ffffff" viewBox="0 0 256 256">
                    <path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z"></path>
                </svg>
            </button>
        </div>
    `;
    headerInfo.appendChild(cardHeader);

    // Create shortened link element
    const cleanedLink = link.replace(/(^\w+:|^)\/\//, '').replace('www.', ''); // Remove protocols and 'www'
    const shortenedLink = cleanedLink.length > 60 ? cleanedLink.substring(0, 60) + "..." : cleanedLink;
    const linkElement = document.createElement('a');
    linkElement.classList.add('link-element');
    linkElement.href = link;
    linkElement.target = "_blank";
    linkElement.style.display = 'flex';
    linkElement.style.alignItems = 'center';
    linkElement.style.textDecoration = 'none';
    linkElement.style.color = '#ffffff';
    linkElement.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#FF69B4" viewBox="0 0 256 256" style="margin-right: 8px;">
            <path d="M87.5,151.52l64-64a12,12,0,0,1,17,17l-64,64a12,12,0,0,1-17-17Zm131-114a60.08,60.08,0,0,0-84.87,0L103.51,67.61a12,12,0,0,0,17,17l30.07-30.06a36,36,0,0,1,50.93,50.92L171.4,135.52a12,12,0,1,0,17,17l30.08-30.06A60.09,60.09,0,0,0,218.45,37.55ZM135.52,171.4l-30.07,30.08a36,36,0,0,1-50.92-50.93l30.06-30.07a12,12,0,0,0-17-17L37.55,133.58a60,60,0,0,0,84.88,84.87l30.06-30.07a12,12,0,0,0-17-17Z"></path>
        </svg>
        <span>${shortenedLink}</span>
    `;
    linkElement.querySelector('span').style.textDecoration = 'none';
    linkElement.querySelector('span').style.transition = 'color 0.3s';
    linkElement.addEventListener('mouseenter', function() {
        this.style.color = '#FF69B4';
    });
    linkElement.addEventListener('mouseleave', function() {
        this.style.color = '#ffffff';
    });
    headerInfo.appendChild(linkElement);

    // Create the savedMessage div
    const savedMessageDiv = document.createElement('div');
    savedMessageDiv.innerHTML = `
        <div style="display: flex; align-items: stretch;">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#FF69B4" viewBox="0 0 256 256" style="margin-right: 8px;">
                <path d="M120,128a16,16,0,1,1-16-16A16,16,0,0,1,120,128Zm32-16a16,16,0,1,0,16,16A16,16,0,0,0,152,112Zm84,16A108,108,0,0,1,78.77,224.15L46.34,235A20,20,0,0,1,21,209.66l10.81-32.43A108,108,0,1,1,236,128Zm-24,0A84,84,0,1,0,55.27,170.06a12,12,0,0,1,1,9.81l-9.93,29.79,29.79-9.93a12.1,12.1,0,0,1,3.8-.62,12,12,0,0,1,6,1.62A84,84,0,0,0,212,128Z">
                </path>
            </svg>
            <span style="max-width: 600px; word-wrap: break-word;">${savedMessage}</span>
        </div>
    `;
    savedMessageDiv.style.marginTop = '6px'; // Add margin-top style

    // Append savedMessageDiv to the headerInfo container
    headerInfo.appendChild(savedMessageDiv);

    card.appendChild(headerInfo);

    // Create card content based on type
    if (type !== 'link') {
        const cardContent = document.createElement('div');
        cardContent.classList.add('card-content');
        if (type === 'tiktok') {
            cardContent.classList.add('tiktok-content');
        } else if (type === 'twitter') {
            cardContent.classList.add('twitter-style');
        }
        cardContent.innerHTML = embedCode;
        card.appendChild(cardContent);
    }

    // Add event listener to delete button
    card.querySelector('.delete-button').addEventListener('click', function() {
        card.remove();
        cardCount--;
        updateCardCount();
        const link = card.dataset.link;
        delete processedLinks[link];
    });

    return card;
}



// Function to toggle visibility of embed inside card
function toggleEmbed(cardContent) {
    cardContent.classList.toggle('hidden');
}

// Event listener for toggle button clicks
document.addEventListener('click', function(event) {
    if (event.target.classList.contains('toggle-button')) {
        const card = event.target.closest('.card');
        const cardContent = card.querySelector('.card-content');
        if (cardContent) {
            toggleEmbed(cardContent);
        }
    }
});



// Function to check if a link is a Twitter video link
function isTwitterVideoLink(link) {
    return link.includes("twitter.com") && link.includes("/status/");
}

// Function to add Twitter embed code to the website
function addTwitterEmbed(link, card) {
    const twitterEmbedCode = `
        <blockquote class="twitter-tweet" data-theme="dark">
            <a href="${link}"></a>
        </blockquote>
    `;
    const twitterContainer = card.querySelector(".twitter-container");
    twitterContainer.innerHTML = twitterEmbedCode;

    // Since Twitter widgets.js may have already loaded, we check if twttr object is available
    if (window.twttr && typeof window.twttr.widgets === 'object' && typeof window.twttr.widgets.load === 'function') {
        // If the twttr object is available, directly call the widgets.load method
        window.twttr.widgets.load();
    } else {
        // If the twttr object is not available, load the Twitter SDK asynchronously
        loadTwitterSDK(() => {
            // After loading the Twitter SDK, call the widgets.load method
            window.twttr.widgets.load();
        });
    }
}


// Function to load the Twitter SDK asynchronously
function loadTwitterSDK(callback) {
    const script = document.createElement('script');
    script.src = 'https://platform.twitter.com/widgets.js';
    script.charset = 'utf-8';
    script.async = true;
    script.onload = callback; // Call the callback function once the script is loaded
    document.body.appendChild(script);
}
// Function to check if a link is an image link
function isImageLink(link) {
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg']; // Add more image extensions if needed
    const lowerCaseLink = link.toLowerCase();
    return imageExtensions.some(ext => lowerCaseLink.includes(`.${ext}`));
}

// Function to add a card to the cards container
function addCard(username, link, embedCode, card, savedMessage) {
    const cardsContainer = document.getElementById("cards-container");
    let type = '';

    if (link.includes("youtube.com") || link.includes("youtu.be")) {
        type = 'default';
    } else if (link.includes("clips.twitch.tv")) {
        type = 'default';
    } else if (link.includes("twitch.tv")) {
        type = 'default';
    } else if (isTwitterVideoLink(link)) {
        // Prepend "https://" to the link if it's a Twitter link and doesn't start with it
        if (!link.startsWith('https://') && !link.startsWith('http://')) {
            link = 'https://' + link;
        }
        type = 'twitter';
    } else if (link.includes("tiktok.com") && !link.includes("vm.tiktok.com")) {
        type = 'tiktok';
    } else if (isImageLink(link)) {
        type = 'image';
    } else {
        type = 'link'; // Treat other links as regular links
    }

    // Inside addCard function
    const createdCard = createCard(username, link, embedCode, type, savedMessage);

    cardsContainer.appendChild(createdCard);

    // Apply fade-in animation
    createdCard.style.opacity = '0';
    cardsContainer.appendChild(createdCard);
    setTimeout(() => {
        createdCard.style.opacity = '1';
    }, 10); // Delay to allow the browser to apply the opacity change

    // Trigger reflow to force the browser to apply the opacity change before transitioning
    void createdCard.offsetWidth;
    createdCard.style.transition = 'opacity 0.5s';
    createdCard.style.opacity = '1'; // Set opacity to trigger the transition

    // If the link is a Twitter video link, add the Twitter embed to the website
    if (type === 'twitter') {
        addTwitterEmbed(link, createdCard);
    } else if (type === 'image') {
        // If the link is an image, create an image element and append it to the card content
        const cardContent = createdCard.querySelector('.card-content');
        const imageElement = document.createElement('img');
        cardContent.style.paddingTop = '0%';
    }
}




// Function to remove a card from the cards container with fade-out effect
function removeCard(card) {
    // Apply fade-out animation
    card.style.opacity = '0';
    card.addEventListener('transitionend', () => {
        card.remove();
    });
}



// Fetch chat every 5 seconds
setInterval(fetchChat, 5000);

// Call fetchChat initially
fetchChat();

// Reset table button functionality
document.getElementById("reset-button").addEventListener("click", function() {
    const cardsContainer = document.getElementById("cards-container");
    cardsContainer.innerHTML = '';
    processedLinks = {};
    cardCount = 0; // Reset the card count
    updateCardCount(); // Update the card count display
});

// Toggle queue button functionality
document.getElementById("toggle-queue-button").addEventListener("click", function() {
    isQueueOpen = !isQueueOpen; // Toggle queue status
    this.textContent = isQueueOpen ? 'Queue Open' : 'Queue Closed'; // Update button text
    this.classList.toggle('close', !isQueueOpen); // Add 'close' class if queue is closed
});


// Update connection status indicator
function updateStatusIndicator() {
    const loader = document.getElementById('loader');
    if (isConnected) {
        loader.style.display = 'none'; // Hide the loader when connected
    } else {
        loader.style.display = 'block'; // Show the loader when not connected
    }
}

// Scroll to top button functionality
document.getElementById("scroll-to-top-button").addEventListener("click", function() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// Show connection status and initial card count
document.addEventListener('DOMContentLoaded', function() {
    updateStatusIndicator();
    // Set the queue status button and flag to "closed" on page load
    document.getElementById("toggle-queue-button").textContent = 'Queue Closed';
    document.getElementById("toggle-queue-button").classList.add('close');
    isQueueOpen = false;

    // Update card count initially
    updateCardCount();
});
// Add event listener for the hide/show embeds button
document.getElementById("hide-embeds-button").addEventListener("click", function() {
    const cards = document.querySelectorAll('.card');
    const hideEmbeds = this.getAttribute('data-state') === 'hide';

    cards.forEach(card => {
        const cardContent = card.querySelector('.card-content');
        if (cardContent) {
            if (hideEmbeds) {
                cardContent.classList.add('hidden'); // Hide the embed content
            } else {
                cardContent.classList.remove('hidden'); // Show the embed content
            }
        }
    });

    // Toggle button state and update button icon
    if (hideEmbeds) {
        this.setAttribute('data-state', 'show');
        this.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#ffffff" viewBox="0 0 256 256">
            <path d="M247.31,124.76c-.35-.79-8.82-19.58-27.65-38.41C194.57,61.26,162.88,48,128,48S61.43,61.26,36.34,86.35C17.51,105.18,9,124,8.69,124.76a8,8,0,0,0,0,6.5c.35.79,8.82,19.57,27.65,38.4C61.43,194.74,93.12,208,128,208s66.57-13.26,91.66-38.34c18.83-18.83,27.3-37.61,27.65-38.4A8,8,0,0,0,247.31,124.76ZM128,192c-30.78,0-57.67-11.19-79.93-33.25A133.47,133.47,0,0,1,25,128,133.33,133.33,0,0,1,48.07,97.25C70.33,75.19,97.22,64,128,64s57.67,11.19,79.93,33.25A133.46,133.46,0,0,1,231.05,128C223.84,141.46,192.43,192,128,192Zm0-112a48,48,0,1,0,48,48A48.05,48.05,0,0,0,128,80Zm0,80a32,32,0,1,1,32-32A32,32,0,0,1,128,160Z"></path>
        </svg>`;
    } else {
        this.setAttribute('data-state', 'hide');
        this.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#ffffff" viewBox="0 0 256 256">
            <path d="M53.92,34.62A8,8,0,1,0,42.08,45.38L61.32,66.55C25,88.84,9.38,123.2,8.69,124.76a8,8,0,0,0,0,6.5c.35.79,8.82,19.57,27.65,38.4C61.43,194.74,93.12,208,128,208a127.11,127.11,0,0,0,52.07-10.83l22,24.21a8,8,0,1,0,11.84-10.76Zm47.33,75.84,41.67,45.85a32,32,0,0,1-41.67-45.85ZM128,192c-30.78,0-57.67-11.19-79.93-33.25A133.16,133.16,0,0,1,25,128c4.69-8.79,19.66-33.39,47.35-49.38l18,19.75a48,48,0,0,0,63.66,70l14.73,16.2A112,112,0,0,1,128,192Zm6-95.43a8,8,0,0,1,3-15.72,48.16,48.16,0,0,1,38.77,42.64,8,8,0,0,1-7.22,8.71,6.39,6.39,0,0,1-.75,0,8,8,0,0,1-8-7.26A32.09,32.09,0,0,0,134,96.57Zm113.28,34.69c-.42.94-10.55,23.37-33.36,43.8a8,8,0,1,1-10.67-11.92A132.77,132.77,0,0,0,231.05,128a133.15,133.15,0,0,0-23.12-30.77C185.67,75.19,158.78,64,128,64a118.37,118.37,0,0,0-19.36,1.57A8,8,0,1,1,106,49.79,134,134,0,0,1,128,48c34.88,0,66.57,13.26,91.66,38.35,18.83,18.83,27.3,37.62,27.65,38.41A8,8,0,0,1,247.31,131.26Z"></path>
        </svg>`;
    }
});