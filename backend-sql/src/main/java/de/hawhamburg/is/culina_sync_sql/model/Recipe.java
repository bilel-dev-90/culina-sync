// in package de.hawhamburg.is.culina_sync_sql.model
package de.hawhamburg.is.culina_sync_sql.model;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

// @Entity für SQL-Tabellen
@Entity
@Table(name = "recipes")
public class Recipe {

    // JPA-Annotationen für die ID
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    @Column(columnDefinition = "TEXT")
    private String instructions;

    private int servings;

    // JPA-Beziehung für die Zutaten
    @OneToMany(mappedBy = "recipe", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<Ingredient> ingredients = new ArrayList<>();

    // JPA-Annotation für eine einfache Sammlung
    @ElementCollection(fetch = FetchType.EAGER)
    private List<String> tags = new ArrayList<>();

    // --- Getter und Setter ---
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getInstructions() { return instructions; }
    public void setInstructions(String instructions) { this.instructions = instructions; }
    public int getServings() { return servings; }
    public void setServings(int servings) { this.servings = servings; }
    public List<Ingredient> getIngredients() { return ingredients; }
    public void setIngredients(List<Ingredient> ingredients) { this.ingredients = ingredients; }
    public List<String> getTags() { return tags; }
    public void setTags(List<String> tags) { this.tags = tags; }
}