// in package de.hawhamburg.is.culina_sync_nosql.controller
package de.hawhamburg.is.culina_sync_nosql.Controller;

import de.hawhamburg.is.culina_sync_nosql.Model.Recipe;
import de.hawhamburg.is.culina_sync_nosql.Repository.RecipeRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/recipes")
@CrossOrigin(origins = "http://localhost:3000") // Erlaubt Anfragen vom Frontend
public class RecipeController {

    private final RecipeRepository recipeRepository;

    public RecipeController(RecipeRepository recipeRepository) {
        this.recipeRepository = recipeRepository;
    }

    @GetMapping
    public List<Recipe> getAllRecipes(@RequestParam(required = false) String ingredient,
                                      @RequestParam(required = false) String tag) {
        if (ingredient != null) {
            // Wir nutzen die magische Methode aus unserem Repository!
            return recipeRepository.findByIngredientsNameIgnoreCase(ingredient);
        }
        if (tag != null) {
            // Dasselbe für Tags
            return recipeRepository.findByTagsIgnoreCase(tag);
        }
        // Wenn keine Filter gesetzt sind, gib alle Rezepte zurück.
        return recipeRepository.findAll();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Recipe createRecipe(@RequestBody Recipe recipe) {
        // Bei MongoDB müssen wir uns nicht um "recipe.setRecipe()" kümmern.
        // Das Dokument wird einfach so gespeichert, wie es ankommt.
        return recipeRepository.save(recipe);
    }

    @GetMapping("/{id}")
    public Recipe getRecipeById(@PathVariable String id) {
        return recipeRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Rezept nicht gefunden"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Recipe> updateRecipe(@PathVariable String id, @RequestBody Recipe updatedRecipe) {
        return recipeRepository.findById(id)
                .map(recipe -> {
                    // Die ID darf beim Update nicht verändert werden, sie kommt aus dem Pfad.
                    updatedRecipe.setId(id);
                    Recipe savedRecipe = recipeRepository.save(updatedRecipe);
                    return ResponseEntity.ok(savedRecipe);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRecipe(@PathVariable String id) {
        if (!recipeRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        recipeRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}