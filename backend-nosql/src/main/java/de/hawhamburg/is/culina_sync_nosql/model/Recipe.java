package de.hawhamburg.is.culina_sync_nosql.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.ArrayList;
import java.util.List;

@Document(collection = "recipes")
public class Recipe {

    @Id
    private String id;

    private String title;
    private String instructions;
    private int servings;

    // NEU: Feld für die Bild-URL
    private String imageUrl;

    private List<Ingredient> ingredients = new ArrayList<>();
    private List<String> tags = new ArrayList<>();

    // --- Getter und Setter ---
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getInstructions() { return instructions; }
    public void setInstructions(String instructions) { this.instructions = instructions; }
    public int getServings() { return servings; }
    public void setServings(int servings) { this.servings = servings; }

    // NEU: Getter und Setter für imageUrl
    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public List<Ingredient> getIngredients() { return ingredients; }
    public void setIngredients(List<Ingredient> ingredients) { this.ingredients = ingredients; }
    public List<String> getTags() { return tags; }
    public void setTags(List<String> tags) { this.tags = tags; }
}