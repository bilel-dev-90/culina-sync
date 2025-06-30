// FINALE, VOLLSTÄNDIGE & KORRIGIERTE app.js
document.addEventListener('DOMContentLoaded', () => {
    // === 1. KONFIGURATION & GLOBALE VARIABLEN ===
    const API_CONFIG = {
        BACKEND: { sql: 'http://localhost:8080/api', nosql: 'http://localhost:8081/api' },
        CLOUDINARY: { URL: 'https://api.cloudinary.com/v1_1/djwp0ond5/image/upload', UPLOAD_PRESET: 'culina_sync_unsigned' },
        SPOONACULAR: { API_KEY: '58edc64606ae4e66a0026d8c418dd9d8', FIND_BY_INGREDIENTS: 'https://api.spoonacular.com/recipes/findByIngredients', GET_RECIPE_INFO: (id) => `https://api.spoonacular.com/recipes/${id}/information` },
        THEMEALDB: { CATEGORIES: 'https://www.themealdb.com/api/json/v1/1/list.php?c=list', BY_CATEGORY: 'https://www.themealdb.com/api/json/v1/1/filter.php?c=', BY_ID: 'https://www.themealdb.com/api/json/v1/1/lookup.php?i=' },
        TRANSLATE: 'https://api.mymemory.translated.net/get'
    };
    let currentBackendUrl = API_CONFIG.BACKEND.sql;
    let myRecipesCache = [];

    const DOMElements = {
        contentView: document.getElementById('content-view'),
        myRecipesContainer: document.getElementById('recipe-list-container'),
        discoverContainer: document.getElementById('discover-category-container'),
        restekochContainer: document.getElementById('restekoch-results-container')
    };

    // === 3. API & LOGIK FUNKTIONEN ===

    async function fetchFromApi(url, options = {}) {
        const response = await fetch(url, options);
        if (!response.ok && response.status !== 204) { const errorText = await response.text(); throw new Error(`HTTP Error: ${response.status} - ${errorText}`); }
        return response.status === 204 ? null : response.json();
    }
    // KORRIGIERTE ÜBERSETZUNGSFUNKTION
    async function translateText(text, langPair = 'en|de') {
        if (!text || !text.trim()) return text;
        // PRÜFUNG: Nur übersetzen, wenn der Text kurz genug ist.
        if (text.length > 490) {
            console.warn("Text zu lang für Übersetzung, wird im Original belassen:", text.substring(0, 50) + "...");
            return text;
        }
        try {
            const data = await fetchFromApi(`${API_CONFIG.TRANSLATE}?q=${encodeURIComponent(text)}&langpair=${langPair}`);
            // Manchmal liefert die API seltsame Ergebnisse, wir filtern das
            if(data.responseData.translatedText.includes("QUERY LENGTH LIMIT EXCEEDED")) {
                return text;
            }
            return data.responseData.translatedText;
        } catch (error) {
            console.error('Translation failed:', error);
            return text;
        }
    }
    async function uploadImage(file) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', API_CONFIG.CLOUDINARY.UPLOAD_PRESET);
        const data = await fetch(API_CONFIG.CLOUDINARY.URL, { method: 'POST', body: formData }).then(res => res.json());
        if (data.error) throw new Error(`Cloudinary Upload Error: ${data.error.message}`);
        return data.secure_url;
    }

    async function fetchMyRecipes() {
        DOMElements.myRecipesContainer.innerHTML = '<p><progress></progress></p>';
        try {
            myRecipesCache = await fetchFromApi(`${currentBackendUrl}/recipes`);
            renderRecipeCards(myRecipesCache, 'my', DOMElements.myRecipesContainer);
        } catch (error) { DOMElements.myRecipesContainer.innerHTML = `<p style="color: var(--pico-color-red-500);">Fehler: ${error.message}</p>`; }
    }
    // KORRIGIERTE KATEGORIE-ERSTELLUNG mit Icon-Button
    async function loadDiscoverCategories() {
        DOMElements.discoverContainer.innerHTML = '<p><progress></progress></p>';
        try {
            const result = await fetchFromApi(API_CONFIG.THEMEALDB.CATEGORIES);
            DOMElements.discoverContainer.innerHTML = ''; // Leeren, um Suchergebnisse zu entfernen
            const interestingCategories = ["Vegetarian", "Seafood", "Dessert", "Pasta", "Breakfast", "Chicken"];
            for (const category of result.meals) {
                if (interestingCategories.includes(category.strCategory)) {
                    const categoryDiv = document.createElement('div');
                    categoryDiv.className = 'category-container';
                    const title = await translateText(category.strCategory);
                    // NEU: Nur noch ein Icon-Button statt Text-Button
                    categoryDiv.innerHTML = `
                        <div class="category-header">
                            <h3>${title}</h3>
                            <button class="secondary outline reroll-btn" data-category="${category.strCategory}" title="Neue zufällige Rezepte laden">🎲</button>
                        </div>
                        <div class="category-slider" id="slider-${category.strCategory}"><progress></progress></div>`;
                    DOMElements.discoverContainer.appendChild(categoryDiv);
                    categoryDiv.querySelector('.reroll-btn').addEventListener('click', (e) => {
                        fetchRecipesForCategory(e.target.dataset.category, 5);
                    });
                    fetchRecipesForCategory(category.strCategory, 5);
                }
            }
        } catch (error) { DOMElements.discoverContainer.innerHTML = `<p>Fehler beim Laden der Kategorien.</p>`; }
    }
    async function fetchRecipesForCategory(category) {
    const sliderContainer = document.getElementById(`slider-${category}`);
    sliderContainer.innerHTML = '<progress></progress>';
    try {
        // Wir nutzen wieder die stabile, aber weniger zufällige Kategorie-API
        const result = await fetchFromApi(`https://www.themealdb.com/api/json/v1/1/filter.php?c=${category}`);
        
        // Der Trick für die Zufälligkeit: Wir mischen die erhaltene Liste, bevor wir sie anzeigen!
        const shuffledMeals = result.meals.sort(() => 0.5 - Math.random());
        
        const recipes = shuffledMeals.slice(0, 5).map(meal => ({ // Zeige immer 5 an
            id: meal.idMeal,
            title: meal.strMeal,
            image: meal.strMealThumb,
            type: 'discover-preview' 
        }));
        
        renderRecipeCards(recipes, 'discover', sliderContainer);
    } catch (error) { 
        sliderContainer.innerHTML = `<p>Fehler beim Laden.</p>`; 
    }
}
	
	// NEUE Funktion für die Entdecken-Suche
    async function searchDiscoverRecipes(query) {
        const container = DOMElements.discoverContainer;
        container.innerHTML = '<p><progress></progress></p>';
        try {
            const result = await fetchFromApi(`https://www.themealdb.com/api/json/v1/1/search.php?s=${query}`);
            if (!result.meals) {
                container.innerHTML = '<h3>Suchergebnisse</h3><p>Keine Rezepte für diese Suche gefunden.</p>';
                return;
            }
            const recipes = result.meals.map(meal => formatExternalRecipe(meal));
            container.innerHTML = '<h3>Suchergebnisse</h3><div id="discover-search-results" class="grid-discover"></div>';
            renderRecipeCards(recipes, 'discover', document.getElementById('discover-search-results'));
        } catch (error) { container.innerHTML = `<p>Fehler bei der Suche.</p>`; }
    }

    async function renderRecipeCards(recipes, type, container) {
        container.innerHTML = (!recipes || recipes.length === 0) ? '<p>Keine Rezepte gefunden.</p>' : '';
        if (!recipes) return;
        
        container.innerHTML = ''; // Leere den Container, bevor neue Karten hinzugefügt werden
        for (const recipe of recipes) {
            const card = document.createElement('article');
            // Hier wird die CSS-Klasse dynamisch zugewiesen
            card.className = type === 'discover' ? 'recipe-card-discover' : 'recipe-card';
            card.dataset.recipeId = recipe.id;

            const title = type === 'discover' ? await translateText(recipe.title) : recipe.title;
            const imageUrl = recipe.imageUrl || recipe.image;

            // Hier wird das HTML dynamisch zugewiesen
            if (type === 'discover') {
                card.innerHTML = `
                    <img src="${imageUrl}" alt="${title}">
                    <div class="card-content">
                        <strong>${title}</strong>
                    </div>`;
            } else {
                card.innerHTML = `<header><strong>${title}</strong></header><footer><small>${(recipe.tags || []).join(', ')}</small></footer>`;
            }
            
            card.addEventListener('click', () => handleCardClick(recipe, type));
            container.appendChild(card);
        }
    }
    
    async function handleCardClick(recipe, type) {
        document.querySelectorAll('.recipe-card, .recipe-card-discover').forEach(c => c.classList.remove('selected'));
        const cardElement = document.querySelector(`.recipe-card[data-recipe-id='${recipe.id}'], .recipe-card-discover[data-recipe-id='${recipe.id}']`);
        if (cardElement) cardElement.classList.add('selected');

        let recipeDetails = recipe;
        if (recipe.type === 'discover-preview') {
            DOMElements.contentView.innerHTML = '<article><p><progress></progress> Lade Rezeptdetails...</p></article>';
            try {
                let fullRecipeData;
                if (recipe.missedIngredientCount !== undefined) {
                    fullRecipeData = await fetchFromApi(API_CONFIG.SPOONACULAR.GET_RECIPE_INFO(recipe.id) + `?apiKey=${API_CONFIG.SPOONACULAR.API_KEY}`);
                } else {
                    fullRecipeData = (await fetchFromApi(`${API_CONFIG.THEMEALDB.BY_ID}${recipe.id}`)).meals[0];
                }
                recipeDetails = formatExternalRecipe(fullRecipeData);
                if (!recipeDetails) throw new Error("Rezeptdaten konnten nicht formatiert werden.");
                displayRecipeDetails(recipeDetails, 'discover');
            } catch (error) {
                DOMElements.contentView.innerHTML = `<article><h3>Fehler</h3><p>Die Rezeptdetails konnten nicht geladen werden.</p><small>${error.message}</small></article>`;
            }
        } else {
            displayRecipeDetails(recipe, type);
        }
    }

    // KORRIGIERTE DETAILANSICHT MIT PRAGMATISCHER ÜBERSETZUNG & PORTIONS-FIX
    async function displayRecipeDetails(recipe, type) {
        if (!recipe) {
            DOMElements.contentView.innerHTML = '<article><h3>Fehler</h3><p>Ungültige Rezeptdaten.</p></article>';
            return;
        }

        const title = type === 'discover' ? await translateText(recipe.title) : recipe.title;
        // WICHTIG: Anleitung wird jetzt nicht mehr übersetzt, um den Fehler zu vermeiden
        const instructions = recipe.instructions || 'Keine Anleitung verfügbar.';
        const ingredients = recipe.ingredients ? (type === 'discover' ? await Promise.all((recipe.ingredients).map(async ing => ({ ...ing, name: await translateText(ing.name) }))) : recipe.ingredients) : [];
        const originalServings = recipe.servings > 0 ? recipe.servings : 1;
        
        const renderDetails = (servings) => {
            const imageUrl = recipe.imageUrl || recipe.image;
            DOMElements.contentView.innerHTML = `<article>
                <header><h2>${title}</h2></header>
                ${imageUrl ? `<img src="${imageUrl}" alt="${title}" style="border-radius: var(--pico-border-radius); width: 100%;">` : ''}
                <h4>Zutaten</h4>
                <div class="grid" id="servings-input-container"><label for="servings-input">Portionen:</label><input type="number" id="servings-input" value="${servings}" min="1"></div>
                <ul id="ingredient-list">
                    ${ingredients.map(ing => {
                        const amount = parseFloat(ing.amount);
                        // KORREKTE BERECHNUNG: Nur rechnen, wenn 'amount' eine Zahl ist
                        const calculatedAmount = !isNaN(amount) ? ((amount / originalServings) * servings).toFixed(1).replace('.0', '') : ing.amount;
                        return `<li>${calculatedAmount} ${ing.unit || ''} ${ing.name}</li>`;
                    }).join('')}
                </ul>
                <h4>Anleitung</h4>
                <p style="white-space: pre-wrap;">${instructions}</p>
                ${type === 'my' ? `<footer><div class="grid"><button class="edit-recipe-btn">Bearbeiten</button><button class="delete-recipe-btn secondary">Löschen</button></div></footer>` : ''}
            </article>`;
            
            DOMElements.contentView.querySelector('#servings-input').addEventListener('input', (e) => {
                if (e.target.value > 0) renderDetails(parseInt(e.target.value, 10));
            });
            if (type === 'my') {
                DOMElements.contentView.querySelector('.edit-recipe-btn').addEventListener('click', () => displayRecipeForm(recipe));
                DOMElements.contentView.querySelector('.delete-recipe-btn').addEventListener('click', () => deleteRecipe(recipe.id, recipe.title));
            }
        };
        renderDetails(originalServings);
    }
    
    function displayRecipeForm(recipe = null) {
        const isEditing = recipe !== null;
        DOMElements.contentView.innerHTML = `<article><header><h3>${isEditing ? 'Rezept bearbeiten' : 'Neues Rezept erstellen'}</h3></header><form id="recipe-form"><input type="hidden" id="recipe-id" value="${isEditing ? recipe.id : ''}"><input type="hidden" id="existing-image-url" value="${isEditing && recipe.imageUrl ? recipe.imageUrl : ''}"><label for="title">Titel</label><input type="text" id="title" name="title" value="${isEditing ? recipe.title : ''}" required><label for="image-upload">Rezeptbild</label><input type="file" id="image-upload" name="image-upload" accept="image/*"><img id="image-preview" src="${isEditing && recipe.imageUrl ? recipe.imageUrl : ''}" alt="Bildvorschau" style="${isEditing && recipe.imageUrl ? 'display: block;' : 'display: none;'}"><label for="servings">Portionen</label><input type="number" id="servings" name="servings" value="${isEditing ? recipe.servings || 1 : 1}" min="1" required><label for="instructions">Anleitung</label><textarea id="instructions" name="instructions" rows="10" required>${isEditing ? recipe.instructions : ''}</textarea><label for="tags">Tags (kommagetrennt)</label><input type="text" id="tags" name="tags" value="${isEditing ? (recipe.tags || []).join(', ') : ''}"><fieldset id="ingredients-fieldset"><legend>Zutaten</legend></fieldset><button type="button" id="add-ingredient-btn" class="secondary outline">Zutat hinzufügen</button><hr><button type="submit">${isEditing ? 'Änderungen speichern' : 'Rezept erstellen'}</button></form></article>`;
        document.getElementById('image-upload').addEventListener('change', e => { const preview = document.getElementById('image-preview'); const file = e.target.files[0]; if (file) { preview.src = URL.createObjectURL(file); preview.style.display = 'block'; }});
        const ingredientsFieldset = document.getElementById('ingredients-fieldset');
        const addIngredientField = (ing = {}) => {
            const div = document.createElement('div');
            div.className = 'grid';
            div.innerHTML = `<input type="number" step="any" placeholder="Menge" value="${ing.amount || ''}" class="ingredient-amount"><input type="text" placeholder="Einheit" value="${ing.unit || ''}" class="ingredient-unit"><input type="text" placeholder="Zutat" value="${ing.name || ''}" class="ingredient-name" required><button type="button" class="secondary outline remove-ingredient-btn">X</button>`;
            div.querySelector('.remove-ingredient-btn').addEventListener('click', () => div.remove());
            ingredientsFieldset.appendChild(div);
        };
        if (isEditing && recipe.ingredients?.length > 0) recipe.ingredients.forEach(addIngredientField); else addIngredientField();
        document.getElementById('add-ingredient-btn').addEventListener('click', () => addIngredientField());
        document.getElementById('recipe-form').addEventListener('submit', handleFormSubmit);
    }
    async function handleFormSubmit(event) {
        event.preventDefault();
        const form = event.target;
        const submitButton = form.querySelector('button[type="submit"]');
        submitButton.setAttribute('aria-busy', 'true');
        const id = form.querySelector('#recipe-id').value;
        let imageUrl = form.querySelector('#existing-image-url').value;
        const imageFile = form.querySelector('#image-upload').files[0];
        if (imageFile) { try { imageUrl = await uploadImage(imageFile); } catch (error) { alert('Fehler beim Bild-Upload.'); submitButton.removeAttribute('aria-busy'); return; } }
        const recipeData = { title: form.querySelector('#title').value, servings: parseInt(form.querySelector('#servings').value, 10), instructions: form.querySelector('#instructions').value, imageUrl: imageUrl, tags: form.querySelector('#tags').value.split(',').map(tag => tag.trim()).filter(Boolean), ingredients: Array.from(form.querySelectorAll('#ingredients-fieldset .grid')).map(row => ({ amount: parseFloat(row.querySelector('.ingredient-amount').value) || 0, unit: row.querySelector('.ingredient-unit').value, name: row.querySelector('.ingredient-name').value })).filter(ing => ing.name) };
        try {
            const url = id ? `${currentBackendUrl}/recipes/${id}` : `${currentBackendUrl}/recipes`;
            const method = id ? 'PUT' : 'POST';
            const savedRecipe = await fetchFromApi(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(recipeData) });
            displayRecipeDetails(savedRecipe, 'my');
            await fetchMyRecipes();
            document.querySelector(`.recipe-card[data-recipe-id="${savedRecipe.id}"]`)?.classList.add('selected');
        } catch (error) { alert(`Fehler beim Speichern: ${error.message}`); }
        finally { submitButton.removeAttribute('aria-busy'); }
    }
    async function deleteRecipe(id, title) {
        if (!confirm(`Möchtest du das Rezept "${title}" wirklich löschen?`)) return;
        try {
            await fetchFromApi(`${currentBackendUrl}/recipes/${id}`, { method: 'DELETE' });
            DOMElements.contentView.innerHTML = '<article><h3>Rezept gelöscht.</h3></article>';
            fetchMyRecipes();
        } catch (error) { alert(`Fehler beim Löschen: ${error.message}`); }
    }
    function formatExternalRecipe(data) {
        if (!data) return null;
        if (data.idMeal) { // TheMealDB
            const ingredients = [];
            for (let i = 1; i <= 20; i++) { if (data[`strIngredient${i}`]) ingredients.push({ name: data[`strIngredient${i}`], amount: 1, unit: data[`strMeasure${i}`] });}
            return { id: data.idMeal, title: data.strMeal, instructions: data.strInstructions, image: data.strMealThumb, ingredients, servings: 1, tags: (data.strTags || '').split(',').filter(Boolean) };
        } else { // Spoonacular
            return { id: data.id, title: data.title, instructions: data.instructions, image: data.image, ingredients: data.extendedIngredients.map(i => ({ name: i.name, amount: i.amount, unit: i.unit })), servings: data.servings, tags: data.dishTypes };
        }
    }
    function switchTab(tabName) {
        document.querySelectorAll('.tab-link').forEach(t => t.classList.remove('active'));
        document.querySelector(`.tab-link[data-tab="${tabName}"]`).classList.add('active');
        ['my-recipes-view', 'discover-view', 'restekoch-view'].forEach(id => document.getElementById(id).style.display = 'none');
        DOMElements.contentView.innerHTML = '<article><h3>Willkommen!</h3><p>Wähle links ein Rezept aus oder beginne eine Aktion.</p></article>';
        const view = document.getElementById(`${tabName}-view`);
        if (view) view.style.display = 'block';
        if (tabName === 'my-recipes') fetchMyRecipes();
        else if (tabName === 'discover') loadDiscoverCategories();
    }
    async function handleRestekochSubmit(event) {
        event.preventDefault();
        const form = event.target;
        const button = form.querySelector('button');
        button.setAttribute('aria-busy', 'true');
        DOMElements.restekochContainer.innerHTML = '<p><progress></progress></p>';
        const ingredients = document.getElementById('restekoch-ingredients').value;
        if (!ingredients.trim()) { DOMElements.restekochContainer.innerHTML = ''; button.removeAttribute('aria-busy'); return; }
        try {
            const url = `${API_CONFIG.SPOONACULAR.FIND_BY_INGREDIENTS}?ingredients=${encodeURIComponent(ingredients)}&number=10&ranking=2&apiKey=${API_CONFIG.SPOONACULAR.API_KEY}`;
            const results = await fetchFromApi(url);
            if (!results || results.length === 0) { DOMElements.restekochContainer.innerHTML = '<p>Keine Rezepte für diese Zutatenkombination gefunden.</p>'; return; }
            const recipes = results.map(r => ({ ...r, type: 'discover-preview' }));
            renderRecipeCards(recipes, 'discover', DOMElements.restekochContainer);
        } catch (error) { DOMElements.restekochContainer.innerHTML = `<p style="color: var(--pico-color-red-500);">Fehler bei der Rezeptsuche.</p>`; }
        finally { button.removeAttribute('aria-busy'); }
    }
    
    // === 4. INITIALISIERUNG ===
    function init() {
        document.getElementById('backend-selector').addEventListener('change', (e) => { currentBackendUrl = API_CONFIG.BACKEND[e.target.value]; switchTab('my-recipes'); });
        document.getElementById('new-recipe-btn').addEventListener('click', () => { document.querySelectorAll('.recipe-card, .recipe-card-discover').forEach(c => c.classList.remove('selected')); displayRecipeForm(); });
        document.getElementById('search-input').addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const filtered = myRecipesCache.filter(r => r.title.toLowerCase().includes(searchTerm) || (r.ingredients || []).some(i => i.name.toLowerCase().includes(searchTerm)));
            renderRecipeCards(filtered, 'my', DOMElements.myRecipesContainer);
        });
        document.querySelectorAll('.tab-link').forEach(tab => tab.addEventListener('click', (e) => { e.preventDefault(); switchTab(e.target.dataset.tab); }));
        document.getElementById('restekoch-form').addEventListener('submit', handleRestekochSubmit);
		document.getElementById('discover-search-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const query = e.target.elements.discoverQuery.value;
            if (query) searchDiscoverRecipes(query);
        });
        
        switchTab('my-recipes');
    }
    init();
});