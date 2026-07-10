// Import data from the main application
import PROMPTS_RAW from '../data/prompts.js';
import { SN_PROMPTS as SUB25 } from '../data/sub25.js';
import WORDS from '../data/words.js';

// Global state
let allSyllables = [];
let filteredSyllables = [];
let bookmarks = new Set();
let currentPage = 1;
let syllablesPerPage = 60;
let showBookmarkedOnly = false;
let currentModalSyllable = null;
let solutionsPage = 1;
let solutionsPerPage = 100;
let allSolutions = [];

// Create word set for efficient lookup
const WORD_SET = new Set(WORDS);

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    initializeData();
    loadBookmarks();
    setupEventListeners();
    applyFilters();
});

// Initialize syllables data
function initializeData() {
    allSyllables = Object.entries(PROMPTS_RAW).map(([syllable, rate]) => ({
        syllable,
        solveRate: rate,
        length: syllable.length
    })).concat(SUB25.map(([syllable, sub]) => ({
        syllable,
        solveRate: -sub,
        length: syllable.length
    })));
    console.log(allSyllables);
}

// Load bookmarks from localStorage
function loadBookmarks() {
    const saved = localStorage.getItem('syllables_bookmarks');
    if (saved) {
        bookmarks = new Set(JSON.parse(saved));
    }
    updateBookmarkCount();
}

// Save bookmarks to localStorage
function saveBookmarks() {
    localStorage.setItem('syllables_bookmarks', JSON.stringify([...bookmarks]));
}

// Setup event listeners
function setupEventListeners() {
    // Search - auto-apply with debounce
    document.getElementById('search-input').addEventListener('input', debounce(applyFilters, 300));
    
    // Filters - auto-apply
    document.getElementById('filter-2').addEventListener('change', applyFilters);
    document.getElementById('filter-3').addEventListener('change', applyFilters);
    document.getElementById('filter-sub24').addEventListener('change', applyFilters);
    document.getElementById('min-rate').addEventListener('input', debounce(applyFilters, 500));
    document.getElementById('max-rate').addEventListener('input', debounce(applyFilters, 500));
    
    // Sort - auto-apply
    document.getElementById('sort-select').addEventListener('change', applyFilters);
    
    // Clear filters
    document.getElementById('clear-filters').addEventListener('click', clearFilters);
    
    // Bookmarks
    document.getElementById('view-bookmarks').addEventListener('click', toggleBookmarkedView);
    document.getElementById('copy-to-main').addEventListener('click', copyToMainFavorites);
    
    // Pagination
    document.getElementById('prev-page').addEventListener('click', () => changePage(-1));
    document.getElementById('next-page').addEventListener('click', () => changePage(1));
    document.getElementById('prev-page-bottom').addEventListener('click', () => changePage(-1));
    document.getElementById('next-page-bottom').addEventListener('click', () => changePage(1));
    
    // Page input validation
    setupPageInputValidation('page-input');
    setupPageInputValidation('page-input-bottom');
}

// Debounce function for search
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Apply all filters and sorting
function applyFilters() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const include2Letter = document.getElementById('filter-2').checked;
    const include3Letter = document.getElementById('filter-3').checked;
    const includeSub24 = document.getElementById('filter-sub24').checked;
    const minRate = parseFloat(document.getElementById('min-rate').value) || 0;
    const maxRate = parseFloat(document.getElementById('max-rate').value) || 100;
    const sortBy = document.getElementById('sort-select').value;
    
    // Start with all syllables or bookmarked only
    filteredSyllables = showBookmarkedOnly 
        ? allSyllables.filter(s => bookmarks.has(s.syllable))
        : [...allSyllables];
    
    // Apply search filter
    if (searchTerm) {
        filteredSyllables = filteredSyllables.filter(s => 
            s.syllable.toLowerCase().includes(searchTerm)
        );
    }
    
    // Apply length filters
    filteredSyllables = filteredSyllables.filter(s => {
        if (s.length === 2 && !include2Letter) return false;
        if (s.length === 3 && !include3Letter) return false;
        return true;
    });
    
    // Apply solve rate range filter
    filteredSyllables = filteredSyllables.filter(s => 
        (s.solveRate >= minRate && s.solveRate <= maxRate) || (includeSub24 && s.solveRate < 0) 
    );
    
    // Apply sorting
    if (sortBy === 'alphabetical') {
        filteredSyllables.sort((a, b) => a.syllable.localeCompare(b.syllable));
    } else if (sortBy === 'solve-rate') {
        filteredSyllables.sort((a, b) => Math.abs(b.solveRate) - Math.abs(a.solveRate));
    }
    
    // Reset to first page and display
    currentPage = 1;
    displaySyllables();
    updateStats();
}

// Clear all filters
function clearFilters() {
    document.getElementById('search-input').value = '';
    document.getElementById('filter-2').checked = true;
    document.getElementById('filter-3').checked = true;
    document.getElementById('filter-sub24').checked = true;
    document.getElementById('min-rate').value = '';
    document.getElementById('max-rate').value = '';
    document.getElementById('sort-select').value = 'alphabetical';
    
    applyFilters();
}

// Toggle between showing all syllables and bookmarked only
function toggleBookmarkedView() {
    showBookmarkedOnly = !showBookmarkedOnly;
    const btn = document.getElementById('view-bookmarks');
    
    if (showBookmarkedOnly) {
        btn.textContent = 'Show All Syllables';
        btn.classList.add('active');
    } else {
        btn.textContent = 'View Bookmarked Only';
        btn.classList.remove('active');
    }
    
    applyFilters();
}

// Display syllables for current page
function displaySyllables() {
    const grid = document.getElementById('syllables-grid');
    const startIndex = (currentPage - 1) * syllablesPerPage;
    const endIndex = startIndex + syllablesPerPage;
    const pageSyllables = filteredSyllables.slice(startIndex, endIndex);
    
    grid.innerHTML = '';
    
    if (pageSyllables.length === 0) {
        grid.innerHTML = '<div class="no-results">No syllables found matching your criteria.</div>';
        updatePagination(0);
        return;
    }
    
    pageSyllables.forEach(syllable => {
        const card = createSyllableCard(syllable);
        grid.appendChild(card);
    });
    
    updatePagination(filteredSyllables.length);
}

// Create a syllable card element
function createSyllableCard(syllable) {
    const card = document.createElement('div');
    card.className = 'syllable-card';
    
    const isBookmarked = bookmarks.has(syllable.syllable);
    const isSelfSolve = WORD_SET.has(syllable.syllable.toUpperCase());

    const solveRateText = syllable.solveRate >= 0 ? syllable.solveRate.toFixed(1) + "%" : "sub" + (-syllable.solveRate);
    
    card.innerHTML = `
        <div class="syllable-header">
            <span class="syllable-text ${isSelfSolve ? 'self-solve' : ''}">${syllable.syllable}</span>
            <button class="bookmark-btn ${isBookmarked ? 'bookmarked' : ''}" 
                    data-syllable="${syllable.syllable}">
                ${isBookmarked ? '★' : '☆'}
            </button>
        </div>
        <div class="syllable-info">
            <span class="length-badge">${syllable.length}-letter</span>
            <span class="solve-rate">${solveRateText}</span>
        </div>
    `;
    
    // Add click functionality to entire card
    card.addEventListener('click', (e) => {
        // Don't open modal if bookmark button was clicked
        if (e.target.classList.contains('bookmark-btn')) {
            return;
        }
        console.log('Syllable clicked:', syllable.syllable);
        e.stopPropagation();
        openSolutionsModal(syllable.syllable);
    });
    
    // Add bookmark functionality
    const bookmarkBtn = card.querySelector('.bookmark-btn');
    bookmarkBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleBookmark(syllable.syllable);
    });
    
    return card;
}

// Toggle bookmark status
function toggleBookmark(syllable) {
    if (bookmarks.has(syllable)) {
        bookmarks.delete(syllable);
    } else {
        bookmarks.add(syllable);
    }
    
    saveBookmarks();
    updateBookmarkCount();
    displaySyllables(); // Refresh display to update bookmark button
}

// Update bookmark count in sidebar
function updateBookmarkCount() {
    const count = document.getElementById('bookmark-count');
    const viewBtn = document.getElementById('view-bookmarks');
    
    count.textContent = `${bookmarks.size} bookmark${bookmarks.size !== 1 ? 's' : ''}`;
    viewBtn.disabled = bookmarks.size === 0;
}

// Copy syllables bookmarks to main page favorites
function copyToMainFavorites() {
    if (bookmarks.size === 0) {
        alert('No bookmarks to copy!');
        return;
    }
    
    try {
        // Get existing main page favorites
        const mainFavsData = localStorage.getItem('wb_favs');
        const mainFavs = mainFavsData ? new Set(JSON.parse(mainFavsData)) : new Set();
        
        // Add all syllables bookmarks to main favorites
        bookmarks.forEach(syllable => {
            mainFavs.add(syllable);
        });
        
        // Save to main page favorites localStorage
        localStorage.setItem('wb_favs', JSON.stringify([...mainFavs]));
        
        alert(`Successfully copied ${bookmarks.size} bookmark${bookmarks.size !== 1 ? 's' : ''} to main page favorites!`);
    } catch (error) {
        console.error('Error copying to main favorites:', error);
        alert('Error copying to main favorites. Please try again.');
    }
}

// Change page
function changePage(direction) {
    const totalPages = Math.ceil(filteredSyllables.length / syllablesPerPage);
    const newPage = currentPage + direction;
    
    if (newPage >= 1 && newPage <= totalPages) {
        currentPage = newPage;
        displaySyllables();
        
        // Scroll to top of content
        document.getElementById('content').scrollTop = 0;
    }
}

// Setup page input validation
function setupPageInputValidation(inputId) {
    const input = document.getElementById(inputId);
    
    input.addEventListener('input', (e) => {
        // Allow only numbers using regex
        let value = e.target.value.replace(/[^0-9]/g, '');
        const totalPages = Math.ceil(filteredSyllables.length / syllablesPerPage);
        
        // Validate input
        if (!value || parseInt(value) < 1) {
            e.target.value = currentPage;
            return;
        }
        
        const parsedValue = parseInt(value);
        if (parsedValue > totalPages) {
            e.target.value = totalPages;
            return;
        }
        
        // Update page if valid and different
        if (parsedValue !== currentPage) {
            currentPage = parsedValue;
            displaySyllables();
            // Sync other input
            syncPageInputs();
        }
    });
    
    input.addEventListener('keydown', (e) => {
        // Allow delete entire number
        if (e.key === 'Delete' || e.key === 'Backspace') {
            if (e.target.selectionStart === 0 && e.target.selectionEnd === e.target.value.length) {
                e.target.value = '';
                e.preventDefault();
                return;
            }
        }
    });
    
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.target.blur();
            // Apply min/max validation on Enter
            const value = parseInt(e.target.value);
            const totalPages = Math.ceil(filteredSyllables.length / syllablesPerPage);
            if (value < 1) e.target.value = 1;
            if (value > totalPages) e.target.value = totalPages;
        }
    });
}

// Sync all page inputs to current page
function syncPageInputs() {
    const totalPages = Math.ceil(filteredSyllables.length / syllablesPerPage);
    document.getElementById('page-input').value = currentPage;
    document.getElementById('page-input').max = totalPages;
    document.getElementById('page-input-bottom').value = currentPage;
    document.getElementById('page-input-bottom').max = totalPages;
}

// Update pagination controls
function updatePagination(totalItems) {
    const totalPages = Math.ceil(totalItems / syllablesPerPage);
    
    // Update page inputs
    document.getElementById('page-input').value = currentPage;
    document.getElementById('page-input').max = totalPages;
    document.getElementById('page-input-bottom').value = currentPage;
    document.getElementById('page-input-bottom').max = totalPages;
    
    // Update page totals
    document.getElementById('page-total').textContent = `of ${totalPages}`;
    document.getElementById('page-total-bottom').textContent = `of ${totalPages}`;
    
    // Update current page display
    document.getElementById('current-page').textContent = `Page ${currentPage}`;
    
    // Update button states
    const hasPrev = currentPage > 1;
    const hasNext = currentPage < totalPages;
    
    document.getElementById('prev-page').disabled = !hasPrev;
    document.getElementById('next-page').disabled = !hasNext;
    document.getElementById('prev-page-bottom').disabled = !hasPrev;
    document.getElementById('next-page-bottom').disabled = !hasNext;
}

// Update statistics
function updateStats() {
    const total = showBookmarkedOnly ? bookmarks.size : filteredSyllables.length;
    document.getElementById('total-count').textContent = `${total} syllables`;
}

// Make modal functions globally accessible
window.closeSolutionsModal = closeSolutionsModal;
window.changeSolutionsPage = changeSolutionsPage;
window.openSolutionsModal = openSolutionsModal;

// Open solutions modal for a syllable
function openSolutionsModal(syllable) {
    console.log('Opening modal for syllable:', syllable);
    currentModalSyllable = syllable;
    solutionsPage = 1;
    
    // Generate solutions
    try {
        allSolutions = generateSolutions(syllable);
        console.log('Generated solutions:', allSolutions.length);
    } catch (error) {
        console.error('Error generating solutions:', error);
        allSolutions = [];
    }
    
    // Show modal
    const modal = document.getElementById('solutions-modal');
    if (!modal) {
        console.error('Modal element not found');
        return;
    }
    
    console.log('Modal found, adding show class');
    modal.classList.add('show');
    
    // Update modal content
    updateSolutionsModal();
}

// Generate solutions for a syllable with smart sorting
function generateSolutions(syllable) {
    const prompt = syllable.toLowerCase();
    const solutions = WORDS.filter(word => word.toLowerCase().includes(prompt));
    
    // Sort: prompt-starting words first, then alphabetical
    solutions.sort((a, b) => {
        const aStarts = a.toLowerCase().startsWith(prompt);
        const bStarts = b.toLowerCase().startsWith(prompt);
        
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        
        return a.localeCompare(b);
    });
    
    return solutions;
}

// Update solutions modal content
function updateSolutionsModal() {
    const modal = document.getElementById('solutions-modal');
    const title = modal.querySelector('.modal-title');
    const solutionsList = modal.querySelector('.solutions-list');
    
    title.textContent = `Solutions for "${currentModalSyllable}" (${allSolutions.length} total)`;
    
    // Calculate page boundaries
    const startIndex = (solutionsPage - 1) * solutionsPerPage;
    const endIndex = Math.min(startIndex + solutionsPerPage, allSolutions.length);
    const pageSolutions = allSolutions.slice(startIndex, endIndex);
    
    // Display solutions
    solutionsList.innerHTML = '';
    pageSolutions.forEach(word => {
        const item = document.createElement('div');
        item.className = 'solution-item';
        item.textContent = word;
        solutionsList.appendChild(item);
    });
    
    // Update pagination
    updateSolutionsPagination();
    
    // Setup modal page input validation if not already done
    if (!modal.dataset.inputSetup) {
        setupSolutionsPageInputValidation();
        modal.dataset.inputSetup = 'true';
    }
}

// Update solutions pagination
function updateSolutionsPagination() {
    const totalPages = Math.ceil(allSolutions.length / solutionsPerPage);
    
    // Update page input
    const pageInput = document.getElementById('solutions-page-input');
    pageInput.value = solutionsPage;
    pageInput.max = totalPages;
    
    // Update page total
    document.getElementById('solutions-page-total').textContent = `of ${totalPages}`;
    
    // Update button states
    const modal = document.getElementById('solutions-modal');
    modal.querySelector('.prev-solutions').disabled = solutionsPage <= 1;
    modal.querySelector('.next-solutions').disabled = solutionsPage >= totalPages;
}

// Setup solutions page input validation
function setupSolutionsPageInputValidation() {
    const input = document.getElementById('solutions-page-input');
    
    input.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        const totalPages = Math.ceil(allSolutions.length / solutionsPerPage);
        
        // Validate input
        if (isNaN(value) || value < 1) {
            e.target.value = solutionsPage;
            return;
        }
        
        if (value > totalPages) {
            e.target.value = totalPages;
            return;
        }
        
        // Update page if valid and different
        if (value !== solutionsPage) {
            solutionsPage = value;
            updateSolutionsModal();
        }
    });
    
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.target.blur();
        }
    });
}

// Close solutions modal
function closeSolutionsModal() {
    const modal = document.getElementById('solutions-modal');
    modal.classList.remove('show');
    currentModalSyllable = null;
    allSolutions = [];
}

// Change solutions page
function changeSolutionsPage(direction) {
    const totalPages = Math.ceil(allSolutions.length / solutionsPerPage);
    const newPage = solutionsPage + direction;
    
    if (newPage >= 1 && newPage <= totalPages) {
        solutionsPage = newPage;
        updateSolutionsModal();
    }
}
