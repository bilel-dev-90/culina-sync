package de.hawhamburg.is.culina_sync_nosql.Repository;

import de.hawhamburg.is.culina_sync_nosql.Model.Recipe;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RecipeRepository extends MongoRepository<Recipe, String> {
    // MongoRepository<Recipe, String> -> Wir verwalten Recipe-Objekte, deren ID vom Typ String ist.

    // Später können wir hier eigene, spezielle Suchfunktionen definieren, z.B.:
    List<Recipe> findByIngredientsNameIgnoreCase(String ingredientName);
    List<Recipe> findByTagsIgnoreCase(String tagName);
}