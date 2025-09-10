// Base URL for the Rick and Morty API
const API_BASE_URL = 'https://rickandmortyapi.com/api';

// DOM elements
const charactersContainer = document.getElementById('characters-container');
const loadingElement = document.getElementById('loading');
const prevPageBtn = document.getElementById('prev-page');
const nextPageBtn = document.getElementById('next-page');
const pageNumbersContainer = document.getElementById('page-numbers');
const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');
const statusFilter = document.getElementById('status-filter');
const genderFilter = document.getElementById('gender-filter');
const modal = document.getElementById('character-modal');
const modalContent = document.getElementById('modal-content');
const closeModal = document.querySelector('.close-modal');

// State variables
let currentPage = 1;
let totalPages = 0;
let currentFilters = {
    name: '',
    status: '',
    gender: ''
};

// Cache system
const cache = {
    characters: {}, // Cache for character listings by query
    characterDetails: {}, // Cache for individual character details
    episodes: {}, // Cache for episode data
    
    // Cache expiration time in milliseconds (1 hour)
    expirationTime: 60 * 60 * 1000,
    
    // Check if cache has valid data for a given key
    has(type, key) {
        const cacheEntry = this[type][key];
        if (!cacheEntry) return false;
        
        const isExpired = Date.now() > cacheEntry.timestamp + this.expirationTime;
        return !isExpired;
    },
    
    // Get cached data for a given key
    get(type, key) {
        if (this.has(type, key)) {
            console.log(`Using cached ${type} data for: ${key}`);
            return this[type][key].data;
        }
        return null;
    },
    
    // Store data in cache with current timestamp
    set(type, key, data) {
        console.log(`Caching ${type} data for: ${key}`);
        this[type][key] = {
            data,
            timestamp: Date.now()
        };
    },
    
    // Clear all cache or specific type
    clear(type = null) {
        if (type) {
            this[type] = {};
            console.log(`Cleared ${type} cache`);
        } else {
            this.characters = {};
            this.characterDetails = {};
            this.episodes = {};
            console.log('Cleared all cache');
        }
    }
};

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    fetchCharacters();
    setupEventListeners();
    initializeCache();
});

// Set up event listeners
function setupEventListeners() {
    // Pagination buttons
    prevPageBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            fetchCharacters();
        }
    });
    
    nextPageBtn.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            fetchCharacters();
        }
    });
    
    // Search functionality
    searchButton.addEventListener('click', () => {
        currentFilters.name = searchInput.value;
        currentPage = 1;
        fetchCharacters();
    });
    
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            currentFilters.name = searchInput.value;
            currentPage = 1;
            fetchCharacters();
        }
    });
    
    // Filters
    statusFilter.addEventListener('change', () => {
        currentFilters.status = statusFilter.value;
        currentPage = 1;
        fetchCharacters();
    });
    
    genderFilter.addEventListener('change', () => {
        currentFilters.gender = genderFilter.value;
        currentPage = 1;
        fetchCharacters();
    });
    
    // Modal close button
    closeModal.addEventListener('click', () => {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });
    
    // Cache controls
    const clearCacheBtn = document.getElementById('clear-cache');
    clearCacheBtn.addEventListener('click', () => {
        cache.clear();
        updateCacheStatus('Cache cleared successfully!');
        
        // Refresh current data
        fetchCharacters();
    });
}

// Fetch characters from the API
async function fetchCharacters() {
    showLoading();
    
    let queryParams = `?page=${currentPage}`;
    
    if (currentFilters.name) {
        queryParams += `&name=${encodeURIComponent(currentFilters.name)}`;
    }
    
    if (currentFilters.status) {
        queryParams += `&status=${encodeURIComponent(currentFilters.status)}`;
    }
    
    if (currentFilters.gender) {
        queryParams += `&gender=${encodeURIComponent(currentFilters.gender)}`;
    }
    
    const cacheKey = `${queryParams}`;
    usingCachedData = false;
    
    try {
        let data = cache.get('characters', cacheKey);
        
        if (!data && !navigator.onLine) {
            displayError('You are offline and this data is not in the cache. Connect to the internet and try again.');
            return;
        }
        
        if (!data) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 10000);
                
                const response = await fetch(`${API_BASE_URL}/character${queryParams}`, { 
                    signal: controller.signal 
                });
                clearTimeout(timeoutId);
                
                data = await response.json();
                
                if (!data.error) {
                    cache.set('characters', cacheKey, data);
                }
            } catch (fetchError) {
                if (fetchError.name === 'AbortError') {
                    displayError('Request timed out. Check your internet connection.');
                    return;
                }
                throw fetchError;
            }
        } else {
            usingCachedData = true;
            if (!navigator.onLine) {
                showToast('Showing cached data while offline', 'info');
            }
        }
        
        if (data.error) {
            displayError(data.error);
            return;
        }
        
        displayCharacters(data.results);
        updatePagination(data.info);
    } catch (error) {
        const cachedData = cache.get('characters', cacheKey);
        
        if (cachedData) {
            usingCachedData = true;
            showToast('Network error. Showing cached data.', 'error');
            displayCharacters(cachedData.results);
            updatePagination(cachedData.info);
        } else {
            displayError('Error fetching characters. Please try again later.');
            console.error('Error fetching characters:', error);
        }
    } finally {
        hideLoading();
    }
}

// Display characters in the container
function displayCharacters(characters) {
    charactersContainer.innerHTML = '';
    
    if (!characters || characters.length === 0) {
        charactersContainer.innerHTML = `
            <div class="no-results">
                <h2>No characters found</h2>
                <p>Try adjusting your search or filters.</p>
            </div>
        `;
        return;
    }
    
    if (usingCachedData) {
        const cacheNotice = document.createElement('div');
        cacheNotice.className = 'cache-notice';
        cacheNotice.innerHTML = `
            <div class="offline-data-indicator">
                <i class="fas fa-database"></i> 
                ${!navigator.onLine ? 'Offline mode: Showing cached data' : 'Showing cached data'}
            </div>
        `;
        charactersContainer.appendChild(cacheNotice);
    }
    
    characters.forEach(character => {
        const card = document.createElement('div');
        card.className = 'character-card';
        card.dataset.id = character.id;
        
        let statusClass = 'unknown';
        if (character.status.toLowerCase() === 'alive') {
            statusClass = 'alive';
        } else if (character.status.toLowerCase() === 'dead') {
            statusClass = 'dead';
        }
        
        card.innerHTML = `
            <img src="${character.image}" alt="${character.name}" class="character-image">
            <div class="character-info">
                <h2 class="character-name">${character.name}</h2>
                <div class="character-status">
                    <div class="status-icon ${statusClass}"></div>
                    ${character.status} - ${character.species}
                </div>
                <p class="character-detail"><span>Origin:</span> ${character.origin.name}</p>
                <p class="character-detail"><span>Last known location:</span> ${character.location.name}</p>
            </div>
        `;
        
        card.addEventListener('click', () => {
            fetchCharacterDetails(character.id);
        });
        
        charactersContainer.appendChild(card);
    });
    
    setTimeout(() => {
        const cards = document.querySelectorAll('.character-card');
        cards.forEach((card, index) => {
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }, 100);
}

// Update pagination controls
function updatePagination(info) {
    totalPages = info.pages;
    
    // Update button states
    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = currentPage === totalPages;
    
    // Generate page numbers
    pageNumbersContainer.innerHTML = '';
    
    // Determine which page numbers to show
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);
    
    // Adjust start page if we're near the end
    if (endPage - startPage < 4 && startPage > 1) {
        startPage = Math.max(1, endPage - 4);
    }
    
    // Add first page button if not included in range
    if (startPage > 1) {
        addPageNumberButton(1);
        if (startPage > 2) {
            addEllipsis();
        }
    }
    
    // Add page number buttons
    for (let i = startPage; i <= endPage; i++) {
        addPageNumberButton(i);
    }
    
    // Add last page button if not included in range
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            addEllipsis();
        }
        addPageNumberButton(totalPages);
    }
}

// Add a page number button to the pagination
function addPageNumberButton(pageNum) {
    const pageButton = document.createElement('div');
    pageButton.className = `page-number ${pageNum === currentPage ? 'active' : ''}`;
    pageButton.textContent = pageNum;
    pageButton.addEventListener('click', () => {
        if (pageNum !== currentPage) {
            currentPage = pageNum;
            fetchCharacters();
        }
    });
    pageNumbersContainer.appendChild(pageButton);
}

// Add ellipsis to pagination
function addEllipsis() {
    const ellipsis = document.createElement('div');
    ellipsis.className = 'page-number ellipsis';
    ellipsis.textContent = '...';
    ellipsis.style.cursor = 'default';
    pageNumbersContainer.appendChild(ellipsis);
}

// Fetch detailed information about a character
async function fetchCharacterDetails(id) {
    showLoading();
    
    try {
        let character = cache.get('characterDetails', id);
        let usingCachedCharacter = false;
        
        if (!character && !navigator.onLine) {
            hideLoading();
            showToast('Cannot load character details while offline', 'error');
            return;
        }
        
        if (!character) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 10000);
                
                const response = await fetch(`${API_BASE_URL}/character/${id}`, {
                    signal: controller.signal
                });
                clearTimeout(timeoutId);
                
                character = await response.json();
                cache.set('characterDetails', id, character);
            } catch (fetchError) {
                if (fetchError.name === 'AbortError') {
                    hideLoading();
                    showToast('Request timed out. Check your internet connection.', 'error');
                    return;
                }
                throw fetchError;
            }
        } else {
            usingCachedCharacter = true;
            if (!navigator.onLine) {
                showToast('Showing cached character data while offline', 'info');
            }
        }
        
        const episodes = await fetchEpisodeDetails(character.episode);
        displayCharacterModal(character, episodes);
        
        if (usingCachedCharacter && !navigator.onLine) {
            const modalContent = document.querySelector('.character-details');
            const offlineIndicator = document.createElement('div');
            offlineIndicator.className = 'offline-data-indicator';
            offlineIndicator.innerHTML = '<i class="fas fa-database"></i> Showing cached data';
            modalContent.prepend(offlineIndicator);
        }
    } catch (error) {
        console.error('Error fetching character details:', error);
        showToast('Failed to load character details. Please try again.', 'error');
    } finally {
        hideLoading();
    }
}

// Fetch episode details with caching
async function fetchEpisodeDetails(episodeUrls) {
    const episodes = [];
    const episodesToFetch = [];
    const episodeIds = [];
    
    episodeUrls.forEach(url => {
        const id = url.split('/').pop();
        episodeIds.push(id);
        
        const cachedEpisode = cache.get('episodes', id);
        if (cachedEpisode) {
            episodes.push(cachedEpisode);
        } else if (navigator.onLine) {
            episodesToFetch.push({ url, id });
        } else {
            // Create a placeholder for offline mode when episode is not cached
            episodes.push({
                id: id,
                name: "Episode information unavailable offline",
                episode: `EP${id}`,
                air_date: "Unknown (offline)",
                characters: [],
                url: url,
                created: new Date().toISOString(),
                _offline_placeholder: true
            });
        }
    });
    
    if (episodesToFetch.length > 0 && navigator.onLine) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            
            const promises = episodesToFetch.map(({ url, id }) => 
                fetch(url, { signal: controller.signal })
                    .then(res => res.json())
                    .then(episode => {
                        cache.set('episodes', id, episode);
                        return episode;
                    })
                    .catch(error => {
                        if (error.name === 'AbortError') {
                            return {
                                id: id,
                                name: "Episode information timed out",
                                episode: `EP${id}`,
                                air_date: "Unknown (timeout)",
                                characters: [],
                                url: url,
                                created: new Date().toISOString(),
                                _timeout: true
                            };
                        }
                        throw error;
                    })
            );
            
            clearTimeout(timeoutId);
            const fetchedEpisodes = await Promise.all(promises);
            episodes.push(...fetchedEpisodes);
        } catch (error) {
            console.error('Error fetching episodes:', error);
            
            // Add placeholders for failed fetches
            episodesToFetch.forEach(({ url, id }) => {
                episodes.push({
                    id: id,
                    name: "Episode information unavailable",
                    episode: `EP${id}`,
                    air_date: "Unknown (error)",
                    characters: [],
                    url: url,
                    created: new Date().toISOString(),
                    _error: true
                });
            });
        }
    }
    
    return episodes.sort((a, b) => {
        const aCode = a.episode.replace(/\D/g, '');
        const bCode = b.episode.replace(/\D/g, '');
        return parseInt(aCode) - parseInt(bCode);
    });
}

// Display character details in modal
function displayCharacterModal(character, episodes) {
    // Determine status class for the status indicator
    let statusClass = 'unknown';
    if (character.status.toLowerCase() === 'alive') {
        statusClass = 'alive';
    } else if (character.status.toLowerCase() === 'dead') {
        statusClass = 'dead';
    }
    
    // Format episodes
    const episodeElements = episodes.map(episode => {
        const specialClass = episode._offline_placeholder ? '_offline_placeholder' : 
                             episode._timeout ? '_timeout' : 
                             episode._error ? '_error' : '';
        return `<div class="episode-tag ${specialClass}">${episode.episode}: ${episode.name}</div>`;
    }).join('');
    
    modalContent.innerHTML = `
        <div class="character-details">
            <img src="${character.image}" alt="${character.name}">
            <h2>${character.name}</h2>
            
            <div class="character-status" style="font-size: 1.2rem; margin-bottom: 1.5rem;">
                <div class="status-icon ${statusClass}" style="width: 15px; height: 15px;"></div>
                ${character.status} - ${character.species}
            </div>
            
            <div class="details-grid">
                <div class="detail-item">
                    <div class="detail-label">Gender</div>
                    <div class="detail-value">${character.gender}</div>
                </div>
                
                <div class="detail-item">
                    <div class="detail-label">Origin</div>
                    <div class="detail-value">${character.origin.name}</div>
                </div>
                
                <div class="detail-item">
                    <div class="detail-label">Last known location</div>
                    <div class="detail-value">${character.location.name}</div>
                </div>
                
                <div class="detail-item">
                    <div class="detail-label">Type</div>
                    <div class="detail-value">${character.type || 'Unknown'}</div>
                </div>
                
                <div class="detail-item">
                    <div class="detail-label">Created in database</div>
                    <div class="detail-value">${new Date(character.created).toLocaleDateString()}</div>
                </div>
                
                <div class="detail-item">
                    <div class="detail-label">Episodes count</div>
                    <div class="detail-value">${character.episode.length}</div>
                </div>
            </div>
            
            <div class="episode-list">
                <h3>Appears in episodes:</h3>
                <div class="episodes">
                    ${episodeElements}
                </div>
            </div>
        </div>
    `;
    
    // Display the modal
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden'; // Prevent scrolling behind modal
}

// Display error message
function displayError(message) {
    charactersContainer.innerHTML = `
        <div class="error-message">
            <i class="fas fa-exclamation-circle" style="font-size: 3rem; color: #ff6b6b; margin-bottom: 1rem;"></i>
            <h2>Oops! Something went wrong</h2>
            <p>${message}</p>
            <button id="retry-button" class="page-btn" style="margin-top: 1rem;">Try Again</button>
        </div>
    `;
    
    document.getElementById('retry-button').addEventListener('click', () => {
        fetchCharacters();
    });
}

// Show loading animation
function showLoading() {
    loadingElement.style.display = 'flex';
    charactersContainer.style.display = 'none';
}

// Hide loading animation
function hideLoading() {
    loadingElement.style.display = 'none';
    charactersContainer.style.display = 'grid';
}

// Add some animation effects when scrolling
window.addEventListener('scroll', () => {
    const scrollPosition = window.scrollY;
    const cards = document.querySelectorAll('.character-card');
    
    cards.forEach(card => {
        const cardPosition = card.getBoundingClientRect().top + scrollPosition;
        const screenPosition = window.innerHeight + scrollPosition;
        
        if (cardPosition < screenPosition) {
            card.classList.add('visible');
        }
    });
})

// Initialize cache from localStorage if available
function initializeCache() {
    try {
        // Try to load cache from localStorage
        const savedCache = localStorage.getItem('rickAndMortyCache');
        if (savedCache) {
            const parsedCache = JSON.parse(savedCache);
            
            // Check if cache structure is valid
            if (parsedCache.characters && parsedCache.characterDetails && parsedCache.episodes) {
                cache.characters = parsedCache.characters;
                cache.characterDetails = parsedCache.characterDetails;
                cache.episodes = parsedCache.episodes;
                
                // Update cache status with stats
                updateCacheStats();
                console.log('Cache loaded from localStorage');
            }
        }
        
        // Set up periodic cache save
        setInterval(saveCache, 60000); // Save every minute
        
        // Set up cache expiration check
        setInterval(cleanExpiredCache, 300000); // Check every 5 minutes
    } catch (error) {
        console.error('Error initializing cache:', error);
        // Reset cache if there was an error
        cache.clear();
    }
}

// Save cache to localStorage
function saveCache() {
    try {
        const cacheToSave = {
            characters: cache.characters,
            characterDetails: cache.characterDetails,
            episodes: cache.episodes
        };
        
        localStorage.setItem('rickAndMortyCache', JSON.stringify(cacheToSave));
        console.log('Cache saved to localStorage');
    } catch (error) {
        console.error('Error saving cache:', error);
        
        // If the error is related to quota exceeded, clear some of the cache
        if (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
            console.log('Storage quota exceeded, clearing character listings cache');
            cache.clear('characters'); // Clear just the character listings to save space
            
            // Try saving again with reduced cache
            try {
                const reducedCache = {
                    characters: {},
                    characterDetails: cache.characterDetails,
                    episodes: cache.episodes
                };
                localStorage.setItem('rickAndMortyCache', JSON.stringify(reducedCache));
            } catch (e) {
                console.error('Still cannot save cache, clearing all cache', e);
                cache.clear();
            }
        }
    }
}

// Clean expired cache entries
function cleanExpiredCache() {
    const now = Date.now();
    let cleanedEntries = 0;
    
    // Clean characters cache
    Object.keys(cache.characters).forEach(key => {
        if (now > cache.characters[key].timestamp + cache.expirationTime) {
            delete cache.characters[key];
            cleanedEntries++;
        }
    });
    
    // Clean character details cache
    Object.keys(cache.characterDetails).forEach(key => {
        if (now > cache.characterDetails[key].timestamp + cache.expirationTime) {
            delete cache.characterDetails[key];
            cleanedEntries++;
        }
    });
    
    // Clean episodes cache
    Object.keys(cache.episodes).forEach(key => {
        if (now > cache.episodes[key].timestamp + cache.expirationTime) {
            delete cache.episodes[key];
            cleanedEntries++;
        }
    });
    
    if (cleanedEntries > 0) {
        console.log(`Cleaned ${cleanedEntries} expired cache entries`);
        updateCacheStats();
    }
}

// Update cache statistics
function updateCacheStats() {
    const characterCount = Object.keys(cache.characters).length;
    const detailsCount = Object.keys(cache.characterDetails).length;
    const episodesCount = Object.keys(cache.episodes).length;
    const totalItems = characterCount + detailsCount + episodesCount;
    
    // Update clear cache button text with count
    const clearCacheBtn = document.getElementById('clear-cache');
    if (totalItems > 0) {
        clearCacheBtn.innerHTML = `<i class="fas fa-sync-alt"></i> Clear Cache (${totalItems} items)`;
    } else {
        clearCacheBtn.innerHTML = `<i class="fas fa-sync-alt"></i> Clear Cache`;
    }
}

// Update cache status message
function updateCacheStatus(message) {
    const statusElement = document.getElementById('cache-status');
    statusElement.textContent = message;
    statusElement.classList.add('visible');
    
    // Update cache statistics
    updateCacheStats();
    
    // Hide the message after a delay
    setTimeout(() => {
        statusElement.classList.remove('visible');
    }, 3000);
}

// Add cache hit/miss tracking to cache methods
const originalGet = cache.get;
cache.get = function(type, key) {
    const result = originalGet.call(this, type, key);
    if (result) {
        // Cache hit
        updateCacheStats();
    }
    return result;
};

const originalSet = cache.set;
cache.set = function(type, key, data) {
    originalSet.call(this, type, key, data);
    updateCacheStats();
    saveCache(); // Save to localStorage when cache is updated
};

const originalClear = cache.clear;
cache.clear = function(type = null) {
    originalClear.call(this, type);
    updateCacheStats();
    saveCache(); // Save empty cache to localStorage
}

let isOnline = navigator.onLine;
let usingCachedData = false;

document.addEventListener('DOMContentLoaded', () => {
    updateConnectionStatus();
    window.addEventListener('online', handleNetworkChange);
    window.addEventListener('offline', handleNetworkChange);
    document.getElementById('close-offline-notification').addEventListener('click', () => {
        document.getElementById('offline-notification').classList.remove('visible');
    });
});

function handleNetworkChange() {
    const wasOnline = isOnline;
    isOnline = navigator.onLine;
    updateConnectionStatus();
    
    if (!wasOnline && isOnline) {
        showToast('You\'re back online!', 'success');
        if (usingCachedData) {
            showRefreshPrompt();
        }
    } else if (wasOnline && !isOnline) {
        document.getElementById('offline-notification').classList.add('visible');
    }
}

function updateConnectionStatus() {
    const statusIndicator = document.querySelector('.status-indicator');
    const statusText = document.querySelector('.status-text');
    
    if (isOnline) {
        statusIndicator.className = 'status-indicator online';
        statusText.textContent = 'Online';
    } else {
        statusIndicator.className = 'status-indicator offline';
        statusText.textContent = 'Offline';
    }
}

function showRefreshPrompt() {
    const refreshPrompt = document.createElement('div');
    refreshPrompt.className = 'refresh-prompt';
    refreshPrompt.innerHTML = `
        <div class="refresh-prompt-content">
            <p>You're back online! Would you like to refresh for the latest data?</p>
            <div class="refresh-buttons">
                <button id="refresh-yes" class="refresh-button">Yes, refresh</button>
                <button id="refresh-no" class="refresh-button secondary">No, keep cached data</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(refreshPrompt);
    
    document.getElementById('refresh-yes').addEventListener('click', () => {
        window.location.reload();
    });
    
    document.getElementById('refresh-no').addEventListener('click', () => {
        refreshPrompt.remove();
    });
    
    setTimeout(() => {
        if (document.body.contains(refreshPrompt)) {
            refreshPrompt.remove();
        }
    }, 10000);
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            <span>${message}</span>
            <button class="toast-close"><i class="fas fa-times"></i></button>
        </div>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('visible');
    }, 10);
    
    toast.querySelector('.toast-close').addEventListener('click', () => {
        toast.classList.remove('visible');
        setTimeout(() => {
            toast.remove();
        }, 300);
    });
    
    setTimeout(() => {
        if (document.body.contains(toast)) {
            toast.classList.remove('visible');
            setTimeout(() => {
                toast.remove();
            }, 300);
        }
    }, 5000);
}