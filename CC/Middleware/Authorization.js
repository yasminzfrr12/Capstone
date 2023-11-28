const jwt = require("jsonwebtoken");
require("dotenv").config();

const secretKey = process.env.JWT_SECRET;
const { firestore } = require("../Firebase");
const DAY_IN_MILLISECOND = 31 * 24 * 60 * 60 * 1000; // 31 days in milliseconds

async function Authorization(req, res) {
  // Extract the token from the request header
  const { token } = req.body;

  // Check if the token exists
  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Token tidak ada",
    });
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, secretKey);

    // Check if the token exists in the 'tokens' collection
    const tokenSnapshot = await firestore
      .collection("tokens")
      .where("username", "==", decoded.username)
      .where("token", "==", token)
      .get();

    if (tokenSnapshot.empty) {
      return res.status(401).json({
        success: false,
        message: "Token tidak valid",
      });
    }

    // Check if the token is expired
    if (new Date(decoded.exp * 1000) < new Date()) {
      // Token expired, generate a new token with extended expiration
      const newToken = jwt.sign(
        { username: decoded.username, role: decoded.role },
        secretKey,
        { expiresIn: "31d" } // Extend expiration to 31 days
      );

      // Update the 'tokens' collection with the new token and expiration time
      await tokenSnapshot.docs[0].ref.update({
        token: newToken,
        expired: new Date(Date.now() + DAY_IN_MILLISECOND), // Update expiration time
      });

      // Attach the new token to the response for the client
      res.status(200).json({ success: true, token: newToken });
    } else {
      // Token is valid
      // Attach the decoded token to the request for future use
      req.decodedToken = decoded;

      // Provide a response indicating that the token is valid
      res.status(200).json({ success: true, message: "Login Berhasil" });
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(401).json({
      success: false,
      message: "Token tidak valid",
    });
  }
}

module.exports = {
  Authorization,
};
