import java.util.ArrayList;
import java.util.List;

public class Library {
    private List<Book> books = new ArrayList<>();

    public void addBook(Book book) {
        books.add(book);
    }

    public List<Book> getBooks() {
        return books;
    }

    public Book findById(String id) {
        return books.stream()
                .filter(b -> b.getId().equals(id))
                .findFirst()
                .orElse(null);
    }

    public boolean borrowBook(String id) {
        Book book = findById(id);
        if (book == null || book.isBorrowed()) return false;
        book.setBorrowed(true);
        return true;
    }

    public boolean returnBook(String id) {
        Book book = findById(id);
        if (book == null || !book.isBorrowed()) return false;
        book.setBorrowed(false);
        return true;
    }

    public void listBooks() {
        if (books.isEmpty()) {
            System.out.println("No books in library.");
            return;
        }
        books.forEach(System.out::println);
    }
}