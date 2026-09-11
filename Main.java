import java.util.Scanner;
import java.util.UUID;

public class Main {
    private static final Scanner scanner = new Scanner(System.in);
    private static final Library library = new Library();

    public static void main(String[] args) {
        while (true) {
            System.out.println("\n===== LIBRARY QR SYSTEM =====");
            System.out.println("1. Add new book");
            System.out.println("2. List books");
            System.out.println("3. Borrow book (manual ID)");
            System.out.println("4. Return book (manual ID)");
            System.out.println("5. Borrow book (scan QR image)");
            System.out.println("6. Return book (scan QR image)");
            System.out.println("7. Exit");
            System.out.print("Choose option: ");

            int choice = Integer.parseInt(scanner.nextLine());

            switch (choice) {
                case 1 -> addBook();
                case 2 -> library.listBooks();
                case 3 -> manualToggle(true);
                case 4 -> manualToggle(false);
                case 5 -> scanToggle(true);
                case 6 -> scanToggle(false);
                case 7 -> {
                    System.out.println("Goodbye!");
                    return;
                }
                default -> System.out.println("Invalid option.");
            }
        }
    }

    private static void addBook() {
        System.out.print("Enter title: ");
        String title = scanner.nextLine();
        System.out.print("Enter author: ");
        String author = scanner.nextLine();

        String id = "BK" + UUID.randomUUID().toString().substring(0, 8);
        Book book = new Book(id, title, author);
        library.addBook(book);

        try {
            QRCodeGenerator.generate(id, "qrcodes/" + id + ".png");
        } catch (Exception e) {
            System.err.println("QR generation failed: " + e.getMessage());
        }
        System.out.println("Book added: " + book);
    }

    private static void manualToggle(boolean isBorrow) {
        System.out.print("Enter book ID: ");
        String id = scanner.nextLine();
        boolean success = isBorrow ? library.borrowBook(id) : library.returnBook(id);
        System.out.println(success
                ? (isBorrow ? "Book borrowed successfully." : "Book returned successfully.")
                : (isBorrow ? "Borrow failed (book not found or already borrowed)."
                            : "Return failed (book not found or not borrowed)."));
    }

    private static void scanToggle(boolean isBorrow) {
        System.out.print("Enter path to QR image file: ");
        String path = scanner.nextLine();
        try {
            String id = QRCodeScanner.scan(path);
            boolean success = isBorrow ? library.borrowBook(id) : library.returnBook(id);
            System.out.println("QR Code contains ID: " + id);
            System.out.println(success
                    ? (isBorrow ? "Book borrowed successfully." : "Book returned successfully.")
                    : (isBorrow ? "Borrow failed (book not found or already borrowed)."
                                : "Return failed (book not found or not borrowed)."));
        } catch (Exception e) {
            System.err.println("Error reading QR code: " + e.getMessage());
        }
    }
}
