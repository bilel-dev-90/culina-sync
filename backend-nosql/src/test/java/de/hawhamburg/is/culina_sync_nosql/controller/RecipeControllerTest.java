package de.hawhamburg.is.culina_sync_nosql.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import de.hawhamburg.is.culina_sync_nosql.model.Ingredient;
import de.hawhamburg.is.culina_sync_nosql.model.Recipe;
import de.hawhamburg.is.culina_sync_nosql.repository.RecipeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest // Startet den kompletten Spring-Kontext für den Test
@AutoConfigureMockMvc // Konfiguriert MockMvc für HTTP-Anfragen
class RecipeControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private RecipeRepository recipeRepository;

    @Autowired
    private ObjectMapper objectMapper;

    private Recipe testRecipe;

    // Diese Methode wird vor JEDEM Test ausgeführt
    @BeforeEach
    void setUp() {
        // Bereinige die MongoDB-Testdatenbank vor jedem Test
        recipeRepository.deleteAll();

        // Erstelle ein Standard-Testobjekt
        testRecipe = new Recipe();
        testRecipe.setTitle("Pancakes");
        testRecipe.setInstructions("Mehl, Eier und Milch mischen und in der Pfanne backen.");
        testRecipe.setServings(4);

        Ingredient flour = new Ingredient();
        flour.setName("Mehl");
        flour.setAmount(250);
        flour.setUnit("g");

        testRecipe.getIngredients().add(flour);
        testRecipe.getTags().add("Frühstück");
        testRecipe.getTags().add("süß");
    }

    @Test
    @DisplayName("POST /api/recipes - Sollte ein neues Rezept erstellen und Status 201 zurückgeben")
    void shouldCreateNewRecipe() throws Exception {
        mockMvc.perform(post("/api/recipes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(testRecipe)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.title", is("Pancakes")))
                .andExpect(jsonPath("$.ingredients[0].name", is("Mehl")));
    }

    @Test
    @DisplayName("GET /api/recipes - Sollte eine Liste von Rezepten zurückgeben")
    void shouldReturnListOfRecipes() throws Exception {
        recipeRepository.save(testRecipe);

        mockMvc.perform(get("/api/recipes"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].title", is("Pancakes")));
    }

    @Test
    @DisplayName("GET /api/recipes/{id} - Sollte ein einzelnes Rezept zurückgeben")
    void shouldReturnSingleRecipeById() throws Exception {
        Recipe savedRecipe = recipeRepository.save(testRecipe);
        String recipeId = savedRecipe.getId(); // Die ID ist ein String

        mockMvc.perform(get("/api/recipes/{id}", recipeId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(recipeId)))
                .andExpect(jsonPath("$.title", is("Pancakes")));
    }

    @Test
    @DisplayName("GET /api/recipes/{id} - Sollte Status 404 zurückgeben, wenn Rezept nicht existiert")
    void shouldReturn404ForNonExistentRecipe() throws Exception {
        mockMvc.perform(get("/api/recipes/{id}", "nonExistentId123"))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("PUT /api/recipes/{id} - Sollte ein bestehendes Rezept aktualisieren")
    void shouldUpdateExistingRecipe() throws Exception {
        Recipe savedRecipe = recipeRepository.save(testRecipe);
        String recipeId = savedRecipe.getId();

        // Erstelle das aktualisierte Objekt
        savedRecipe.setTitle("Fluffy American Pancakes");

        mockMvc.perform(put("/api/recipes/{id}", recipeId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(savedRecipe)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title", is("Fluffy American Pancakes")));
    }

    @Test
    @DisplayName("DELETE /api/recipes/{id} - Sollte ein Rezept löschen und Status 204 zurückgeben")
    void shouldDeleteRecipe() throws Exception {
        Recipe savedRecipe = recipeRepository.save(testRecipe);
        String recipeId = savedRecipe.getId();

        mockMvc.perform(delete("/api/recipes/{id}", recipeId))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/recipes/{id}", recipeId))
                .andExpect(status().isNotFound());
    }
}