export const STAFF_ACCOUNTS = [
  { id: "st-ad1", name: "Admin Lead", username: "admin1", pin: "1234", password: "1234", role: "admin", privacyPin: "9999", branchId: "branch-def" },
  { id: "st-ad2", name: "Admin Operations", username: "admin2", pin: "1234", password: "1234", role: "admin", privacyPin: "9999", branchId: "branch-def" },
  { id: "st-ad3", name: "Admin Finance", username: "admin3", pin: "1234", password: "1234", role: "admin", privacyPin: "9999", branchId: "branch-def" },
  { id: "st-mgr1", name: "Manager Tariq", username: "mgr_def", pin: "5555", password: "5555", role: "manager", privacyPin: "8888", branchId: "branch-def" },
  { id: "st-mgr2", name: "Manager Bilal", username: "mgr_qas", pin: "2222", password: "2222", role: "manager", privacyPin: "8888", branchId: "branch-qas" },
  { id: "st-ktc1", name: "Chef Subhan", username: "ktc_def", pin: "4444", password: "4444", role: "kitchen", privacyPin: "7777", branchId: "branch-def" },
  { id: "st-ktc2", name: "Chef Usama", username: "ktc_qas", pin: "1111", password: "1111", role: "kitchen", privacyPin: "7777", branchId: "branch-qas" }
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
    return { success: false, message: "Unknown portal." };
  }

  const pinValue = String(pin || password || "").trim();
  const userValue = String(username || "").trim().toLowerCase();

  if (expectedRole === "kitchen") {
    if (!/^\d{4}$/.test(pinValue)) {
      return { success: false, message: "Kitchen access requires a 4-digit PIN." };
    }
    const matches = STAFF_ACCOUNTS.filter(
      (s) => s.role === "kitchen" && s.pin === pinValue
    );
    if (!matches.length) {
      return { success: false, message: "Invalid Kitchen PIN." };
    }
    const user = (branchId && matches.find((s) => s.branchId === branchId)) || matches[0];
    return { success: true, user: publicStaffSession(user) };
  }

  if (expectedRole === "manager") {
    if (!pinValue) {
      return { success: false, message: "Enter your Manager PIN." };
    }
    let matches = STAFF_ACCOUNTS.filter((s) => s.role === "manager" && s.pin === pinValue);
    if (userValue) {
      matches = matches.filter((s) => s.username.toLowerCase() === userValue);
    }
    if (!matches.length) {
      return { success: false, message: "Invalid Manager credentials." };
    }
    const user = (branchId && matches.find((s) => s.branchId === branchId)) || matches[0];
    return { success: true, user: publicStaffSession(user) };
  }

  if (!userValue || !pinValue) {
    return { success: false, message: "Enter Super Admin username and password." };
  }

  const user = STAFF_ACCOUNTS.find(
    (s) =>
      s.role === "admin" &&
      s.username.toLowerCase() === userValue &&
      (s.password === pinValue || s.pin === pinValue)
  );

  if (!user) {
    return { success: false, message: "Invalid Super Admin username or password." };
  }

  return { success: true, user: publicStaffSession(user) };
}
