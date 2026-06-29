import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;

public class TestDB {
    public static void main(String[] args) {
        String url = "jdbc:postgresql://db.jgfmhqhoozvjjwnphctm.supabase.co:5432/postgres";
        String user = "postgres";
        String pass = "Alokisvinay@2006";

        try (Connection conn = DriverManager.getConnection(url, user, pass);
             Statement stmt = conn.createStatement()) {

            System.out.println("--- USERS ---");
            ResultSet rs = stmt.executeQuery("SELECT * FROM users");
            while (rs.next()) {
                System.out.println("ID: " + rs.getLong("id") + ", Email: " + rs.getString("email"));
            }

            System.out.println("--- ASSETS COLUMNS ---");
            ResultSet rsAssets = stmt.executeQuery("SELECT * FROM assets LIMIT 1");
            java.sql.ResultSetMetaData rsmd = rsAssets.getMetaData();
            int columnCount = rsmd.getColumnCount();
            for (int i = 1; i <= columnCount; i++ ) {
                System.out.println(rsmd.getColumnName(i) + " (" + rsmd.getColumnTypeName(i) + ")");
            }

        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
