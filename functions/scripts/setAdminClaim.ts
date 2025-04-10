import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import * as path from "path";

// Caminho para o arquivo da chave
const serviceAccountPath = path.resolve(__dirname, "./keys/firebase-key.json");

initializeApp({
  credential: cert(serviceAccountPath),
  projectId: "deliveryproject-630b1"
});

const auth = getAuth();

async function setAdminClaim() {
  const uid = "STRoNGxgyLdNnQri78Trf420vFi2";
  try {
    await auth.setCustomUserClaims(uid, { role: "admin" });
    console.log(`Claim 'admin' definida para o UID ${uid}`);
  } catch (error) {
    console.error("Erro ao definir a claim:", error);
  }
}

setAdminClaim();
