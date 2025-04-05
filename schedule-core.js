// Core functionality file with the main rendering and popup logic
// Contains loadSpeakerData(), createLocationIcon(), createSocialIcons(), etc. 

// Function to load speaker data
async function loadSpeakerData() {
    try {
        const response = await fetch('https://raw.githubusercontent.com/vitalismf/vitalistbay-speaker-data/main/Vitalist%20Bay%20Speakers.json', {
            headers: {
                'Accept': 'application/json'
            },
            cache: 'no-cache'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error loading speaker data:', error);
        return {};
    }
}

// Function to create location icon SVG
function createLocationIcon() {
    return `<svg class="location-icon" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>`;
}

// Function to create social media icons
function createSocialIcons(speaker) {
    const icons = [];
    
    if (speaker.linkedin) {
        icons.push(`
            <a href="${speaker.linkedin}" target="_blank" class="social-icon">
                <img src="https://cdn.prod.website-files.com/66b50de91220a363ca008735/675ccb08df7e1c2751c159d2_Linkedin.svg" alt="LinkedIn Icon" style="width: 20px; height: 20px;">
            </a>
        `);
    }

    if (speaker.twitter) {
        icons.push(`
            <a href="${speaker.twitter}" target="_blank" class="social-icon x-icon">
                <img src="https://cdn.prod.website-files.com/66b50de91220a363ca008735/675ccb0857ed8998b67cf5ff_X.svg" alt="Twitter X Icon" style="width: 20px; height: 20px;">
            </a>
        `);
    }

    return icons.join('');
}

// Function to create speaker popup
function createSpeakerPopup(speaker) {
    return `
        <div class="speaker-popup" id="popup-${speaker.name.toLowerCase().replace(/\s+/g, '-')}">
            <button class="popup-close">&times;</button>
            <div class="popup-header">
                <div class="popup-photo">
                    <img src="${speaker.photo || speaker.Image}" alt="${speaker.name}" loading="lazy">
                </div>
                <div class="popup-info">
                    <h2>${speaker.name}</h2>
                    <div class="speaker-title">${speaker.title || speaker.Position}</div>
                    <div class="social-links">
                        ${createSocialIcons({
                            linkedin: speaker.linkedin || speaker.LinkedIn,
                            twitter: speaker.twitter || speaker['X (Twitter)']
                        })}
                    </div>
                </div>
            </div>
            <div class="popup-bio">
                ${speaker.bio || speaker.Biography}
            </div>
        </div>
    `;
}

// Function to enhance speaker information
function enhanceSpeakerInfo(event, speakerData) {
    if (!event.speaker && !event.speakers) return event;
    
    if (event.speaker) {
        const speakerInfo = Object.values(speakerData).find(s => s.Name === event.speaker);
        if (speakerInfo) {
            event.speakerInfo = {
                name: speakerInfo.Name,
                title: speakerInfo.Position,
                photo: speakerInfo.Image,
                linkedin: speakerInfo.LinkedIn,
                twitter: speakerInfo['X (Twitter)'],
                bio: speakerInfo.Biography
            };
        }
    }
    
    if (event.speakers) {
        event.speakersInfo = event.speakers.map(speakerName => {
            const speakerInfo = Object.values(speakerData).find(s => s.Name === speakerName);
            if (speakerInfo) {
                return {
                    name: speakerInfo.Name,
                    title: speakerInfo.Position,
                    photo: speakerInfo.Image,
                    linkedin: speakerInfo.LinkedIn,
                    twitter: speakerInfo['X (Twitter)'],
                    bio: speakerInfo.Biography
                };
            }
            return null;
        }).filter(Boolean);
    }
    
    return event;
}

// Function to create event card
function createEventCard(event) {
    let speakerHtml = '';
    
    if (event.speakerInfo) {
        speakerHtml = `
            <div class="speaker" data-speaker="${event.speakerInfo.name}">
                <div class="speaker-photo">
                    <img src="${event.speakerInfo.photo}" alt="${event.speakerInfo.name}" loading="lazy">
                </div>
                <div class="speaker-info">
                    <div class="speaker-name">${event.speakerInfo.name}</div>
                    <div class="speaker-title">${event.speakerInfo.title}</div>
                    <div class="social-links">
                        ${createSocialIcons(event.speakerInfo)}
                    </div>
                </div>
                ${createSpeakerPopup(event.speakerInfo)}
            </div>
        `;
    }
    
    if (event.speakersInfo) {
        speakerHtml = event.speakersInfo.map(speaker => `
            <div class="speaker" data-speaker="${speaker.name}">
                <div class="speaker-photo">
                    <img src="${speaker.photo}" alt="${speaker.name}" loading="lazy">
                </div>
                <div class="speaker-info">
                    <div class="speaker-name">${speaker.name}</div>
                    <div class="speaker-title">${speaker.title}</div>
                    <div class="social-links">
                        ${createSocialIcons(speaker)}
                    </div>
                </div>
                ${createSpeakerPopup(speaker)}
            </div>
        `).join('');
    }

    return `
        <div class="event-card">
            <div class="event-header">
                <div class="event-title-location">
                    <span class="event-type ${event.type.toLowerCase()}-label">${event.type}</span>
                    <div class="event-title">${event.title}</div>
                </div>
                <div class="event-location">
                    ${createLocationIcon()}
                    ${event.location}
                </div>
            </div>
            <div class="event-content">
                ${speakerHtml}
            </div>
        </div>
    `;
}

// Function to get unique locations
function getUniqueLocations(schedule) {
    const locations = new Set();
    schedule.forEach(timeGroup => {
        timeGroup.events.forEach(event => {
            locations.add(event.location);
        });
    });
    return Array.from(locations);
}

// Function to render card schedule
function renderCardSchedule(schedule, speakerData, container) {
    const cardsContainer = document.createElement('div');
    cardsContainer.className = 'schedule-cards-container';

    schedule.forEach((timeGroup) => {
        const timeGroupHtml = `
            <div class="time-group">
                <div class="time-marker">${timeGroup.time}</div>
                ${timeGroup.events
                    .map(event => createEventCard(enhanceSpeakerInfo(event, speakerData)))
                    .join('')}
            </div>
        `;
        cardsContainer.insertAdjacentHTML('beforeend', timeGroupHtml);
    });

    container.appendChild(cardsContainer);
}

// Function to render table schedule
function renderTableSchedule(schedule, speakerData, container) {
    const locations = getUniqueLocations(schedule);
    const tableContainer = document.createElement('div');
    tableContainer.className = 'schedule-table-container';
    
    let tableHTML = '<table class="schedule-table"><thead><tr><th></th>';
    locations.forEach(location => {
        tableHTML += `<th>${location}</th>`;
    });
    tableHTML += '</tr></thead><tbody>';
    
    schedule.forEach(timeGroup => {
        tableHTML += `<tr><td class="time-cell">${timeGroup.time}</td>`;
        
        locations.forEach(location => {
            tableHTML += '<td>';
            const eventsForLocation = timeGroup.events.filter(event => event.location === location);
            
            if (eventsForLocation.length > 0) {
                eventsForLocation.forEach(event => {
                    const enhancedEvent = enhanceSpeakerInfo(event, speakerData);
                    tableHTML += createEventCard(enhancedEvent);
                });
            }
            
            tableHTML += '</td>';
        });
        
        tableHTML += '</tr>';
    });
    
    tableHTML += '</tbody></table>';
    tableContainer.innerHTML = tableHTML;
    container.appendChild(tableContainer);
}

// Function to initialize popup handlers
function initializePopupHandlers() {
    const overlay = document.querySelector('.popup-overlay');
    const popupContainer = document.createElement('div');
    popupContainer.className = 'popup-container';
    document.querySelector('.vitalist-schedule').appendChild(popupContainer);

    const processedSpeakers = new Set();
    
    document.querySelectorAll('.speaker').forEach(speakerEl => {
        const speakerName = speakerEl.dataset.speaker;
        if (!processedSpeakers.has(speakerName)) {
            processedSpeakers.add(speakerName);
            const existingPopup = speakerEl.querySelector('.speaker-popup');
            if (existingPopup) {
                const popup = existingPopup.cloneNode(true);
                popupContainer.appendChild(popup);
            }
        }
        
        const inlinePopup = speakerEl.querySelector('.speaker-popup');
        if (inlinePopup) {
            inlinePopup.remove();
        }
    });

    document.addEventListener('click', function(e) {
        const speaker = e.target.closest('.speaker');
        if (speaker) {
            const speakerName = speaker.dataset.speaker;
            const popup = document.getElementById(`popup-${speakerName.toLowerCase().replace(/\s+/g, '-')}`);
            if (popup) {
                popup.style.display = 'block';
                overlay.style.display = 'block';
            }
        }
    });

    overlay.addEventListener('click', function() {
        document.querySelectorAll('.speaker-popup').forEach(popup => {
            popup.style.display = 'none';
        });
        this.style.display = 'none';
    });

    document.addEventListener('click', function(e) {
        if (e.target.matches('.popup-close')) {
            e.stopPropagation();
            const popup = e.target.closest('.speaker-popup');
            if (popup) {
                popup.style.display = 'none';
                overlay.style.display = 'none';
            }
        }
    });
}

// Main initialization function
async function initSchedule() {
    const speakerData = await loadSpeakerData();
    
    Object.entries(conferenceSchedule).forEach(([day, dayData]) => {
        const dayNumber = day.replace('day', '');
        const container = document.getElementById(`schedule-container-${dayNumber}`);
        if (container) {
            renderCardSchedule(dayData.schedule, speakerData, container);
            renderTableSchedule(dayData.schedule, speakerData, container);
        }
    });
    
    initializePopupHandlers();
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Add tab switching functionality
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', () => {
            document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
            
            button.classList.add('active');
            document.getElementById(button.dataset.tab).classList.add('active');
            initializePopupHandlers();
        });
    });

    initSchedule();
}); 
