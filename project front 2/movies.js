// API key for The Movie Database (TMDb)
const API_KEY = '592e311e55adc0b0ea9c8c5f86965c49';

// Initialize the watchlist from local storage, or create an empty array if none exists
let watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];

// Variables to store the current search query and sorting preference
let currentQuery = ''; 
let currentSort = 'popularity.desc'; 

// Fetch and display popular movies and watchlist on page load
document.addEventListener('DOMContentLoaded', async () => {
  const movies = await fetchPopularMovies(currentSort);
  displayMovies(movies);
  displayWatchlist();
});

// Fetch popular movies with the given sorting parameter
async function fetchPopularMovies(sortBy = 'popularity.desc') {
  try {
    const response = await fetch(`https://api.themoviedb.org/3/discover/movie?sort_by=${sortBy}&api_key=${API_KEY}`);
    const data = await response.json();
    return data.results;
  } catch (error) {
    console.error("Error fetching popular movies:", error);
    return [];
  }
}

// Handle the search input: fetch movies based on search query or reset to popular movies
document.getElementById('search').addEventListener('input', async function (event) {
  currentQuery = event.target.value;

  // Fetch movies if the query has more than 2 characters, else display popular movies
  if (currentQuery.length > 2) {
    const movies = await fetchMovies(currentQuery);
    displayMovies(movies, currentSort);
  } else {
    const movies = await fetchPopularMovies(currentSort); 
    displayMovies(movies);
  }
});

// Handle sorting selection change: fetch and display movies sorted by selected criteria
document.getElementById('sort-by').addEventListener('change', async function () {
  currentSort = document.getElementById('sort-by').value;

  // Fetch either searched movies or popular movies, based on current query length
  const movies = currentQuery.length > 2 
    ? await fetchMovies(currentQuery)
    : await fetchPopularMovies(currentSort);
    
  displayMovies(movies, currentSort);
});

// Fetch movies based on a search query
async function fetchMovies(query = '') {
  try {
    const url = `https://api.themoviedb.org/3/search/movie?query=${query}&api_key=${API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    return data.results;
  } catch (error) {
    console.error("Error fetching movies:", error);
    return [];
  }
}

// Display a list of movies on the main page
function displayMovies(movies, sortBy = 'popularity.desc') {
  const movieList = document.getElementById('movie-list');
  movieList.innerHTML = '';

  // Sort movies based on the selected sorting criteria
  movies.sort((a, b) => {
    if (sortBy === 'popularity.desc') {
      return b.popularity - a.popularity;
    } else if (sortBy === 'release_date.desc') {
      return new Date(b.release_date) - new Date(a.release_date);
    } else if (sortBy === 'vote_average.desc') {
      return b.vote_average - a.vote_average;
    }
    return 0;
  });

  // Create movie cards for each movie in the list
  movies.forEach(movie => {
    if (movie.poster_path && movie.title) {
      const card = document.createElement('div');
      card.className = 'movie-card';
      card.innerHTML = `
        <img src="https://image.tmdb.org/t/p/w500${movie.poster_path}" alt="${movie.title}">
        <h2>${movie.title}</h2>
        <p>${movie.release_date || 'Release date not available'}</p>
      `;
      card.addEventListener('click', () => fetchMovieDetails(movie.id)); // Fetch movie details on click
      movieList.appendChild(card);
    }
  });
}

// Fetch detailed information about a specific movie
async function fetchMovieDetails(movieId) {
  try {
    const [movieResponse, creditsResponse] = await Promise.all([
      fetch(`https://api.themoviedb.org/3/movie/${movieId}?api_key=${API_KEY}`),
      fetch(`https://api.themoviedb.org/3/movie/${movieId}/credits?api_key=${API_KEY}`)
    ]);
    
    const movie = await movieResponse.json();
    const credits = await creditsResponse.json();

    displayMovieDetails(movie, credits.cast); // Display movie details and cast
  } catch (error) {
    console.error("Error fetching movie details:", error);
  }
}

// Display detailed movie information in a modal
function displayMovieDetails(movie, cast) {
  document.getElementById('movie-title').textContent = movie.title;
  document.getElementById('movie-synopsis').textContent = movie.overview;
  document.getElementById('movie-rating').textContent = movie.vote_average;
  document.getElementById('movie-runtime').textContent = `${movie.runtime} min`;

  const castList = cast.slice(0, 5).map(actor => actor.name).join(', ');
  document.getElementById('movie-cast').textContent = castList || 'No cast information available';

  const addToWatchlistButton = document.getElementById('add-to-watchlist');

  // Update button text based on whether the movie is in the watchlist
  if (isInWatchlist(movie.id)) {
    addToWatchlistButton.textContent = 'Remove from Watchlist';
  } else {
    addToWatchlistButton.textContent = 'Add to Watchlist';
  }

  addToWatchlistButton.onclick = () => toggleWatchlist(movie, addToWatchlistButton);

  const modal = document.getElementById('movie-modal');
  modal.style.display = 'block';
}

// Check if a movie is in the watchlist
function isInWatchlist(movieId) {
  return watchlist.some(movie => movie.id === movieId);
}

// Toggle movie watchlist status (add/remove)
function toggleWatchlist(movie, button) {
  if (isInWatchlist(movie.id)) {
    removeFromWatchlist(movie.id);
    button.textContent = 'Add to Watchlist';
  } else {
    addToWatchlist(movie);
    button.textContent = 'Remove from Watchlist';
  }
  displayWatchlist(); // Update watchlist display
}

// Close modal when close button is clicked
document.querySelector('.close').addEventListener('click', () => {
  document.getElementById('movie-modal').style.display = 'none';
});

// Add a movie to the watchlist and save it to local storage
function addToWatchlist(movie) {
  if (!isInWatchlist(movie.id)) {
    watchlist.push({
      id: movie.id,
      title: movie.title,
      poster_path: movie.poster_path
    });
    localStorage.setItem('watchlist', JSON.stringify(watchlist)); // Save to local storage
  }
}

// Display all movies in the watchlist
function displayWatchlist() {
  const watchlistSection = document.getElementById('watchlist');
  watchlistSection.innerHTML = '';

  if (watchlist.length > 0) {
    document.getElementById('watchlist-title').style.display = 'block';
    watchlist.forEach(movie => {
      const card = document.createElement('div');
      card.className = 'movie-card';
      card.innerHTML = `
        <img src="https://image.tmdb.org/t/p/w500${movie.poster_path}" alt="${movie.title}">
        <h2>${movie.title}</h2>
        <button class="remove-button">Remove from Watchlist</button>
      `;
      card.querySelector('.remove-button').addEventListener('click', () => {
        removeFromWatchlist(movie.id); // Remove movie from watchlist on button click
        displayWatchlist(); // Refresh watchlist display
      });
      watchlistSection.appendChild(card);
    });
  } else {
    document.getElementById('watchlist-title').style.display = 'none';
  }
}

// Remove a movie from the watchlist and update local storage
function removeFromWatchlist(movieId) {
  watchlist = watchlist.filter(movie => movie.id !== movieId);
  localStorage.setItem('watchlist', JSON.stringify(watchlist)); // Update local storage
  displayWatchlist();
}

// Initial watchlist display
displayWatchlist();
