import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { auth } from "./admin";
import { Logger } from "./utils/Logger";

export const setCompanyClaim = onDocumentCreated(
  "company/{uid}",
  async (event) => {
    const logger = new Logger();
    logger.log("setCompanyClaim triggered");

    const uid = event.params.uid;
    const snapshot = event.data;

    if (!snapshot) {
      logger.warn(`Documento company/${uid} está vazio ou foi excluído.`);
      logger.printAll();
      return;
    }

    logger.log(`Buscando usuário Auth com UID: ${uid}`);

    try {
      const user = await auth.getUser(uid);

      if (user.uid !== uid) {
        logger.error(`UID do Auth (${user.uid}) difere do documento (${uid})`);
        logger.printAll();
        return;
      }

      if (user.customClaims?.role) {
        logger.log(`Usuário ${uid} já possui uma role (${user.customClaims.role}). Nenhuma alteração feita.`);
        logger.printAll();
        return;
      }

      await auth.setCustomUserClaims(uid, { role: "company" });
      logger.log(`Claim 'company' definida com sucesso para UID: ${uid}`);
    } catch (error) {
      logger.error(`Erro ao definir claim para company/${uid}: ${String(error)}`);
    }

    logger.printAll();
  }
);
