const { firestore } = require("../Firebase");
const { VerificationEmail } = require("./VerifyEmail");

const EXPIRED_CODE_MILLISECOND = 10 * 60 * 1000; // 10 Minutes

async function ForgotPassword(req, res) {
  const { identifier } = req.body;

  // Validate input
  if (!identifier) {
    return res
      .status(400)
      .json({ success: false, message: "Harap masukkan username atau email" });
  }

  try {
    // Check if the input is an email or username
    if (identifier.includes("@")) {
      // If it's an email, search in both 'customers' and 'sellers' collections
      const customerQuery = await firestore
        .collection("customers")
        .where("email", "==", identifier.toLowerCase())
        .get();

      const sellerQuery = await firestore
        .collection("sellers")
        .where("email", "==", identifier.toLowerCase())
        .get();

      userQuery = customerQuery.docs.concat(sellerQuery.docs);
    } else {
      // If it's a username, search in both 'customers' and 'sellers' collections
      const customerQuery = await firestore
        .collection("customers")
        .where("username", "==", identifier)
        .get();

      const sellerQuery = await firestore
        .collection("sellers")
        .where("username", "==", identifier)
        .get();

      userQuery = customerQuery.docs.concat(sellerQuery.docs);
    }

    // Check if the user exists
    if (userQuery.length > 0) {
      const userData = userQuery[0].data();

      // Check if required fields exist
      const username = userData.username;
      const email = userData.email;

      // Generate a new password reset code
      const resetCode = Math.floor(100000 + Math.random() * 900000);

      // Check if there is existing data for the email or username in 'forgot_password'
      const existingQuery = await firestore
        .collection("forgot_password")
        .where("email", "==", email)
        .where("username", "==", username)
        .get();

      // Delete existing entries
      existingQuery.forEach((doc) => {
        doc.ref.delete();
      });

      // Store reset data in the 'password_reset' collection
      await firestore.collection("forgot_password").add({
        code: resetCode,
        username: username,
        email: email,
        expired_at: new Date(Date.now() + EXPIRED_CODE_MILLISECOND), // 10 minutes expiration
      });

      // Kirim email reset password
      await VerificationEmail(email, resetCode);

      res.status(200).json({
        success: true,
        message: "Kode reset password telah dikirim ke email Anda.",
      });
    } else {
      res.status(404).json({
        success: false,
        message: "User tidak ditemukan",
      });
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
}

module.exports = { ForgotPassword };
