export const firebaseErrorHandler = (error) => {
    // console.log("handle error")
    switch (error.code) {
        case "auth/email-already-in-use":
            return "The email address is already in use by another account.";

        case "auth/invalid-emailreturn":
            return "The email address is not valid."

        case "auth/operation-not-allowed":
            return "Email/password accounts are not enabled. Enable them in the Firebase Console.";

        case "auth/weak-password":
            return "The password is too weak.";

        case "auth/user-disabled":
            return "The user account has been disabled by an administrator.";

        case "auth/user-not-found":
            return "Email id is not registered with us";

        case "auth/wrong-password":
            return "The password is invalid for the given email.";

        case "auth/too-many-requests":
            return "Too many unsuccessful login attempts. Try again later.";

        // Additional errors
        case "auth/invalid-api-key":
            return "The provided API key is invalid.";

        case "auth/invalid-user-token":
            return "The user's credential is no longer valid. The user must sign in again.";

        case "auth/invalid-continue-uri":
            return "The continue URL provided in the request is invalid.";

        case "auth/missing-continue-uri":
            return "A continue URL must be provided in the request."

        case "auth/missing-iframe-start":
            return "An internal error has occurred."

        case "auth/missing-ios-bundle-id":
            return "An iOS Bundle ID must be provided if an App Store ID is provided."

        case "auth/missing-android-pkg-name":
            return "An Android Package Name must be provided if the Android App is specified."

        case "auth/missing-oauth-client-id":
            return "The OAuth client ID must be specified when making this request."

        case "auth/invalid-login-credentials":
            return "Credentials are invalid."

        case "auth/invalid-credential":
            return "Credentials are invalid."

        // Add more cases as needed for other error codes

        default:
            console.error("An error occurred:", error.message);
            break;
    }
}