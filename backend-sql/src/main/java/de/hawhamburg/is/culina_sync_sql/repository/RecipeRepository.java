// in package de.hawhamburg.is.culina_sync_sql.repository

package de.hawhamburg.is.culina_sync_sql.repository;

import de.hawhamburg.is.culina_sync_sql.model.Recipe;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RecipeRepository extends JpaRepository<Recipe, Long> {
    // Spring Data JPA generiert automatisch die Methoden wie findAll(), save(), deleteById() etc.
    // Später kannst du hier eigene Abfragen definieren.
}