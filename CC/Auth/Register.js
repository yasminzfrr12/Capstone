const bcrypt = require("bcrypt");
const { firestore } = require("../Firebase");
const { VerificationEmail } = require("./VerifyEmail");
const { GeoPoint } = require("firebase-admin/firestore");
async function Register(req, res) {
  const {
    alamat,
    email,
    kategori,
    nama,
    no_hp,
    owner,
    password,
    username,
    latitude,
    longitude,
  } = req.body;

  // Validate input
  if (!alamat || !email || !nama || !no_hp || !password || !username) {
    return res
      .status(400)
      .json({ success: false, message: "Harap isi seluruh form" });
  }
  if (!latitude && !longitude) {
    return res
      .status(400)
      .json({ success: false, message: "Lokasi harus tersedia" });
  }
  try {
    // Check if the username or email is already in use
    const customerQuery = await firestore
      .collection("customers")
      .where("username", "==", username)
      .get();

    const sellerQuery = await firestore
      .collection("sellers")
      .where("username", "==", username)
      .get();

    if (!customerQuery.empty || !sellerQuery.empty) {
      return res
        .status(400)
        .json({ success: false, message: "Username/Email telah digunakan" });
    }

    // Generate verification code for Prod
    // const verificationCode = Math.floor(100000 + Math.random() * 900000);

    //Development Stage Code
    const verificationCode = 123456;

    // Store verification data in the 'email_verification' collection
    const verificationData = {
      code: verificationCode,
      email: email.toLowerCase(),
      expired_at: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes expiration
    };

    await firestore.collection("email_verification").add(verificationData);

    // Hash the password before storing it in the database
    const hashedPassword = await bcrypt.hash(password, 10);

    // Determine whether it's a customer or seller registration based on the presence of 'kategori'
    const collectionName = kategori ? "sellers" : "customers";

    // Create a new user in the appropriate collection with GeoPoint
    const newUser = {
      alamat,
      current_location: new GeoPoint(
        parseFloat(latitude),
        parseFloat(longitude)
      ),
      email: email.toLowerCase(),
      nama,
      no_hp,
      password: hashedPassword,
      username,
      emailVerified: false,
    };

    if (kategori) {
      newUser.kategori = kategori;
      newUser.owner = owner || ""; // Assuming owner is an optional field for sellers
    }

    await firestore.collection(collectionName).add(newUser);

    // Send Email Verification
    await VerificationEmail(email, verificationCode);

    res
      .status(201)
      .json({ success: true, message: "Registrasi telah berhasil" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
}

module.exports = {
  Register,
};
