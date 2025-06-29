document.addEventListener('DOMContentLoaded', () => {
    // === GLOBALE VARIABLEN & KONSTANTEN ===
    const BACKEND_URLS = { sql: 'http://localhost:8080/api', nosql: 'http://localhost:8081/api' };
    const DISCOVER_API = {
        RANDOM: 'https://www.themealdb.com/api/json/v1/1/random.php',
        CATEGORIES: 'https://www.themealdb.com/api/json/v1/1/categories.php',
        BY_CATEGORY: 'https://www.themealdb.com/api/json/v1/1/filter.php?c=',
        BY_INGREDIENT: 'https://www.themealdb.com/api/json/v1/1/filter.php?i=',
        BY_ID: 'https://www.themealdb.com/api/json/v1/1/lookup.php?i='
    };
    
    let currentBackendUrl = BACKEND_URLS.sql;
    let myRecipesCache = [];

    // === DOM-ELEMENTE ===
    const contentView = document.getElementById('content-view');

    // === API & LOGIK FUNKTIONEN ===
    async function fetchFromApi(url, options = {}) {
        const response = await fetch(url, options);
        if (!response.ok && response.status !== 204) {
            const errorText = await response.text();
            throw new Error(`HTTP Error: ${response.status} - ${errorText}`);
        }
        return response.status === 204 ? null : response.json();
    }

    async function fetchMyRecipes() {
        const container = document.getElementById('recipe-list-container');
        container.innerHTML = '<p><progress></progress></p>';
        try {
            myRecipesCache = await fetchFromApi(`${currentBackendUrl}/recipes`);
            renderRecipeCards(myRecipesCache, 'my');
        } catch (error) {
            container.innerHTML = `<p style="color: var(--pico-color-red-500);">Fehler: ${error.message}</p>`;
        }
    }

    async function fetchDiscoverRecipes(category = null) {
        const container = document.getElementById('discover-list-container');
        container.innerHTML = '<p><progress></progress></p>';
        try {
            let recipes;
            if (category) {
                const result = await fetchFromApi(`${DISCOVER_API.BY_CATEGORY}${category}`);
                recipes = result.meals.map(meal => ({ ...meal, id: meal.idMeal, title: meal.strMeal, image: meal.strMealThumb, type: 'discover-preview' }));
            } else {
                const promises = Array(10).fill().map(() => fetchFromApi(DISCOVER_API.RANDOM));
                const results = await Promise.all(promises);
                recipes = results.map(result => formatDiscoveredRecipe(result.meals[0]));
            }
            renderRecipeCards(recipes, 'discover');
        } catch (error) {
            container.innerHTML = `<p style="color: var(--pico-color-red-500);">Fehler: ${error.message}</p>`;
        }
    }
    
    async function loadDiscoverCategories() {
        const filterBar = document.getElementById('discover-filter-bar');
        if (!filterBar) return; // Sicherheitscheck
        try {
            const result = await fetchFromApi(DISCOVER_API.CATEGORIES);
            filterBar.innerHTML = '';
            // Einen Button für "Zufällig" hinzufügen
            const randomBtn = document.createElement('button');
            randomBtn.className = 'secondary outline';
            randomBtn.textContent = 'Zufällig';
            randomBtn.onclick = () => fetchDiscoverRecipes();
            filterBar.appendChild(randomBtn);

            result.categories.slice(0, 5).forEach(cat => {
                const button = document.createElement('button');
                button.className = 'secondary outline';
                button.textContent = cat.strCategory;
                button.onclick = () => fetchDiscoverRecipes(cat.strCategory);
                filterBar.appendChild(button);
            });
        } catch (error) {
            console.error("Kategorien konnten nicht geladen werden:", error);
        }
    }

    // --- RENDERING ---
    function renderRecipeCards(recipes, type, customContainer = null) {
        const container = customContainer || (type === 'my' ? document.getElementById('recipe-list-container') : document.getElementById('discover-list-container'));
        container.innerHTML = (!recipes || recipes.length === 0) ? '<p>Keine Rezepte gefunden.</p>' : '';
        if (!recipes) return;

        recipes.forEach(recipe => {
            const card = document.createElement('article');
            card.className = 'recipe-card';
            card.dataset.recipeId = recipe.id;
            card.innerHTML = `<header><strong>${recipe.title}</strong></header>${recipe.image ? `<img src="${recipe.image}" alt="${recipe.title}" style="height: 50px; width: auto; float: right; margin-top: -3.5rem; border-radius: 4px;">` : ''}<footer><small>${(recipe.tags || []).join(', ')}</small></footer>`;
            card.addEventListener('click', async () => {
                document.querySelectorAll('.recipe-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');

                if (recipe.type === 'discover-preview') {
                    contentView.innerHTML = '<article><p><progress></progress> Lade Rezeptdetails...</p></article>';
                    const fullRecipeData = await fetchFromApi(`${DISCOVER_API.BY_ID}${recipe.id}`);
                    const fullRecipe = formatDiscoveredRecipe(fullRecipeData.meals[0]);
                    displayRecipeDetails(fullRecipe, 'discover');
                } else {
                    displayRecipeDetails(recipe, type);
                }
            });
            container.appendChild(card);
        });
    }

    function displayRecipeDetails(recipe, type) {
        const originalServings = recipe.servings || 1;
        const renderDetails = (servings) => {
            contentView.innerHTML = `
                <article>
                    <header><h2>${recipe.title}</h2>${recipe.image ? `<img src="${recipe.image}" alt="${recipe.title}" style="border-radius: var(--pico-border-radius);">` : ''}</header>
                    <h4>Zutaten</h4>
                    <div class="grid" id="servings-input-container"><label for="servings-input">Portionen:</label><input type="number" id="servings-input" value="${servings}" min="1"></div>
                    <ul id="ingredient-list">
                        ${(recipe.ingredients || []).map(ing => `<li>${((ing.amount / originalServings) * servings).toFixed(1).replace('.0', '')} ${ing.unit || ''} ${ing.name}</li>`).join('')}
                    </ul>
                    <h4>Anleitung</h4><p style="white-space: pre-wrap;">${recipe.instructions}</p>
                    ${type === 'my' ? `<footer><div class="grid"><button class="edit-recipe-btn">Bearbeiten</button><button class="delete-recipe-btn secondary">Löschen</button></div></footer>` : ''}
                </article>`;
            
            contentView.querySelector('#servings-input').addEventListener('input', (e) => {
                const newServings = parseInt(e.target.value, 10);
                if (newServings > 0) renderDetails(newServings);
            });
            if (type === 'my') {
                contentView.querySelector('.edit-recipe-btn').addEventListener('click', () => displayRecipeForm(recipe));
                contentView.querySelector('.delete-recipe-btn').addEventListener('click', () => deleteRecipe(recipe.id, recipe.title));
            }
        };
        renderDetails(originalServings);
    }
    
    function displayRecipeForm(recipe = null) {
        const isEditing = recipe !== null;
        contentView.innerHTML = `<article><header><h3>${isEditing ? 'Rezept bearbeiten' : 'Neues Rezept erstellen'}</h3></header><form id="recipe-form"><input type="hidden" id="recipe-id" value="${isEditing ? recipe.id : ''}"><label for="title">Titel</label><input type="text" id="title" name="title" value="${isEditing ? recipe.title : ''}" required><label for="servings">Portionen (Original)</label><input type="number" id="servings" name="servings" value="${isEditing ? recipe.servings || 1 : 1}" min="1" required><label for="instructions">Anleitung</label><textarea id="instructions" name="instructions" rows="10" required>${isEditing ? recipe.instructions : ''}</textarea><label for="tags">Tags (kommagetrennt)</label><input type="text" id="tags" name="tags" value="${isEditing ? (recipe.tags || []).join(', ') : ''}"><fieldset id="ingredients-fieldset"><legend>Zutaten</legend></fieldset><button type="button" id="add-ingredient-btn" class="secondary outline">Zutat hinzufügen</button><hr><button type="submit">${isEditing ? 'Änderungen speichern' : 'Rezept erstellen'}</button></form></article>`;
        const ingredientsFieldset = document.getElementById('ingredients-fieldset');
        const addIngredientField = (ingredient = { name: '', amount: '', unit: '' }) => {
            const div = document.createElement('div');
            div.className = 'grid';
            div.innerHTML = `<input type="number" step="any" placeholder="Menge" value="${ingredient.amount}" class="ingredient-amount"><input type="text" placeholder="Einheit" value="${ingredient.unit}" class="ingredient-unit"><input type="text" placeholder="Zutat" value="${ingredient.name}" class="ingredient-name" required><button type="button" class="secondary outline remove-ingredient-btn">X</button>`;
            div.querySelector('.remove-ingredient-btn').addEventListener('click', () => div.remove());
            ingredientsFieldset.appendChild(div);
        };
        if (isEditing && recipe.ingredients?.length > 0) recipe.ingredients.forEach(addIngredientField); else addIngredientField();
        document.getElementById('add-ingredient-btn').addEventListener('click', () => addIngredientField());
        document.getElementById('recipe-form').addEventListener('submit', handleFormSubmit);
    }

    // --- FORM & DELETE LOGIC ---
    async function handleFormSubmit(event) {
        event.preventDefault();
        const form = event.target;
        const submitButton = form.querySelector('button[type="submit"]');
        submitButton.setAttribute('aria-busy', 'true');
        const id = form.querySelector('#recipe-id').value;
        const recipeData = {
            title: form.querySelector('#title').value,
            servings: parseInt(form.querySelector('#servings').value, 10),
            instructions: form.querySelector('#instructions').value,
            tags: form.querySelector('#tags').value.split(',').map(tag => tag.trim()).filter(Boolean),
            ingredients: Array.from(form.querySelectorAll('#ingredients-fieldset .grid')).map(row => ({
                amount: parseFloat(row.querySelector('.ingredient-amount').value) || 0,
                unit: row.querySelector('.ingredient-unit').value,
                name: row.querySelector('.ingredient-name').value
            })).filter(ing => ing.name)
        };

        try {
            const url = id ? `${currentBackendUrl}/recipes/${id}` : `${currentBackendUrl}/recipes`;
            const method = id ? 'PUT' : 'POST';
            const savedRecipe = await fetchFromApi(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(recipeData) });
            displayRecipeDetails(savedRecipe, 'my');
            await fetchMyRecipes();
            document.querySelector(`.recipe-card[data-recipe-id="${savedRecipe.id}"]`)?.classList.add('selected');
        } catch (error) {
            alert(`Fehler: ${error.message}`);
        } finally {
            submitButton.removeAttribute('aria-busy');
        }
    }
    async function deleteRecipe(id, title) {
        if (!confirm(`Möchtest du das Rezept "${title}" wirklich löschen?`)) return;
        try {
            await fetchFromApi(`${currentBackendUrl}/recipes/${id}`, { method: 'DELETE' });
            contentView.innerHTML = '<article><h3>Rezept gelöscht.</h3></article>';
            fetchMyRecipes();
        } catch (error) {
            alert(`Fehler: ${error.message}`);
        }
    }

    // --- HILFSFUNKTIONEN ---
    function formatDiscoveredRecipe(meal) {
        const ingredients = [];
        for (let i = 1; i <= 20; i++) {
            if (meal[`strIngredient${i}`]) ingredients.push({ name: meal[`strIngredient${i}`], amount: 1, unit: meal[`strMeasure${i}`] });
        }
        return { id: meal.idMeal, title: meal.strMeal, instructions: meal.strInstructions, image: meal.strMealThumb, ingredients, servings: 1, tags: (meal.strTags || '').split(',').filter(Boolean) };
    }

    function switchTab(tabName) {
        document.querySelectorAll('.tab-link').forEach(t => t.classList.remove('active'));
        document.querySelector(`.tab-link[data-tab="${tabName}"]`).classList.add('active');
        ['my-recipes-view', 'discover-view', 'ai-chef-view'].forEach(id => document.getElementById(id).style.display = 'none');
        document.getElementById('content-view').innerHTML = '<article><h3>Willkommen!</h3><p>Wähle links ein Rezept aus oder beginne eine Aktion.</p></article>';
        document.getElementById(`${tabName}-view`).style.display = 'block';
        if (tabName === 'my-recipes') fetchMyRecipes();
        else if (tabName === 'discover') {
            loadDiscoverCategories();
            fetchDiscoverRecipes();
        }
    }

    async function handleAiChefSubmit(event) {
        event.preventDefault();
        const ingredients = document.getElementById('ai-ingredients-input').value;
        const resultsContainer = document.getElementById('ai-results-container');
        resultsContainer.innerHTML = '<p><progress></progress></p>';
        if (!ingredients.trim()) {
            resultsContainer.innerHTML = '';
            return;
        }

        const mainIngredient = ingredients.split(',')[0].trim();
        try {
            const result = await fetchFromApi(`${DISCOVER_API.BY_INGREDIENT}${mainIngredient}`);
            if (!result.meals) {
                resultsContainer.innerHTML = '<p>Keine Rezepte für diese Zutat gefunden.</p>';
                return;
            }
            const recipes = result.meals.map(meal => ({ ...meal, id: meal.idMeal, title: meal.strMeal, image: meal.strMealThumb, type: 'discover-preview' }));
            renderRecipeCards(recipes, 'discover', resultsContainer);
        } catch (error) {
            resultsContainer.innerHTML = `<p style="color: var(--pico-color-red-500);">Fehler: ${error.message}</p>`;
        }
    }
    
    // === INITIALISIERUNG ===
    function init() {
        document.getElementById('backend-selector').addEventListener('change', (e) => { currentBackendUrl = BACKEND_URLS[e.target.value]; switchTab('my-recipes'); });
        document.getElementById('new-recipe-btn').addEventListener('click', () => { document.querySelectorAll('.recipe-card').forEach(c => c.classList.remove('selected')); displayRecipeForm(); });
        document.getElementById('search-input').addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const filtered = myRecipesCache.filter(r => r.title.toLowerCase().includes(searchTerm) || (r.ingredients || []).some(i => i.name.toLowerCase().includes(searchTerm)));
            renderRecipeCards(filtered, 'my');
        });
        document.querySelectorAll('.tab-link').forEach(tab => tab.addEventListener('click', (e) => { e.preventDefault(); switchTab(e.target.dataset.tab); }));
        document.getElementById('ai-chef-form').addEventListener('submit', handleAiChefSubmit);
        
        switchTab('my-recipes');
    }
    
    init();
});