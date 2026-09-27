export const STAFF_ACCOUNTS = [
  { id: "st-ad1", name: "Admin Lead", username: "admin1", pin: "1234", altPin: "1234", password: "1234", role: "admin", privacyPin: "9999", branchId: "branch-def" },
  { id: "st-ad2", name: "Admin Operations", username: "admin2", pin: "1234", altPin: "1234", password: "1234", role: "admin", privacyPin: "9999", branchId: "branch-def" },
  { id: "st-ad3", name: "Admin Finance", username: "admin3", pin: "1234", altPin: "1234", password: "1234", role: "admin", privacyPin: "9999", branchId: "branch-def" },
  { id: "st-mgr1", name: "Manager Tariq (Defence)", username: "mgr_def", pin: "2222", altPin: "5555", password: "2222", role: "manager", privacyPin: "8888", branchId: "branch-def" },
  { id: "st-mgr2", name: "Manager Bilal (Qasimabad)", username: "mgr_qas", pin: "2222", altPin: "2222", password: "2222", role: "manager", privacyPin: "8888", branchId: "branch-qas" },
  { id: "st-ktc1", name: "Chef Subhan (Defence)", username: "ktc_def", pin: "1111", altPin: "4444", password: "1111", role: "kitchen", privacyPin: "7777", branchId: "branch-def" },
  { id: "st-ktc2", name: "Chef Usama (Qasimabad)", username: "ktc_qas", pin: "1111", altPin: "1111", password: "1111", role: "kitchen", privacyPin: "7777", branchId: "branch-qas" }
];

export const publicStaffSession = (user) => ({
  id: user.id,
  username: user.username,
  name: user.name,
  role: user.role,
  branchId: user.branchId,
  privacyPin: user.privacyPin || "9999"
});

export function authenticateStaff({ role, pin, username, password, branchId }) {
  const expectedRole = String(role || "").toLowerCase();
  if (!["kitchen", "manager", "admin"].includes(expectedRole)) {
    return { success: false, message: "Unknown portal role." };
  }

  const pinValue = String(pin || password || "").trim();
  const userValue = String(username || "").trim().toLowerCase();

  // Strict check: PIN or password MUST not be empty or whitespace
  if (!pinValue) {
    return { success: false, message: "Authentication PIN is strictly required. Access denied." };
  }

  if (expectedRole === "kitchen") {
    if (!/^\d{4}$/.test(pinValue)) {
      return { success: false, message: "Kitchen access requires a valid 4-digit numeric PIN." };
    }
    const matches = STAFF_ACCOUNTS.filter(
      (s) => s.role === "kitchen" && (s.pin === pinValue || s.altPin === pinValue)
    );
    if (!matches.length) {
      return { success: false, message: "Invalid Kitchen PIN code. Access denied." };
    }
    const user = (branchId && matches.find((s) => s.branchId === branchId)) || matches[0];
    return { success: true, user: publicStaffSession(user) };
  }

  if (expectedRole === "manager") {
    if (!/^\d{4}$/.test(pinValue)) {
      return { success: false, message: "Manager access requires a valid 4-digit numeric PIN." };
    }
    let matches = STAFF_ACCOUNTS.filter(
      (s) => s.role === "manager" && (s.pin === pinValue || s.altPin === pinValue)
    );
    if (userValue) {
      matches = matches.filter((s) => s.username.toLowerCase() === userValue);
    }
    if (!matches.length) {
      return { success: false, message: "Invalid Manager PIN or credentials. Access denied." };
    }
    const user = (branchId && matches.find((s) => s.branchId === branchId)) || matches[0];
    return { success: true, user: publicStaffSession(user) };
  }

  if (expectedRole === "admin") {
    if (!userValue) {
      return { success: false, message: "Enter Super Admin username." };
    }
    if (!pinValue || pinValue.length < 4) {
      return { success: false, message: "Enter Super Admin password (minimum 4 characters)." };
    }

    const user = STAFF_ACCOUNTS.find(
      (s) =>
        s.role === "admin" &&
        s.username.toLowerCase() === userValue &&
        (s.password === pinValue || s.pin === pinValue || s.altPin === pinValue)
    );

    if (!user) {
      return { success: false, message: "Invalid Super Admin username or password. Access denied." };
    }

    return { success: true, user: publicStaffSession(user) };
  }

  return { success: false, message: "Unauthorized request." };
}

