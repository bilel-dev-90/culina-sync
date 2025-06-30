// features/restekoch.js

const SPOONACULAR_CONFIG = {
    API_KEY: '58edc64606ae4e66a0026d8c418dd9d8',
    FIND_BY_INGREDIENTS: 'https://api.spoonacular.com/recipes/findByIngredients',
    GET_RECIPE_INFO: (id) => `https://api.spoonacular.com/recipes/${id}/information`
};

async function fetchApi(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error('API request failed');
    return response.json();
}

export async function handleRestekochSubmit(event, renderCardsFn, displayDetailsFn) {
    event.preventDefault();
    const form = event.target;
    const button = form.querySelector('button');
    const resultsContainer = document.getElementById('restekoch-results-container');
    
    button.setAttribute('aria-busy', 'true');
    resultsContainer.innerHTML = '<p><progress></progress></p>';

    const ingredients = document.getElementById('restekoch-ingredients').value;
    if (!ingredients.trim()) {
        resultsContainer.innerHTML = '';
        button.removeAttribute('aria-busy');
        return;
    }

    try {
        const url = `${SPOONACULAR_CONFIG.FIND_BY_INGREDIENTS}?ingredients=${encodeURIComponent(ingredients)}&number=10&apiKey=${SPOONACULAR_CONFIG.API_KEY}`;
        const results = await fetchApi(url);
        
        if (!results || results.length === 0) {
            resultsContainer.innerHTML = '<p>Keine Rezepte für diese Zutatenkombination gefunden.</p>';
            return;
        }

        const recipes = results.map(r => ({ ...r, type: 'discover-preview' }));
        renderCardsFn(recipes, 'discover', resultsContainer, displayDetailsFn);

    } catch (error) {
        resultsContainer.innerHTML = `<p>Fehler bei der Rezeptsuche.</p>`;
    } finally {
        button.removeAttribute('aria-busy');
    }
}