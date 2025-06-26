const BACKEND_URLS = {
  sql: 'http://localhost:8080/api',
  nosql: 'http://localhost:8081/api'
};
let currentBackendUrl = BACKEND_URLS.sql;

const backendSelector = document.getElementById('backend-selector');
const recipeList = document.getElementById('recipe-list');

async function loadRecipes() {
  recipeList.innerHTML = '<li>Lade Rezepte...</li>';
  try {
    const response = await fetch(`${currentBackendUrl}/recipes`);
    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
    const recipes = await response.json();
    
    recipeList.innerHTML = ''; // Liste leeren
    if (recipes.length === 0) {
      recipeList.innerHTML = '<li>Noch keine Rezepte vorhanden.</li>';
      return;
    }
    
    recipes.forEach(recipe => {
      const li = document.createElement('li');
      li.textContent = recipe.title;
      recipeList.appendChild(li);
    });
  } catch (error) {
    recipeList.innerHTML = `<li>Fehler beim Laden der Rezepte: ${error.message}</li>`;
    console.error('Fetch error:', error);
  }
}

backendSelector.addEventListener('change', (event) => {
  currentBackendUrl = BACKEND_URLS[event.target.value];
  console.log(`Backend gewechselt zu: ${event.target.value.toUpperCase()}`);
  loadRecipes();
});

// Initiales Laden beim Start der Seite
document.addEventListener('DOMContentLoaded', loadRecipes);