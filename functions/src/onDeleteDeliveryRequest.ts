import { db, messaging } from "./admin";
import { onDocumentDeleted } from "firebase-functions/v2/firestore";
import { Logger } from "./utils/Logger";

export const onDeleteDeliveryRequest = onDocumentDeleted(
  "delivery_request/{docId}",
  async (event) => {
    const logger = new Logger();
    logger.log("onDeleteDeliveryRequest triggered");

    const deletedData = event.data?.data();
    const docId = event.params.docId;

    if (!deletedData) {
      logger.warn("Nenhum dado no documento excluído.");
      logger.printAll();
      return;
    }

    const motoBoyId = deletedData.motoBoyId as string | undefined;
    const companyId = deletedData.companyId as string | undefined;

    if (!motoBoyId) {
      logger.warn("Nenhum motoBoyId encontrado no documento excluído.");
      logger.printAll();
      return;
    }

    await notificarMotoboyCancelamento(motoBoyId, companyId);

    const querySnapshot = await db.collection("delivery_request")
      .where("motoBoyId", "==", motoBoyId)
      .where("completed", "==", false)
      .get();

    if (querySnapshot.empty) {
      await db.collection("motoboy").doc(motoBoyId).update({
        status: "ONLINE",
      });
      logger.log(`Status do motoboy ${motoBoyId} atualizado para ONLINE.`);
    } else {
      logger.log(`O motoboy ${motoBoyId} ainda possui entregas ativas.`);
    }

    logger.printAll();

    // 🔽 função local auxiliar 🔽

    async function notificarMotoboyCancelamento(motoboyId: string, companyId?: string) {
      try {
        const [companySnap, tokenSnap] = await Promise.all([
          companyId ? db.collection("company").doc(companyId).get() : undefined,
          db.collection("fcm_tokens").doc(motoboyId).get(),
        ]);

        if (!tokenSnap.exists) {
          logger.warn(`Token FCM não encontrado para motoboy ${motoboyId}`);
          return;
        }

        const companyName = companySnap?.exists ? companySnap.data()?.name : "uma empresa";
        const token = tokenSnap.data()?.token;

        if (!token) {
          logger.warn(`Token vazio para motoboy ${motoboyId}`);
          return;
        }

        const message = {
          token,
          notification: {
            title: "Entrega cancelada",
            body: `A entrega da empresa ${companyName} foi cancelada.`,
          },
        };

        await messaging.send(message);
        logger.log(`Notificação de cancelamento enviada para motoboy ${motoboyId}`);
      } catch (error) {
        logger.error(`Erro ao notificar motoboy ${motoboyId}: ${String(error)}`);
      }
    }
  }
);
