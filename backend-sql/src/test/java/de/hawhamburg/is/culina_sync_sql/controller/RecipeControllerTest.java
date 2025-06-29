package de.hawhamburg.is.culina_sync_sql.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import de.hawhamburg.is.culina_sync_sql.model.Ingredient;
import de.hawhamburg.is.culina_sync_sql.model.Recipe;
import de.hawhamburg.is.culina_sync_sql.repository.RecipeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest // Startet den kompletten Spring-Kontext für den Test
@AutoConfigureMockMvc // Konfiguriert MockMvc, um HTTP-Anfragen zu simulieren
@Transactional // Sorgt dafür, dass jeder Test in einer eigenen Transaktion läuft und am Ende zurückgerollt wird
class RecipeControllerTest {

    @Autowired
    private MockMvc mockMvc; // Unser Werkzeug, um HTTP-Requests zu senden

    @Autowired
    private RecipeRepository recipeRepository; // Direkter Zugriff auf die (Test-)DB

    @Autowired
    private ObjectMapper objectMapper; // Wandelt Java-Objekte in JSON um und umgekehrt

    private Recipe testRecipe;

    // Diese Methode wird vor JEDEM Test ausgeführt
    @BeforeEach
    void setUp() {
        // Bereinige die Datenbank vor jedem Test, um saubere Bedingungen zu schaffen
        recipeRepository.deleteAll();

        // Erstelle ein Standard-Testobjekt, das wir in vielen Tests verwenden können
        testRecipe = new Recipe();
        testRecipe.setTitle("Spaghetti Carbonara");
        testRecipe.setInstructions("Pasta kochen und mit Ei, Käse und Speck mischen.");
        testRecipe.setServings(2);

        Ingredient spaghetti = new Ingredient();
        spaghetti.setName("Spaghetti");
        spaghetti.setAmount(200);
        spaghetti.setUnit("g");
        spaghetti.setRecipe(testRecipe); // Wichtig für die beidseitige Beziehung

        testRecipe.getIngredients().add(spaghetti);
        testRecipe.getTags().add("italienisch");
    }

    @Test
    @DisplayName("POST /api/recipes - Sollte ein neues Rezept erstellen und Status 201 zurückgeben")
    void shouldCreateNewRecipe() throws Exception {
        mockMvc.perform(post("/api/recipes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(testRecipe)))
                .andExpect(status().isCreated()) // Erwartet HTTP-Status 201 Created
                .andExpect(jsonPath("$.id").exists()) // Erwartet, dass die Antwort eine ID hat
                .andExpect(jsonPath("$.title", is("Spaghetti Carbonara"))) // Erwartet den korrekten Titel
                .andExpect(jsonPath("$.ingredients[0].name", is("Spaghetti"))); // Prüft eine Zutat
    }

    @Test
    @DisplayName("GET /api/recipes - Sollte eine Liste von Rezepten zurückgeben")
    void shouldReturnListOfRecipes() throws Exception {
        // Speichere zuerst ein Rezept in der Test-DB
        recipeRepository.save(testRecipe);

        mockMvc.perform(get("/api/recipes"))
                .andExpect(status().isOk()) // Erwartet HTTP-Status 200 OK
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$", hasSize(1))) // Erwartet, dass das Array ein Element hat
                .andExpect(jsonPath("$[0].title", is("Spaghetti Carbonara")));
    }

    @Test
    @DisplayName("GET /api/recipes/{id} - Sollte ein einzelnes Rezept zurückgeben")
    void shouldReturnSingleRecipeById() throws Exception {
        Recipe savedRecipe = recipeRepository.save(testRecipe);
        Long recipeId = savedRecipe.getId();

        mockMvc.perform(get("/api/recipes/{id}", recipeId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(recipeId.intValue())))
                .andExpect(jsonPath("$.title", is("Spaghetti Carbonara")));
    }

    @Test
    @DisplayName("GET /api/recipes/{id} - Sollte Status 404 zurückgeben, wenn Rezept nicht existiert")
    void shouldReturn404ForNonExistentRecipe() throws Exception {
        mockMvc.perform(get("/api/recipes/{id}", 999L)) // Eine ID, die sicher nicht existiert
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("PUT /api/recipes/{id} - Sollte ein bestehendes Rezept aktualisieren")
    void shouldUpdateExistingRecipe() throws Exception {
        Recipe savedRecipe = recipeRepository.save(testRecipe);
        Long recipeId = savedRecipe.getId();

        // Erstelle das aktualisierte Objekt
        savedRecipe.setTitle("Carbonara Deluxe");

        mockMvc.perform(put("/api/recipes/{id}", recipeId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(savedRecipe)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title", is("Carbonara Deluxe")));
    }

    @Test
    @DisplayName("DELETE /api/recipes/{id} - Sollte ein Rezept löschen und Status 204 zurückgeben")
    void shouldDeleteRecipe() throws Exception {
        Recipe savedRecipe = recipeRepository.save(testRecipe);
        Long recipeId = savedRecipe.getId();

        mockMvc.perform(delete("/api/recipes/{id}", recipeId))
                .andExpect(status().isNoContent()); // Erwartet HTTP-Status 204 No Content

        // Optional: Prüfen, ob das Rezept wirklich aus der DB verschwunden ist
        mockMvc.perform(get("/api/recipes/{id}", recipeId))
                .andExpect(status().isNotFound());
    }
}