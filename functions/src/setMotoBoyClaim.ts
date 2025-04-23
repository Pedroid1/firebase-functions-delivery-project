import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { auth } from "./admin";

export const setMotoBoyClaim = onDocumentCreated(
  "motoboy/{uid}",
  async (event) => {
    const uid = event.params.uid;
    const snapshot = event.data;

    if (!snapshot) {
      console.warn(`Documento motoboy/${uid} está vazio ou foi excluído.`);
      return;
    }

    try {
      const user = await auth.getUser(uid);

      // Validação extra: o UID do Auth deve ser o mesmo do documento
      if (user.uid !== uid) {
        console.error(`UID do Auth (${user.uid}) difere do documento (${uid})`);
        return;
      }

      if (user.customClaims?.role) {
        console.log(`Usuário ${uid} já possui uma role (${user.customClaims.role}).`);
        return;
      }

      await auth.setCustomUserClaims(uid, { role: "motoboy" });
      console.log(`Claim 'motoboy' definida com sucesso para UID: ${uid}`);
    } catch (error) {
      console.error(`Erro ao definir claim para motoboy/${uid}:`, error);
    }
  }
);
