require("dotenv").config;
const { firestore } = require("../Firebase");
const { VerificationEmail } = require("./VerifyEmail");

const EXPIRED_CODE_MILISECOND = 10 * 60 * 1000; // 10 Minutes

async function ConfirmEmail(req, res) {
  const { email, code } = req.body;

  try {
    // Query to find the verification data in the 'email_verification' collection
    const querySnapshot = await firestore
      .collection("email_verification")
      .where("email", "==", email.toLowerCase())
      .where("code", "==", code)
      .get();

    // Check if there is a matching verification data
    if (!querySnapshot.empty) {
      const verificationData = querySnapshot.docs[0].data();

      // Check if the verification code is not expired
      if (verificationData.expired_at.toDate() > new Date()) {
        // Search for the user in 'customers' collection
        const customerQuery = await firestore
          .collection("customers")
          .where("email", "==", email.toLowerCase())
          .get();

        // Search for the user in 'sellers' collection
        const sellerQuery = await firestore
          .collection("sellers")
          .where("email", "==", email.toLowerCase())
          .get();

        // Check if the user exists in either 'customers' or 'sellers'
        if (!customerQuery.empty || !sellerQuery.empty) {
          const userDoc = customerQuery.empty
            ? sellerQuery.docs[0]
            : customerQuery.docs[0];

          // Update the user's emailVerified field to true
          await userDoc.ref.update({ emailVerified: true });

          // Delete the verification data from the 'email_verification' collection
          await querySnapshot.docs[0].ref.delete();

          res.json({ success: true, message: `Email Sukses di Konfirmasi` });
        } else {
          res.status(400).json({ success: false, message: "User tidak ditemukan" });
        }
      } else {
        // Verification code has expired
        res
          .status(400)
          .json({ success: false, message: "Kode Verifikasi telah Kadaluarsa" });

        // Send email verification again
        // const newVerificationCode = Math.floor(100000 + Math.random() * 900000);

        //Code for Test only, Change to variable above after test succesfully
        const newVerificationCode = 123456;

        await VerificationEmail(email, newVerificationCode);

        await querySnapshot.docs[0].ref.update({
          code: newVerificationCode,
          expired_at: new Date(Date.now() + EXPIRED_CODE_MILISECOND), // 10 minutes expiration for the new code
        });
      }
    } else {
      res
        .status(400)
        .json({ success: false, message: "Kode Verifikasi Salah" });
    }
  } catch (error) {
    console.error("Error confirming email : ", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}

module.exports = { ConfirmEmail };
