// DOM Elements
const bookPreferencesForm = document.getElementById('bookPreferencesForm');
const booksGrid = document.getElementById('booksGrid');
const recommendationsSection = document.getElementById('recommendationsSection');
const wishlistSection = document.getElementById('wishlistSection');
const wishlistGrid = document.getElementById('wishlistGrid');
const wishlistBtn = document.getElementById('wishlistBtn');
const profileBtn = document.getElementById('profileBtn');
const profileSection = document.getElementById('profileSection');

// Initialize wishlist from localStorage
let wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];

// Event Listeners
bookPreferencesForm.addEventListener('submit', handleFormSubmit);
wishlistBtn.addEventListener('click', toggleWishlist);
profileBtn.addEventListener('click', toggleProfile);

function handleFormSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    // Input validation
    const minPrice = parseFloat(formData.get('minPrice'));
    const maxPrice = parseFloat(formData.get('maxPrice'));
    
    if (minPrice > maxPrice) {
        alert('Minimum price cannot be greater than maximum price');
        return;
    }
    
    if (minPrice < 0 || maxPrice < 0) {
        alert('Price cannot be negative');
        return;
    }
    
    const preferences = {
        genre: formData.get('genre'),
        minPrice: minPrice,
        maxPrice: maxPrice,
        format: formData.get('format'),
        language: formData.get('language'),
        publicationYear: formData.get('publicationYear')
    };

    // Show loading state
    booksGrid.innerHTML = '<div class="loading">Finding the perfect books for you...</div>';
    recommendationsSection.classList.remove('hidden');
    wishlistSection.classList.add('hidden');
    profileSection.classList.add('hidden');

    // Use setTimeout to simulate API call and show loading state
    setTimeout(() => {
        const recommendations = getRecommendations(preferences);
        displayRecommendations(recommendations);
        
        // Update profile preferences
        updateProfilePreferences(preferences);
    }, 1000);
}

function getRecommendations(preferences) {
    let filteredBooks = books.filter(book => {
        const matchesGenre = preferences.genre === '' || book.genre === preferences.genre;
        const matchesPrice = book.price >= preferences.minPrice && book.price <= preferences.maxPrice;
        const matchesFormat = preferences.format === 'all' || book.format === preferences.format;
        const matchesLanguage = book.language === preferences.language;
        const matchesYear = preferences.publicationYear === 'all' || 
                          (preferences.publicationYear === 'older' ? book.publicationYear <= 2021 : 
                           book.publicationYear.toString() === preferences.publicationYear);

        return matchesGenre && matchesPrice && matchesFormat && matchesLanguage && matchesYear;
    });

    // Sort by rating and number of reviews to find the best matches
    filteredBooks.sort((a, b) => {
        const scoreA = a.rating * Math.log10(a.reviews);
        const scoreB = b.rating * Math.log10(b.reviews);
        return scoreB - scoreA;
    });

    return filteredBooks;
}

function displayRecommendations(recommendations) {
    booksGrid.innerHTML = '';
    wishlistSection.classList.add('hidden');
    profileSection.classList.add('hidden');
    recommendationsSection.classList.remove('hidden');

    if (recommendations.length === 0) {
        booksGrid.innerHTML = `
            <div class="no-results">
                <p>No books found matching your preferences.</p>
                <p>Try adjusting your filters or <button onclick="resetForm()" class="reset-btn">Reset All Filters</button></p>
            </div>`;
        return;
    }

    recommendations.forEach((book, index) => {
        const bookCard = createBookCard(book);
        if (index === 0) {
            bookCard.classList.add('highlighted');
            bookCard.setAttribute('aria-label', 'Best Match: ' + book.title);
        }
        booksGrid.appendChild(bookCard);
    });
}

function createBookCard(book) {
    const card = document.createElement('div');
    card.className = 'book-card';
    card.setAttribute('data-book-id', book.id);
    card.setAttribute('role', 'listitem');

    const isInWishlist = wishlist.some(item => item.id === book.id);
    
    card.innerHTML = `
        <img src="${book.imageUrl}" alt="Cover of ${book.title}" loading="lazy">
        <h3 id="book-title-${book.id}">${book.title}</h3>
        <p class="author">by ${book.author}</p>
        <p class="price" aria-label="Price: $${book.price.toFixed(2)}">$${book.price.toFixed(2)}</p>
        <p class="description">${book.description}</p>
        <p class="rating" aria-label="Rating: ${book.rating} out of 5 stars with ${book.reviews} reviews">
            Rating: ${book.rating}/5 (${book.reviews} reviews)
        </p>
        <button class="wishlist-btn ${isInWishlist ? 'in-wishlist' : ''}" 
                onclick="toggleWishlistItem(${book.id})"
                aria-pressed="${isInWishlist}"
                aria-labelledby="book-title-${book.id}">
            ${isInWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
        </button>
    `;

    return card;
}

function toggleWishlistItem(bookId) {
    const book = books.find(b => b.id === bookId);
    const index = wishlist.findIndex(item => item.id === bookId);

    if (index === -1) {
        wishlist.push(book);
        addToRecentActivity(book, 'Added to wishlist');
    } else {
        wishlist.splice(index, 1);
    }

    localStorage.setItem('wishlist', JSON.stringify(wishlist));
    updateWishlistButtons();
    updateProfileStats();
}

function updateWishlistButtons() {
    document.querySelectorAll('.book-card').forEach(card => {
        const bookId = parseInt(card.getAttribute('data-book-id'));
        const wishlistBtn = card.querySelector('.wishlist-btn');
        const isInWishlist = wishlist.some(item => item.id === bookId);

        wishlistBtn.textContent = isInWishlist ? 'Remove from Wishlist' : 'Add to Wishlist';
        wishlistBtn.className = `wishlist-btn ${isInWishlist ? 'in-wishlist' : ''}`;
        wishlistBtn.setAttribute('aria-pressed', isInWishlist);
    });
}

function toggleWishlist(e) {
    e.preventDefault();
    recommendationsSection.classList.add('hidden');
    profileSection.classList.add('hidden');
    wishlistSection.classList.remove('hidden');
    displayWishlist();
}

function displayWishlist() {
    wishlistGrid.innerHTML = '';

    if (wishlist.length === 0) {
        wishlistGrid.innerHTML = '<p>Your wishlist is empty. Start adding books from the recommendations!</p>';
        return;
    }

    wishlist.forEach(book => {
        const bookCard = createBookCard(book);
        wishlistGrid.appendChild(bookCard);
    });
}

function toggleProfile(e) {
    e.preventDefault();
    recommendationsSection.classList.add('hidden');
    wishlistSection.classList.add('hidden');
    profileSection.classList.remove('hidden');
    updateProfileStats();
}

function updateProfileStats() {
    const wishlistCount = document.querySelector('.profile-stats h3');
    wishlistCount.textContent = wishlist.length;
}

function updateProfilePreferences(preferences) {
    if (preferences.genre) {
        const preferenceTags = document.querySelector('.preference-tags');
        const existingTag = Array.from(preferenceTags.children)
            .find(tag => tag.textContent.toLowerCase() === preferences.genre);
        
        if (!existingTag && preferences.genre !== '') {
            const tag = document.createElement('span');
            tag.className = 'preference-tag';
            tag.textContent = preferences.genre.charAt(0).toUpperCase() + preferences.genre.slice(1);
            preferenceTags.appendChild(tag);
        }
    }
}

function addToRecentActivity(book, action) {
    const historyList = document.querySelector('.history-list');
    const newItem = document.createElement('li');
    newItem.className = 'history-item';
    
    newItem.innerHTML = `
        <img src="${book.imageUrl}" alt="Cover of ${book.title}">
        <div class="history-item-info">
            <h4>${book.title}</h4>
            <p>${action} • Just now</p>
        </div>
    `;
    
    historyList.insertBefore(newItem, historyList.firstChild);
    
    // Keep only the last 5 items
    while (historyList.children.length > 5) {
        historyList.removeChild(historyList.lastChild);
    }
}

// Reset form helper function
function resetForm() {
    bookPreferencesForm.reset();
    const event = new Event('submit');
    bookPreferencesForm.dispatchEvent(event);
}
