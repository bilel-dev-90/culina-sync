// features/discover.js

const API = {
    CATEGORIES: 'https://www.themealdb.com/api/json/v1/1/list.php?c=list',
    BY_CATEGORY: 'https://www.themealdb.com/api/json/v1/1/filter.php?c=',
    TRANSLATE: 'https://api.mymemory.translated.net/get'
};

async function fetchApi(url) { /* ... bleibt gleich ... */ }
async function translateText(text) { /* ... bleibt gleich ... */ }

// Diese Funktion rendert EINEN Slider für EINE Kategorie
async function renderCategorySlider(categoryName, container, renderCardsFn) {
    const sliderDiv = document.createElement('div');
    sliderDiv.className = 'category-slider';
    sliderDiv.innerHTML = '<progress></progress>';
    
    const title = document.createElement('h3');
    title.textContent = await translateText(categoryName);
    
    container.appendChild(title);
    container.appendChild(sliderDiv);

    try {
        const result = await fetchApi(`${API.BY_CATEGORY}${categoryName}`);
        const recipes = result.meals.slice(0, 10).map(meal => ({ ...meal, id: meal.idMeal, title: meal.strMeal, image: meal.strMealThumb, type: 'discover-preview' }));
        renderCardsFn(recipes, 'discover', sliderDiv); // Rendert direkt in den Slider
    } catch (error) {
        sliderDiv.innerHTML = `<p>Fehler beim Laden von ${categoryName}.</p>`;
    }
}

export async function initDiscoverTab(renderCardsFn) {
    const container = document.getElementById('discover-category-container');
    container.innerHTML = '<p><progress></progress></p>';
    try {
        const result = await fetchApi(API.CATEGORIES);
        container.innerHTML = '';
        const interestingCategories = ["Vegetarian", "Seafood", "Dessert", "Pasta", "Breakfast", "Chicken"];
        
        for (const category of result.meals) {
            if (interestingCategories.includes(category.strCategory)) {
                // Erstellt für jede Kategorie einen eigenen Slider
                await renderCategorySlider(category.strCategory, container, renderCardsFn);
            }
        }
    } catch (error) {
        container.innerHTML = `<p>Fehler beim Laden der Kategorien.</p>`;
    }
}