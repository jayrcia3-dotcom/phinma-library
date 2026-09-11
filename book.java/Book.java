public class Book {
    private String id;
    private String title;
    private String author;
    private boolean borrowed;

    public Book(String id, String title, String author) {
        this.id = id;
        this.title = title;
        this.author = author;
        this.borrowed = false;
    }

    public String getId() { return id; }
    public String getTitle() { return title; }
    public String getAuthor() { return author; }
    public boolean isBorrowed() { return borrowed; }
    public void setBorrowed(boolean borrowed) { this.borrowed = borrowed; }

    @Override
    public String toString() {
        return String.format("ID: %s | %s by %s | %s",
                id, title, author, borrowed ? "BORROWED" : "AVAILABLE");
    }
}