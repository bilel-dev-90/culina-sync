document.addEventListener('DOMContentLoaded', () => {
    // === GLOBALE VARIABLEN & KONSTANTEN ===
    const BACKEND_URLS = {
        sql: 'http://localhost:8080/api',
        nosql: 'http://localhost:8081/api'
    };
    let currentBackendUrl = BACKEND_URLS.sql;
    let allRecipes = []; // Ein lokaler Cache für alle Rezepte zur schnellen Filterung

    // === DOM-ELEMENTE ===
    const backendSelector = document.getElementById('backend-selector');
    const newRecipeBtn = document.getElementById('new-recipe-btn');
    const searchInput = document.getElementById('search-input');
    const recipeListContainer = document.getElementById('recipe-list-container');
    const contentView = document.getElementById('content-view');

    // === FUNKTIONEN ===

    /**
     * Lädt alle Rezepte vom aktuell ausgewählten Backend.
     */
    async function loadRecipes() {
        recipeListContainer.innerHTML = '<p><progress></progress> Lade Rezepte...</p>';
        try {
            const response = await fetch(`${currentBackendUrl}/recipes`);
            if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
            allRecipes = await response.json();
            renderRecipeCards(allRecipes);
        } catch (error) {
            recipeListContainer.innerHTML = `<p style="color: var(--pico-color-red-500);">Fehler beim Laden der Rezepte: ${error.message}</p>`;
            console.error('Fetch error:', error);
        }
    }

    /**
     * Rendert die Rezept-Karten in der linken Spalte.
     * @param {Array} recipes - Das Array der zu rendernden Rezepte.
     */
    function renderRecipeCards(recipes) {
        recipeListContainer.innerHTML = '';
        if (recipes.length === 0) {
            recipeListContainer.innerHTML = '<p>Keine Rezepte gefunden.</p>';
            return;
        }

        recipes.forEach(recipe => {
            const card = document.createElement('article');
            card.className = 'recipe-card';
            card.dataset.recipeId = recipe.id;
            card.innerHTML = `
                <header><strong>${recipe.title}</strong></header>
                <footer><small>${recipe.tags.join(', ')}</small></footer>
            `;

            card.addEventListener('click', () => {
                document.querySelectorAll('.recipe-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                displayRecipeDetails(recipe);
            });
            recipeListContainer.appendChild(card);
        });
    }

    /**
     * Zeigt die Details eines ausgewählten Rezepts in der rechten Spalte an.
     * @param {Object} recipe - Das Rezept-Objekt.
     */
    function displayRecipeDetails(recipe) {
        contentView.innerHTML = `
            <article>
                <header>
                    <h2>${recipe.title}</h2>
                </header>
                <h4>Zutaten</h4>
                <ul>
                    ${recipe.ingredients.map(ing => `<li>${ing.amount} ${ing.unit || ''} ${ing.name}</li>`).join('')}
                </ul>
                <h4>Anleitung</h4>
                <p style="white-space: pre-wrap;">${recipe.instructions}</p>
                <footer>
                    <div class="grid">
                        <button class="edit-recipe-btn" data-recipe-id="${recipe.id}">Bearbeiten</button>
                        <button class="delete-recipe-btn secondary" data-recipe-id="${recipe.id}">Löschen</button>
                    </div>
                </footer>
            </article>
        `;
        // Event-Listener für die neuen Buttons hinzufügen
        contentView.querySelector('.edit-recipe-btn').addEventListener('click', () => displayRecipeForm(recipe));
        contentView.querySelector('.delete-recipe-btn').addEventListener('click', () => deleteRecipe(recipe.id, recipe.title));
    }

    /**
     * Zeigt das Formular zum Erstellen oder Bearbeiten eines Rezepts an.
     * @param {Object|null} recipe - Das Rezept-Objekt zum Bearbeiten oder null für ein neues Rezept.
     */
    function displayRecipeForm(recipe = null) {
        const isEditing = recipe !== null;
        contentView.innerHTML = `
            <article>
                <header><h3>${isEditing ? 'Rezept bearbeiten' : 'Neues Rezept erstellen'}</h3></header>
                <form id="recipe-form">
                    <input type="hidden" id="recipe-id" value="${isEditing ? recipe.id : ''}">
                    <label for="title">Titel</label>
                    <input type="text" id="title" name="title" value="${isEditing ? recipe.title : ''}" required>
                    <label for="instructions">Anleitung</label>
                    <textarea id="instructions" name="instructions" rows="10" required>${isEditing ? recipe.instructions : ''}</textarea>
                    <label for="tags">Tags (kommagetrennt)</label>
                    <input type="text" id="tags" name="tags" value="${isEditing ? recipe.tags.join(', ') : ''}">
                    <fieldset id="ingredients-fieldset">
                        <legend>Zutaten</legend>
                    </fieldset>
                    <button type="button" id="add-ingredient-btn" class="secondary outline">Zutat hinzufügen</button>
                    <hr>
                    <button type="submit">${isEditing ? 'Änderungen speichern' : 'Rezept erstellen'}</button>
                </form>
            </article>
        `;

        const ingredientsFieldset = document.getElementById('ingredients-fieldset');

        const addIngredientField = (ingredient = { name: '', amount: '', unit: '' }) => {
            const div = document.createElement('div');
            div.className = 'grid';
            div.innerHTML = `
                <input type="text" placeholder="Menge" value="${ingredient.amount}" class="ingredient-amount">
                <input type="text" placeholder="Einheit" value="${ingredient.unit}" class="ingredient-unit">
                <input type="text" placeholder="Zutat" value="${ingredient.name}" class="ingredient-name" required>
                <button type="button" class="secondary outline remove-ingredient-btn">X</button>
            `;
            div.querySelector('.remove-ingredient-btn').addEventListener('click', () => div.remove());
            ingredientsFieldset.appendChild(div);
        };

        // Bestehende Zutaten hinzufügen oder ein leeres Feld für neue Rezepte
        if (isEditing && recipe.ingredients.length > 0) {
            recipe.ingredients.forEach(addIngredientField);
        } else {
            addIngredientField();
        }

        document.getElementById('add-ingredient-btn').addEventListener('click', () => addIngredientField());
        document.getElementById('recipe-form').addEventListener('submit', handleFormSubmit);
    }

    /**
     * Verarbeitet das Absenden des Rezeptformulars (Erstellen oder Aktualisieren).
     * @param {Event} event - Das Submit-Event.
     */
    async function handleFormSubmit(event) {
        event.preventDefault();
        const form = event.target;
        const id = form.querySelector('#recipe-id').value;
        const isEditing = id !== '';

        const ingredients = Array.from(form.querySelectorAll('#ingredients-fieldset .grid')).map(row => ({
            amount: parseFloat(row.querySelector('.ingredient-amount').value) || 0,
            unit: row.querySelector('.ingredient-unit').value,
            name: row.querySelector('.ingredient-name').value,
        })).filter(ing => ing.name); // Nur Zutaten mit Namen übernehmen

        const recipeData = {
            title: form.querySelector('#title').value,
            instructions: form.querySelector('#instructions').value,
            tags: form.querySelector('#tags').value.split(',').map(tag => tag.trim()).filter(Boolean),
            ingredients: ingredients
        };

        const url = isEditing ? `${currentBackendUrl}/recipes/${id}` : `${currentBackendUrl}/recipes`;
        const method = isEditing ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(recipeData)
            });
            if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
            
            const savedRecipe = await response.json();
            displayRecipeDetails(savedRecipe); // Zeige das gespeicherte/aktualisierte Rezept an
            loadRecipes(); // Lade die linke Liste neu
        } catch (error) {
            alert(`Fehler beim Speichern des Rezepts: ${error.message}`);
        }
    }
    
    /**
     * Löscht ein Rezept nach Bestätigung.
     * @param {string|number} id - Die ID des zu löschenden Rezepts.
     * @param {string} title - Der Titel des Rezepts für die Bestätigungsnachricht.
     */
    async function deleteRecipe(id, title) {
        if (!confirm(`Möchtest du das Rezept "${title}" wirklich löschen?`)) {
            return;
        }

        try {
            const response = await fetch(`${currentBackendUrl}/recipes/${id}`, { method: 'DELETE' });
            if (!response.ok && response.status !== 204) throw new Error(`HTTP Error: ${response.status}`);
            
            contentView.innerHTML = '<article><h3>Rezept gelöscht.</h3><p>Wähle links ein Rezept aus oder erstelle ein neues.</p></article>';
            loadRecipes();
        } catch (error) {
            alert(`Fehler beim Löschen des Rezepts: ${error.message}`);
        }
    }


    // === EVENT LISTENERS ===

    // Backend wechseln
    backendSelector.addEventListener('change', (event) => {
        currentBackendUrl = BACKEND_URLS[event.target.value];
        console.log(`Backend gewechselt zu: ${event.target.value.toUpperCase()}`);
        contentView.innerHTML = '<article><h3>Willkommen!</h3><p>Wähle links ein Rezept aus oder erstelle ein neues.</p></article>';
        loadRecipes();
    });

    // "Neues Rezept"-Button
    newRecipeBtn.addEventListener('click', () => {
        document.querySelectorAll('.recipe-card').forEach(c => c.classList.remove('selected'));
        displayRecipeForm();
    });

    // Live-Suche
    searchInput.addEventListener('input', (event) => {
        const searchTerm = event.target.value.toLowerCase();
        const filteredRecipes = allRecipes.filter(recipe => 
            recipe.title.toLowerCase().includes(searchTerm) ||
            recipe.ingredients.some(ing => ing.name.toLowerCase().includes(searchTerm))
        );
        renderRecipeCards(filteredRecipes);
    });

    // === INITIALISIERUNG ===
    loadRecipes();
});