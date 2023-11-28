const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
require("dotenv").config();

const secretKey = process.env.JWT_SECRET;
const { firestore } = require("../Firebase");

const DAY_IN_MILISECOND = 31 * 24 * 60 * 60 * 1000; //31 for Days

async function Login(req, res) {
  const { identifier, password } = req.body;

  // Validate input
  if (!identifier || !password) {
    return res
      .status(400)
      .json({ success: false, message: "Harap masukan username dan password" });
  }

  try {
    // Check if the user exists in the 'customers' collection using username or email
    const customerQueryByUsername = await firestore
      .collection("customers")
      .where("username", "==", identifier)
      .get();

    const customerQueryByEmail = await firestore
      .collection("customers")
      .where("email", "==", identifier.toLowerCase())
      .get();

    // Check if the user exists in the 'sellers' collection using username or email
    const sellerQueryByUsername = await firestore
      .collection("sellers")
      .where("username", "==", identifier)
      .get();

    const sellerQueryByEmail = await firestore
      .collection("sellers")
      .where("email", "==", identifier.toLowerCase())
      .get();

    // Combine the results from all queries
    const userQuerySnapshot = [
      ...customerQueryByUsername.docs,
      ...customerQueryByEmail.docs,
      ...sellerQueryByUsername.docs,
      ...sellerQueryByEmail.docs,
    ];

    if (userQuerySnapshot.length > 0) {
      const user = userQuerySnapshot[0].data();
      const role =
        userQuerySnapshot[0].ref.parent.id === "customers"
          ? "customers"
          : "sellers";

      // Check if the provided password matches the hashed password in the database
      const isPasswordMatch = await bcrypt.compare(password, user.password);

      if (isPasswordMatch) {
        if (!user.emailVerified) {
          return res
            .status(401)
            .json({
              success: false,
              message:
                "Email belum diverifikasi, Periksa email untuk instruksi selanjutnya",
            });
        }

        // Check if the user has a valid token
        const tokenSnapshot = await firestore
          .collection("tokens")
          .where("username", "==", user.username)
          .where("role", "==", role)
          .get();

        if (!tokenSnapshot.empty) {
          // If a token exists, delete the old token
          await tokenSnapshot.docs[0].ref.delete();
        }

        // Create a new token with expiration set to one week (31 days)
        const newToken = jwt.sign(
          { username: user.username, role },
          secretKey,
          { expiresIn: "31d" } // 31 days
        );

        // Save the new token to the 'tokens' collection
        await firestore.collection("tokens").add({
          username: user.username,
          role: role,
          token: newToken,
          expired: new Date(Date.now() + DAY_IN_MILISECOND), // Add token expiration time (7 days)
        });

        res.status(200).json({ success: true, token: newToken });
      } else {
        res
          .status(401)
          .json({
            success: false,
            message: "Password yang anda masukan salah",
          });
      }
    } else {
      res
        .status(401)
        .json({ success: false, message: "Email/Username tidak terdaftar" });
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}

module.exports = {
  Login,
};
