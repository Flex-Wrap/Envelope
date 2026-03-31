// Snow effect
const canvas = document.getElementById('snowCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Audio setup
const backgroundAudio = new Audio('sound/New Recording 153.mp3');
backgroundAudio.loop = true;
backgroundAudio.volume = 0.3; // 30% volume
let audioStarted = false; // Flag to track if audio has been started
let isMuted = false; // Track mute state

function startAudioOnFirstInteraction() {
    if (!audioStarted) {
        backgroundAudio.play().catch(err => console.log('Audio play failed:', err));
        audioStarted = true;
    }
}

// Mute button functionality
const muteBtn = document.getElementById('muteBtn');
muteBtn.addEventListener('click', () => {
    isMuted = !isMuted;
    if (isMuted) {
        backgroundAudio.muted = true;
        muteBtn.classList.add('muted');
        muteBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
    } else {
        backgroundAudio.muted = false;
        muteBtn.classList.remove('muted');
        muteBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
    }
});

const snowflakes = [];
const snowflakeCount = 150;
const pixelSize = 2;

class Snowflake {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height - canvas.height;
        this.speedY = Math.random() * 0.22 + 0.08;
        this.speedX = (Math.random() - 0.5) * 0.3;
        this.opacity = Math.random() * 0.5 + 0.5;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.y > canvas.height) {
            this.y = -pixelSize;
            this.x = Math.random() * canvas.width;
        }

        if (this.x > canvas.width) {
            this.x = 0;
        } else if (this.x < 0) {
            this.x = canvas.width;
        }
    }

    draw() {
        ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
        ctx.fillRect(this.x, this.y, pixelSize, pixelSize);
    }
}

// Initialize snowflakes
for (let i = 0; i < snowflakeCount; i++) {
    snowflakes.push(new Snowflake());
}

// Yellow pixel class
class YellowPixel {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height - canvas.height;
        this.speedY = Math.random() * 0.2 + 0.08;
        this.speedX = (Math.random() - 0.5) * 0.2;
        this.opacity = Math.random() * 0.6 + 0.6;
        this.size = Math.random() * 2 + 3;
        this.glowPhase = Math.random() * Math.PI * 2;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.glowPhase += 0.02;

        if (this.y > canvas.height) {
            this.y = -this.size;
            this.x = Math.random() * canvas.width;
        }

        if (this.x > canvas.width) {
            this.x = 0;
        } else if (this.x < 0) {
            this.x = canvas.width;
        }
    }

    draw() {
        const glow = Math.sin(this.glowPhase) * 0.3 + 0.7;
        const glowSize = this.size + 4;
        
        // Glow effect
        ctx.fillStyle = `rgba(255, 255, 0, ${this.opacity * glow * 0.4})`;
        ctx.shadowBlur = 15;
        ctx.shadowColor = 'rgba(255, 255, 0, 0.8)';
        ctx.fillRect(this.x - glowSize / 2, this.y - glowSize / 2, glowSize, glowSize);
        
        // Bright core
        ctx.fillStyle = `rgba(255, 255, 0, ${this.opacity * glow})`;
        ctx.shadowBlur = 0;
        ctx.fillRect(this.x, this.y, this.size, this.size);
    }
}

// Add yellow pixels after 2 seconds
const yellowPixels = [];
let imageIndex = 0; // Track which image to use next
const MAX_YELLOW_DOTS = 9; // 1:25 ratio with 150 white dots
let shouldAllDotsGrow = false; // Global flag to track if growth has been triggered

// Function to spawn dots - caps at 6 total
function spawnMoreDots() {
    const randomImage = imageUrls[imageIndex % imageUrls.length];
    const newPic = new FallingPicture(randomImage, true); // true = startSmall
    
    // If growth has already been triggered, make the new dot grow immediately
    if (shouldAllDotsGrow) {
        newPic.startGrowing();
    }
    
    fallingPictures.push(newPic);
    imageIndex++; // Move to next image
}

// List of image URLs from images folder
const imageUrls = [
    'images/IMG_4740.JPG',
    'images/IMG_5591.jpeg',
    'images/IMG_5683.jpeg',
    'images/IMG_5874.jpeg',
    'images/IMG_6048.jpeg',
    'images/IMG_6260.jpeg',
    'images/IMG_6324.jpeg',
    'images/IMG_6492.jpeg',
    'images/IMG_6831.jpeg'
];

// Falling pictures array - will hold both initial "yellow dots" and grown pictures
let fallingPictures = [];

// Picture class for falling images
class FallingPicture {
    constructor(imageUrl, startSmall = false) {
        this.x = Math.random() * (canvas.width - 50) + 25;
        this.y = Math.random() * canvas.height - canvas.height;
        this.speedY = Math.random() * 0.15 + 0.05;
        this.speedX = (Math.random() - 0.5) * 0.15;
        this.minSize = startSmall ? (Math.random() * 2 + 3) : 8; // 3-5px when small, 8px cap at top
        this.maxBaseSize = canvas.width * 0.15; // 15vw max at bottom
        this.currentSize = this.minSize;
        this.image = new Image();
        this.isImageLoaded = false; // Flag for handshake - raised when image loads
        this.image.onload = () => {
            this.isImageLoaded = true;
            console.log('Image loaded:', imageUrl);
        };
        this.image.onerror = () => {
            console.error('Failed to load image:', imageUrl);
            this.isImageLoaded = true; // Mark as "processed" even on error so spawning continues
        };
        this.image.src = imageUrl;
        this.yellowOverlay = startSmall ? 1.0 : 0;
        this.maxFallDistance = canvas.height + this.maxBaseSize;
        this.shouldGrow = false; // Flag to start growing
        this.growthStartTime = 0;
        this.growthDuration = 8000; // 8 seconds to grow slowly
        this.startSmall = startSmall; // Track if this was a small pixel
        this.hasReachedThreshold = false; // Track if dot has reached 25% threshold
        this.opacity = startSmall ? (Math.random() * 0.6 + 0.6) : 1; // For glow effect
        this.glowPhase = Math.random() * Math.PI * 2; // For pulsing glow
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.glowPhase += 0.02;

        // Handle growth based on time when triggered - only grow past 25dvh
        if (this.shouldGrow && this.startSmall && this.y > canvas.height * 0.25) {
            // Start timer when dot first reaches threshold
            if (!this.hasReachedThreshold) {
                this.growthStartTime = Date.now();
                this.hasReachedThreshold = true;
            }
            
            const elapsed = Date.now() - this.growthStartTime;
            const growthProgress = Math.min(elapsed / this.growthDuration, 1);
            
            // Calculate max size based on Y position (8px at top, 20vw at bottom)
            const screenProgress = Math.min(this.y / canvas.height, 1);
            const capSize = 8;
            const maxSizeForThisPosition = capSize + (this.maxBaseSize - capSize) * screenProgress;
            
            // Grow over time up to the max for this position
            this.currentSize = this.minSize + (maxSizeForThisPosition - this.minSize) * growthProgress;
            
            // Fade yellow overlay as they grow
            this.yellowOverlay = Math.max(0, 1 - growthProgress * 1.2);
        } else if (this.startSmall && !this.shouldGrow) {
            // Stay small until growth is triggered
            this.currentSize = this.minSize;
            this.yellowOverlay = 1.0;
        }

        if (this.y > canvas.height + this.maxBaseSize) {
            return false; // Mark for removal
        }

        if (this.x < -this.maxBaseSize) {
            this.x = canvas.width + this.maxBaseSize;
        } else if (this.x > canvas.width + this.maxBaseSize) {
            this.x = -this.maxBaseSize;
        }

        return true;
    }

    draw() {
        const halfSize = this.currentSize / 2;

        // When small, draw only the glow effect (no image)
        if (this.startSmall && this.currentSize < 10) {
            const glow = Math.sin(this.glowPhase) * 0.3 + 0.7;
            const glowSize = this.currentSize + 4;
            
            // Glow effect
            ctx.fillStyle = `rgba(255, 255, 0, ${this.opacity * glow * 0.4})`;
            ctx.shadowBlur = 15;
            ctx.shadowColor = 'rgba(255, 255, 0, 0.8)';
            ctx.fillRect(this.x - glowSize / 2, this.y - glowSize / 2, glowSize, glowSize);
            
            // Bright core
            ctx.fillStyle = `rgba(255, 255, 0, ${this.opacity * glow})`;
            ctx.shadowBlur = 0;
            ctx.fillRect(this.x - this.currentSize / 2, this.y - this.currentSize / 2, this.currentSize, this.currentSize);
            ctx.shadowBlur = 0; // Reset shadow
            return;
        }

        // When grown, draw the image with overlay if needed
        if (!this.image.complete) return;

        // Always draw yellow glow behind image
        ctx.fillStyle = `rgba(255, 255, 0, 0.4)`;
        ctx.shadowBlur = 20;
        ctx.shadowColor = `rgba(255, 255, 0, 0.8)`;
        ctx.fillRect(this.x - halfSize - 3, this.y - halfSize - 3, this.currentSize + 6, this.currentSize + 6);

        // Draw image with object-fit: cover behavior (crop and center)
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
        
        const imgWidth = this.image.width;
        const imgHeight = this.image.height;
        const imgAspect = imgWidth / imgHeight;
        const canvasAspect = 1; // Square
        
        let sourceX = 0;
        let sourceY = 0;
        let sourceWidth = imgWidth;
        let sourceHeight = imgHeight;
        
        // Calculate crop to fill square without distortion
        if (imgAspect > canvasAspect) {
            // Image is wider - crop sides
            sourceWidth = imgHeight;
            sourceX = (imgWidth - sourceWidth) / 2;
        } else {
            // Image is taller - crop top/bottom
            sourceHeight = imgWidth;
            sourceY = (imgHeight - sourceHeight) / 2;
        }
        
        ctx.drawImage(
            this.image,
            sourceX, sourceY, sourceWidth, sourceHeight,
            this.x - halfSize, this.y - halfSize,
            this.currentSize, this.currentSize
        );
        ctx.globalAlpha = 1;
    }

    startGrowing() {
        this.shouldGrow = true;
        this.growthStartTime = Date.now();
    }
}

// Spawn initial 9 dots to pre-load images
for (let i = 0; i < 9; i++) {
    spawnMoreDots();
}

// Then spawn 1 dot every 1.5 seconds if we're below 9 loaded dots
setInterval(() => {
    const loadedDots = fallingPictures.filter(pic => pic.isImageLoaded).length;
    if (loadedDots < 9) {
        spawnMoreDots();
    }
}, 1500); // Check every 1.5 seconds

// Animation loop
function animateSnow() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.shadowBlur = 0;

    snowflakes.forEach(flake => {
        flake.update();
        flake.draw();
    });

    // Update and draw falling pictures (includes "yellow pixel" pictures)
    const visiblePics = fallingPictures.filter(pic => {
        if (pic.update()) {
            pic.draw();
            return true;
        }
        return false;
    });
    fallingPictures = visiblePics;

    ctx.shadowBlur = 0;
    requestAnimationFrame(animateSnow);
}

animateSnow();

// Handle window resize
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

const textDisplay = document.getElementById('textDisplay');
const inputSection = document.getElementById('inputSection');
const nextButtonSection = document.getElementById('nextButtonSection');
const nextBtn = document.getElementById('nextBtn');
const answerInput = document.getElementById('answerInput');
const submitBtn = document.getElementById('submitBtn');
const hintMessage = document.getElementById('hintMessage');

const textSequence = [
    "Hey, glad you clicked the link in the pdf! I didn't include this the email because I didn't want you to see it until after you read the letter.",
    "I know its silly but I added a step to make sure it is you, its a small riddle",
    "What is a million dollar idea that people are sleeping on?"
];

let currentIndex = 0;
let isTyping = false;

// Typewriter effect
function typeWriter(text, callback) {
    isTyping = true;
    textDisplay.textContent = '';
    let charIndex = 0;
    
    function type() {
        if (charIndex < text.length) {
            textDisplay.textContent += text.charAt(charIndex);
            charIndex++;
            setTimeout(type, 50); // Adjust speed here (lower = faster)
        } else {
            isTyping = false;
            if (callback) callback();
        }
    }
    
    type();
}

// Show next button
function showNextButton() {
    nextButtonSection.style.display = 'block';
}

// Hide next button
function hideNextButton() {
    nextButtonSection.style.display = 'none';
}

// Fade out and transition
function fadeAndNext() {
    startAudioOnFirstInteraction(); // Start audio on first button click
    textDisplay.classList.add('fade-out');
    
    // Handle background transitions with smooth fade
    if (currentIndex === 0) {
        // First click - fade to dawn
        const overlay = document.getElementById('backgroundOverlay');
        overlay.style.background = 'linear-gradient(180deg, #0d1b4d 0%, #1a2a5e 20%, #000000 60%, #000000 100%)';
        overlay.style.opacity = '1';
        
        setTimeout(() => {
            document.body.classList.add('dawn');
            overlay.style.opacity = '0';
        }, 3000);
    }
    
    if (currentIndex === 1) {
        // Second click - fade to sunrise
        const overlay = document.getElementById('backgroundOverlay');
        overlay.style.background = 'linear-gradient(180deg, #ffd700 0%, #f7931e 8%, #ff6b35 15%, #0c4a6e 25%, #000000 50%, #000000 100%)';
        overlay.style.opacity = '1';
        
        setTimeout(() => {
            document.body.classList.remove('dawn');
            document.body.classList.add('sunrise');
            overlay.style.opacity = '0';
        }, 3000);
    }
    
    setTimeout(() => {
        currentIndex++;
        
        if (currentIndex < textSequence.length) {
            textDisplay.classList.remove('fade-out');
            hideNextButton();
            
            if (currentIndex === textSequence.length - 1) {
                // Last text - show input after typing
                typeWriter(textSequence[currentIndex], () => {
                    setTimeout(() => {
                        inputSection.style.display = 'block';
                        answerInput.focus();
                    }, 500);
                });
            } else {
                // Show next button after typing
                typeWriter(textSequence[currentIndex], showNextButton);
            }
        }
    }, 800);
}

// Initialize - start with first text
typeWriter(textSequence[0], showNextButton);

// Handle next button click
nextBtn.addEventListener('click', fadeAndNext);

// Handle submit button click
submitBtn.addEventListener('click', () => {
    startAudioOnFirstInteraction(); // Start audio on first button click
    const answer = answerInput.value.trim().toLowerCase();
    if (answer === 'salt cubes') {
        console.log('Correct answer!');
        
        // Hide input section and fade out
        inputSection.style.opacity = '1';
        inputSection.style.transition = 'opacity 1s ease-out';
        inputSection.style.opacity = '0';
        
        setTimeout(() => {
            inputSection.style.display = 'none';
            
            // Type first message
            typeWriter('Thank you for great times Lea', () => {
                // Wait then fade
                setTimeout(() => {
                    textDisplay.classList.add('fade-out');
                    
                    setTimeout(() => {
                        textDisplay.classList.remove('fade-out');
                        textDisplay.innerHTML = '';
                        
                        // Change background to final state
                        const overlay = document.getElementById('backgroundOverlay');
                        overlay.style.background = 'linear-gradient(180deg, #ffed4e 0%, #ffc93d 10%, #ff9500 20%, #ff7f50 30%, #1a4d7a 45%, #0d2d4a 70%, #050a15 100%)';
                        overlay.style.opacity = '1';
                        
                        setTimeout(() => {
                            document.body.classList.add('final');
                            overlay.style.opacity = '0';
                        }, 3000);
                        
                        // Type second message
                        typeWriter('I hope you choose to keep the best memories moving forward', () => {
                            // Wait longer for second message
                            setTimeout(() => {
                                textDisplay.classList.add('fade-out');
                                
                                // Trigger growth of the "yellow pixel" pictures - the plot twist!
                                setTimeout(() => {
                                    shouldAllDotsGrow = true; // Set global flag for new dots
                                    fallingPictures.forEach(pic => {
                                        pic.startGrowing();
                                    });
                                }, 1000);
                            }, 4000);
                        });
                    }, 1000);
                }, 2000);
            });
        }, 1000);
    } else if (answer) {
        hintMessage.textContent = 'Not quite right, here is a hint: Its good for pasta';
        hintMessage.style.color = '#ffd700';
    } else {
        hintMessage.textContent = 'Please enter your answer!';
        hintMessage.style.color = '#ff6b6b';
    }
});

// Allow Enter key to submit
answerInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        submitBtn.click();
    }
});
