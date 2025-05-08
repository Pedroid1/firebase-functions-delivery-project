import { db } from "./admin";
import { onDocumentDeleted } from "firebase-functions/v2/firestore";
import { Logger } from "./utils/Logger";

export const onDeleteDeliveryRequest = onDocumentDeleted(
  "delivery_request/{docId}",
  async (event) => {
    const logger = new Logger();
    logger.log("onDeleteDeliveryRequest triggered");

    const deletedData = event.data?.data();
    if (!deletedData) {
      logger.warn("Nenhum dado no documento excluído.");
      logger.printAll();
      return;
    }

    const docId = event.params.docId;
    const motoBoyId = deletedData.motoBoyId as string | undefined;

    logger.log(`Documento excluído: ${docId}`);
    logger.log(`Motoboy associado: ${motoBoyId ?? "não informado"}`);

    if (!motoBoyId) {
      logger.error("Nenhum motoBoyId encontrado no documento excluído.");
      logger.printAll();
      return;
    }

    const hasActiveDeliveries = await motoboyHasActiveDeliveries(motoBoyId);

    if (!hasActiveDeliveries) {
      await updateMotoboyStatusToOnline(motoBoyId);
    } else {
      logger.log(`Motoboy ${motoBoyId} ainda possui entregas ativas.`);
    }

    logger.printAll();

    async function motoboyHasActiveDeliveries(motoboyId: string): Promise<boolean> {
      try {
        const snapshot = await db.collection("delivery_request")
          .where("motoBoyId", "==", motoboyId)
          .where("completed", "==", false)
          .get();

        if (snapshot.empty) {
          logger.log(`Nenhuma outra entrega ativa encontrada para o motoboy ${motoboyId}`);
          return false;
        } else {
          logger.log(`${snapshot.size} entrega(s) ainda ativas para o motoboy ${motoboyId}`);
          return true;
        }
      } catch (error) {
        logger.error(`Erro ao consultar entregas ativas do motoboy ${motoboyId}: ${String(error)}`);
        return true; // fallback seguro: assume que ainda tem entrega ativa
      }
    }

    async function updateMotoboyStatusToOnline(motoboyId: string) {
      try {
        await db.collection("motoboy").doc(motoboyId).update({ status: "ONLINE" });
        logger.log(`Status do motoboy ${motoBoyId} atualizado para ONLINE.`);
      } catch (error) {
        logger.error(`Erro ao atualizar status do motoboy ${motoBoyId}: ${String(error)}`);
      }
    }
  }
);
