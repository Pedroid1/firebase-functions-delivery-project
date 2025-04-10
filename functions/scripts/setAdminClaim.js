"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("firebase-admin/app");
const auth_1 = require("firebase-admin/auth");
(0, app_1.initializeApp)({
    credential: (0, app_1.applicationDefault)(),
});
const uid = "STRoNGxgyLdNnQri78Trf420vFi2";
async function setAdminClaim() {
    try {
        await (0, auth_1.getAuth)().setCustomUserClaims(uid, { role: "admin" });
        console.log(`Claim 'admin' definida com sucesso para o UID: ${uid}`);
    }
    catch (error) {
        console.error("Erro ao definir a claim:", error);
    }
}
setAdminClaim();
