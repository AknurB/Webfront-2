// API key for the Spoonacular API
const API_KEY = '8c59a56971d345d48e249056ff70044a';

// Initialize favorites and recipe cache from local storage, or set to empty arrays/objects if they don't exist
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
let recipeCache = JSON.parse(localStorage.getItem('recipeCache')) || {};

// Load recipes and favorites on page load
document.addEventListener('DOMContentLoaded', async () => {
  const recipes = await fetchRecipes();
  displayRecipes(recipes);           // Display the list of recipes
  displayFavorites();                 // Display the list of favorite recipes
  await updateRecipeCacheWithNutritionInfo(); // Update cache with nutrition information if missing
});

// Handle search input to fetch and display recipes based on query
document.getElementById('search').addEventListener('input', async function (event) {
  const query = event.target.value;
  const recipes = await fetchRecipes(query);
  displayRecipes(recipes);
});

// Fetch recipes from Spoonacular API with optional query, using cache if available
async function fetchRecipes(query = '') {
  const cacheKey = `recipes_${query}`;

  // Check cache for recipes to avoid repeated API calls
  if (recipeCache[cacheKey]) {
    console.log("Fetching from cache:", cacheKey);
    return recipeCache[cacheKey];
  }

  // Build API URL based on query and fetch recipes
  let url = `https://api.spoonacular.com/recipes/complexSearch?apiKey=${API_KEY}`;
  if (query) url += `&query=${query}`;

  const response = await fetch(url);
  const data = await response.json();

  // Cache the fetched recipes and save to local storage
  recipeCache[cacheKey] = data.results;
  localStorage.setItem('recipeCache', JSON.stringify(recipeCache));
  return data.results;
}

// Display recipes on the main list
function displayRecipes(recipes) {
  const recipeList = document.getElementById('recipe-list');
  recipeList.innerHTML = '';

  recipes.forEach(recipe => {
    if (recipe.image && recipe.title) {
      const card = document.createElement('div');
      card.className = 'recipe-card';
      card.innerHTML = `
        <img src="${recipe.image}" alt="${recipe.title}" onerror="this.parentElement.style.display='none'">
        <h3>${recipe.title}</h3>
        <div class="buttons">
          <button class="view-recipe-button" data-id="${recipe.id}">View Recipe</button>
          <button class="favorite-button">${isFavorite(recipe.id) ? '❤️' : '♡'}</button>
        </div>
      `;

      // Handle 'View Recipe' button click to display recipe details
      card.querySelector('.view-recipe-button').addEventListener('click', async (e) => {
        const recipeId = e.target.getAttribute('data-id');
        const recipeDetails = await fetchRecipeDetails(recipeId);
        displayRecipeDetails(recipeDetails);
      });

      // Handle 'Favorite' button click to toggle favorite status
      const favoriteButton = card.querySelector('.favorite-button');
      favoriteButton.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleFavorite(recipe);
        favoriteButton.innerHTML = isFavorite(recipe.id) ? '❤️' : '♡';
        displayFavorites();
      });

      recipeList.appendChild(card);
    }
  });
}

// Fetch full details for a recipe, including nutrition info if available
async function fetchRecipeDetails(recipeId) {
  if (recipeCache[recipeId] && recipeCache[recipeId].nutritionLabel) {
    console.log("Fetching recipe details from cache:", recipeId);
    return recipeCache[recipeId];
  }

  const response = await fetch(`https://api.spoonacular.com/recipes/${recipeId}/information?apiKey=${API_KEY}`);
  const recipe = await response.json();

  // Fetch the nutrition label HTML separately
  recipe.nutritionLabel = await fetchNutritionLabel(recipeId);

  // Update the cache with full details and save to local storage
  recipeCache[recipeId] = recipe;
  localStorage.setItem('recipeCache', JSON.stringify(recipeCache));

  return recipe;
}

// Fetch the nutrition label for a recipe
async function fetchNutritionLabel(recipeId) {
  const response = await fetch(`https://api.spoonacular.com/recipes/${recipeId}/nutritionLabel?apiKey=${API_KEY}`);
  return await response.text();
}

// Check if a recipe is in the favorites list
function isFavorite(recipeId) {
  return favorites.some(fav => fav.id === recipeId);
}

// Toggle a recipe's favorite status (add or remove from favorites)
function toggleFavorite(recipe) {
  const favoriteIndex = favorites.findIndex(fav => fav.id === recipe.id);
  if (favoriteIndex > -1) {
    favorites.splice(favoriteIndex, 1); // Remove from favorites
  } else {
    favorites.push({ id: recipe.id, title: recipe.title, image: recipe.image }); // Add to favorites
  }
  localStorage.setItem('favorites', JSON.stringify(favorites)); // Save to local storage
}

// Display detailed recipe information in a modal
async function displayRecipeDetails(recipe) {
  document.getElementById('recipe-title').textContent = recipe.title;
  document.getElementById('recipe-ingredients').innerHTML = `
    <strong>Ingredients:</strong>
    <ul>${recipe.extendedIngredients.map(ingredient => `<li>${ingredient.original}</li>`).join('')}</ul>
  `;
  document.getElementById('recipe-instructions').innerHTML = `
    <strong>Instructions:</strong> ${recipe.instructions || 'No instructions available.'}
  `;

  // Display nutrition information if available
  if (recipe.nutritionLabel) {
    document.getElementById('recipe-nutrition').innerHTML = recipe.nutritionLabel;
  } else {
    document.getElementById('recipe-nutrition').textContent = 'No nutrition info available.';
  }

  const modal = document.getElementById('recipe-modal');
  modal.style.display = 'block';
}

// Close modal when the 'close' button is clicked
document.querySelector('.close').addEventListener('click', () => {
  const modal = document.getElementById('recipe-modal');
  modal.style.display = 'none';
});

// Close modal when clicking outside of it
window.addEventListener('click', (event) => {
  const modal = document.getElementById('recipe-modal');
  if (event.target === modal) {
    modal.style.display = 'none';
  }
});

// Display all recipes in the favorites list
function displayFavorites() {
  const favoriteList = document.getElementById('favorite-list');
  favoriteList.innerHTML = '';

  favorites.forEach(recipe => {
    const card = document.createElement('div');
    card.className = 'recipe-card';
    card.innerHTML = `
      <img src="${recipe.image}" alt="${recipe.title}">
      <h3>${recipe.title}</h3>
      <div class="buttons">
        <button class="view-recipe-button" data-id="${recipe.id}">View Recipe</button>
        <button class="favorite-button">❤️</button>
      </div>
    `;

    // Handle 'View Recipe' button click to display recipe details
    card.querySelector('.view-recipe-button').addEventListener('click', async (e) => {
      const recipeId = e.target.getAttribute('data-id');
      const recipeDetails = await fetchRecipeDetails(recipeId);
      displayRecipeDetails(recipeDetails);
    });

    // Handle 'Favorite' button click to toggle favorite status and refresh display
    card.querySelector('.favorite-button').addEventListener('click', () => {
      toggleFavorite(recipe);
      displayFavorites();

      // Update the favorite button status in the main recipe list
      document.querySelectorAll('.recipe-card').forEach(mainCard => {
        const title = mainCard.querySelector('h3').innerText;
        if (title === recipe.title) {
          const mainFavoriteButton = mainCard.querySelector('.favorite-button');
          mainFavoriteButton.innerHTML = isFavorite(recipe.id) ? '❤️' : '♡';
        }
      });
    });

    favoriteList.appendChild(card);
  });
}

// Update the recipe cache with missing nutrition info if necessary
async function updateRecipeCacheWithNutritionInfo() {
  for (const recipeId in recipeCache) {
    const recipe = recipeCache[recipeId];
    if (!recipe.nutritionLabel) {
      await fetchRecipeDetails(recipeId); // Fetch details if nutrition info is missing
    }
  }
  localStorage.setItem('recipeCache', JSON.stringify(recipeCache)); // Save updated cache to local storage
}
