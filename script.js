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

        // Check if the message contains the specified word
        if (!/\b(?:@)?ayyybubu\b/i.test(savedMessage)) return;

        // Parse message for links
        const linkRegex = /(?:https?:\/\/)?(?:www\.)?(?:[\w-]+\.)+[a-z]{2,}(?:\/(?:@[\w-]+\/video\/)?[\w-./?=&%@%#]*)?/gi;
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
                            type = 'youtube';
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
                        embedCode = `<img src="${link}" alt="Image" style="width: 100%; max-width: 100%; height: auto; border-radius: 0.5rem;">`;
                        type = 'image';
                    } else {
                        embedCode = `<a href="${link}" target="_blank">${link}</a>`; // Create a link card for unsupported links
                        type = 'link';
                    }

                    if (embedCode) {
                        // Add the saved message text to the card
                        const cardContent = `<div>${embedCode}</div>`;
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
// Remove specified word and its variations along with @ and ,
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
    cardCountButton.innerHTML = `<i class="ph ph-link"></i>Links: ${cardCount}`;

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

    // Create shortened link element
    const cleanedLink = link.replace(/(^\w+:|^)\/\//, '').replace('www.', ''); // Remove protocols and 'www'
    const shortenedLink = cleanedLink.length > 60 ? cleanedLink.substring(0, 60) + "..." : cleanedLink;

    const linkElement = document.createElement('a');
    linkElement.classList.add('link-element');
    linkElement.href = link;
    linkElement.target = "_blank";

    // Set styles for the link element
    linkElement.innerHTML = `
        ${shortenedLink}
    `;

    // Create cardHeader
    const cardHeader = document.createElement('div');
    cardHeader.classList.add('card-header');
    cardHeader.innerHTML = `
        <div class="card-userinfo"> 
            <div class="profile-pic-con"><img src="https://static-cdn.jtvnw.net/user-default-pictures-uv/41780b5a-def8-11e9-94d9-784f43822e80-profile_image-300x300.png" class="card-profile-pic" alt="Profile picture"></div>
            <div class="card-userinfo-text" style="display: flex; flex-direction: column;align-items: flex-start; gap: 0px;">   
                <span style="font-weight: 600; font-size: 16px;">${username}</span> 
                ${linkElement.outerHTML} 
            </div>
        </div>
        <div class="button-group">
            ${type !== 'link' ? '<button class="toggle-button-hide card-buttons"><i class="ph ph-arrows-in-simple"></i></button>' : ''}
            <button class="delete-button card-buttons">
                <i class="ph ph-x"></i>
            </button>
        </div>
    `;
    headerInfo.appendChild(cardHeader);

    // Create the savedMessage div
    const savedMessageDiv = document.createElement('div');
    savedMessageDiv.innerHTML = `
        <span style="word-wrap: break-word; text-align: left; font-weight: 300; font-size: 15px; margin-top: 0.5rem; display: flex;">${savedMessage}</span>
    `;

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
        else if (type === 'youtube') {
            cardContent.classList.add('youtube-style');
        }
        else if (type === 'twitch') {
            cardContent.classList.add('twitch-style');
        }
        // For Imgur embeds, wrap the embed code inside a container div
        if (type === 'imgur') {
            const imgurContainer = document.createElement('div');
            imgurContainer.classList.add('imgur-container');
            imgurContainer.innerHTML = embedCode;
            cardContent.appendChild(imgurContainer);
        } else {
            cardContent.innerHTML = embedCode;
        }
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
    const toggleButton = event.target.closest('.toggle-button-hide');
    if (toggleButton) {
        const icon = toggleButton.querySelector('i');
        const card = toggleButton.closest('.card');
        const cardContent = card.querySelector('.card-content');
        
        if (cardContent) {
            toggleEmbed(cardContent);
            // Toggle icon
            if (icon.classList.contains('ph-arrows-in-simple')) {
                icon.classList.remove('ph-arrows-in-simple');
                icon.classList.add('ph-arrows-out-simple');
            } else {
                icon.classList.remove('ph-arrows-out-simple');
                icon.classList.add('ph-arrows-in-simple');
            }
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
        type = 'youtube';
    } else if (link.includes("clips.twitch.tv")) {
        type = 'twitch';
    } else if (link.includes("twitch.tv")) {
        type = 'twitch';
    } else if (isTwitterVideoLink(link)) {
        // Prepend "https://" to the link if it's a Twitter link and doesn't start with it
        if (!link.startsWith('https://') && !link.startsWith('http://')) {
            link = 'https://' + link;
        }
        type = 'twitter';
    } else if (link.includes("tiktok.com") && link.includes("/video/")) {
        type = 'tiktok';
    } else if (isImageLink(link)) {
        type = 'image';
    } else if (link.includes("imgur.com")) {
        // If the link is from Imgur, create the Imgur embed code
        const imgurId = getImgurId(link);
        if (imgurId) {
            embedCode = `
            <blockquote class="imgur-embed-pub" lang="en" data-id="${imgurId}">
                <a href="//imgur.com/${imgurId}&parent=ayyybubu.github.io">View on Imgur</a>
            </blockquote>
            <script async src="//s.imgur.com/min/embed.js" charset="utf-8"></script>
        `;
            type = 'imgur';

            // Load Imgur SDK asynchronously
            loadImgurSDK();
        }
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

// Function to load the Imgur SDK asynchronously
function loadImgurSDK() {
    const script = document.createElement('script');
    script.src = 'https://s.imgur.com/min/embed.js';
    script.charset = 'utf-8';
    script.async = true;
    document.body.appendChild(script);
}

// Function to extract Imgur ID from URL
function getImgurId(url) {
    const regExp = /imgur\.com\/(?:gallery\/)?(?:a\/)?(\w+)/;
    const match = url.match(regExp);
    return match && match[1];
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
    // Prompt the user for confirmation before clearing the queue
    const isConfirmed = confirm("Are you sure you want to clear the queue?");
    
    // Check if the user confirmed
    if (isConfirmed) {
        const cardsContainer = document.getElementById("cards-container");
        cardsContainer.innerHTML = '';
        processedLinks = {};
        cardCount = 0; // Reset the card count
        updateCardCount(); // Update the card count display
    }
});
// Add event listener for the beforeunload event
window.addEventListener('beforeunload', function(event) {
    // Check if there are links on the page
    const cardsContainer = document.getElementById("cards-container");
    const cards = cardsContainer.querySelectorAll('.card');
    if (cards.length > 0) {
        // Display a confirmation dialog
        const confirmationMessage = 'Are you sure you want to leave? There are still links on the page.';
        event.returnValue = confirmationMessage; // For older browsers
        return confirmationMessage; // For modern browsers
    }
});



//Toggle queue button functionality
document.getElementById("toggle-queue-button").addEventListener("click", function() {
    isQueueOpen = !isQueueOpen; // Toggle queue status
    this.innerHTML = isQueueOpen ? '<i class="ph ph-lock-key-open"></i> Queue Open' : '<i class="ph ph-lock-key"></i> Queue Closed'; // Update button content
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
    document.getElementById("toggle-queue-button").innerHTML = '<i class="ph ph-lock-key"></i> Queue Closed';
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
        this.innerHTML = `<i class="ph ph-eye-slash"></i>`;
    } else {
        this.setAttribute('data-state', 'hide');
        this.innerHTML = `<i class="ph ph-eye"></i>`;
    }
});