import admin from "firebase-admin";
import serviceAccount from "./dispute-firebase-key.js";

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

export default admin;