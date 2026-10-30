package vn.codegrade.model;

/** Public account projection. Password hashes and session tokens never enter it. */
public record User(
    String id, String username, String displayName, String role, int elo, int wins, String email) {
  public boolean admin() {
    return role.equals("ADMIN");
  }

  public boolean author() {
    return admin() || role.equals("AUTHOR");
  }

  public boolean coder() {
    return role.equals("CODER");
  }
}
