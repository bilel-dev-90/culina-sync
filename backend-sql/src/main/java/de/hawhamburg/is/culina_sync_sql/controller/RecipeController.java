// in package de.hawhamburg.is.culina_sync_sql.controller;

package de.hawhamburg.is.culina_sync_sql.controller;

import de.hawhamburg.is.culina_sync_sql.model.Recipe;
import de.hawhamburg.is.culina_sync_sql.repository.RecipeRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity; // Besser für Antworten mit Status
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException; // Für Fehler wie 404

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/recipes")
@CrossOrigin(origins = "http://localhost:3000")
public class RecipeController {

    private final RecipeRepository recipeRepository;

    public RecipeController(RecipeRepository recipeRepository) {
        this.recipeRepository = recipeRepository;
    }

    // ========== Bestehende Methoden (leicht verbessert) ==========

    @GetMapping
    public List<Recipe> getAllRecipes(@RequestParam(required = false) String ingredient,
                                      @RequestParam(required = false) String tag) {
        if (ingredient != null) {
            // Findet alle Rezepte und filtert sie nach denen, die die Zutat enthalten.
            return recipeRepository.findAll().stream()
                    .filter(recipe -> recipe.getIngredients().stream()
                            .anyMatch(ing -> ing.getName().equalsIgnoreCase(ingredient)))
                    .collect(Collectors.toList());
        }
        if (tag != null) {
            // Findet alle Rezepte und filtert sie nach denen, die den Tag enthalten.
            return recipeRepository.findAll().stream()
                    .filter(recipe -> recipe.getTags().stream()
                            .anyMatch(t -> t.equalsIgnoreCase(tag)))
                    .collect(Collectors.toList());
        }
        return recipeRepository.findAll();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Recipe createRecipe(@RequestBody Recipe recipe) {
        recipe.getIngredients().forEach(ingredient -> ingredient.setRecipe(recipe));
        return recipeRepository.save(recipe);
    }

    // ========== NEUE METHODEN ==========

    @GetMapping("/{id}")
    public Recipe getRecipeById(@PathVariable Long id) {
        return recipeRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Rezept nicht gefunden"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Recipe> updateRecipe(@PathVariable Long id, @RequestBody Recipe updatedRecipe) {
        return recipeRepository.findById(id)
                .map(recipe -> {
                    recipe.setTitle(updatedRecipe.getTitle());
                    recipe.setInstructions(updatedRecipe.getInstructions());
                    // Komplexe Logik zum Aktualisieren der Zutaten und Tags wäre hier nötig.
                    // Für das Projekt reicht diese einfache Version.
                    // Wichtig: Die ID und Beziehungen müssen erhalten bleiben.

                    // Zutaten aktualisieren (einfacher Ansatz: alte löschen, neue hinzufügen)
                    recipe.getIngredients().clear();
                    updatedRecipe.getIngredients().forEach(ingredient -> {
                        ingredient.setRecipe(recipe);
                        recipe.getIngredients().add(ingredient);
                    });

                    // Tags aktualisieren
                    recipe.setTags(updatedRecipe.getTags());

                    Recipe savedRecipe = recipeRepository.save(recipe);
                    return ResponseEntity.ok(savedRecipe);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRecipe(@PathVariable Long id) {
        if (!recipeRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        recipeRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}