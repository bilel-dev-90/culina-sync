package de.hawhamburg.is.culina_sync_nosql.Model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.ArrayList;
import java.util.List;

@Document(collection = "recipes") // Sagt Spring: Dies ist ein MongoDB-Dokument
public class Recipe {

    @Id // Markiert dieses Feld als die eindeutige ID des Dokuments
    private String id; // Bei MongoDB ist die ID typischerweise ein String

    private String title;
    private String instructions;

    // Die Zutaten sind einfach eine Liste von Objekten, die direkt
    // im Rezept-Dokument mit gespeichert wird.
    private List<Ingredient> ingredients = new ArrayList<>();

    // Tags sind ebenfalls nur eine einfache Liste von Strings.
    private List<String> tags = new ArrayList<>();

    // Getter und Setter...
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getInstructions() { return instructions; }
    public void setInstructions(String instructions) { this.instructions = instructions; }
    public List<Ingredient> getIngredients() { return ingredients; }
    public void setIngredients(List<Ingredient> ingredients) { this.ingredients = ingredients; }
    public List<String> getTags() { return tags; }
    public void setTags(List<String> tags) { this.tags = tags; }
}