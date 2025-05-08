import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import { db } from "./admin";
import { Logger } from "./utils/Logger";

export const onDeliveryStatusChanged = onDocumentUpdated(
  "delivery_request/{id}",
  async (event) => {
    const logger = new Logger();
    logger.log("onDeliveryStatusChanged triggered");

    const before = event.data?.before?.data();
    const after = event.data?.after?.data();

    if (!before || !after) {
      logger.warn("Dados 'before' ou 'after' ausentes.");
      logger.printAll();
      return;
    }

    const deliveryId = event.params.id;
    const motoBoyIdBefore = before.motoBoyId;
    const motoBoyIdAfter = after.motoBoyId;
    const completedBefore = before.completed ?? false;
    const completedAfter = after.completed ?? false;

    const accepted = !motoBoyIdBefore && !!motoBoyIdAfter;
    const abandoned = !!motoBoyIdBefore && !motoBoyIdAfter;
    const completed = !completedBefore && completedAfter;

    const motoBoyId = motoBoyIdAfter || motoBoyIdBefore;

    logger.log(`Status alterado na entrega ${deliveryId}`);
    logger.log(`motoBoyIdBefore: ${motoBoyIdBefore}, motoBoyIdAfter: ${motoBoyIdAfter}`);
    logger.log(`accepted: ${accepted}, abandoned: ${abandoned}, completed: ${completed}`);

    if (!motoBoyId) {
      logger.warn("Motoboy ID ausente após análise.");
      logger.printAll();
      return;
    }

    const motoboyDocRef = db.collection("motoboy").doc(motoBoyId);

    if (accepted) {
      await updateMotoboyStatus(motoboyDocRef, "BUSY");
      await removeFromQueueIfExists(motoBoyId);
      logger.log(`Motoboy ${motoBoyId} aceitou entrega. Removido da fila e definido como BUSY.`);
      logger.printAll();
      return;
    }

    if (abandoned || completed) {
      const hasOtherDeliveries = await motoboyHasActiveDeliveries(motoBoyId);

      if (!hasOtherDeliveries) {
        await updateMotoboyStatus(motoboyDocRef, "ONLINE");
        logger.log(`Motoboy ${motoBoyId} agora está ONLINE`);
      } else {
        logger.log(`Motoboy ${motoBoyId} ainda tem entregas ativas. Status mantido.`);
      }
    }

    logger.printAll();

    async function updateMotoboyStatus(docRef: FirebaseFirestore.DocumentReference, newStatus: string) {
        try {
          const doc = await docRef.get();
          const currentStatus = doc.data()?.status;
      
          if (currentStatus === newStatus) {
            logger.log(`Status do motoboy ${docRef.id} já é '${newStatus}', nenhum update necessário.`);
            return;
          }
      
          await docRef.update({ status: newStatus });
          logger.log(`Status do motoboy ${docRef.id} atualizado para '${newStatus}'.`);
        } catch (error) {
          logger.error(`Erro ao atualizar status do motoboy ${docRef.id}: ${String(error)}`);
        }
      }      

    async function motoboyHasActiveDeliveries(motoBoyId: string): Promise<boolean> {
      try {
        const snapshot = await db.collection("delivery_request")
          .where("motoBoyId", "==", motoBoyId)
          .where("completed", "==", false)
          .get();

        logger.log(`Motoboy ${motoBoyId} tem ${snapshot.size} entrega(s) ativas`);
        return !snapshot.empty;
      } catch (error) {
        logger.error(`Erro ao buscar entregas ativas do motoboy ${motoBoyId}: ${String(error)}`);
        return true; // fallback defensivo
      }
    }

    async function removeFromQueueIfExists(motoBoyId: string) {
      try {
        const queueRef = db.collection("queue").doc(motoBoyId);
        const doc = await queueRef.get();
        if (doc.exists) {
          await queueRef.delete();
          logger.log(`Motoboy ${motoBoyId} removido da fila manualmente ao aceitar entrega.`);
        } else {
          logger.log(`Motoboy ${motoBoyId} não estava na fila.`);
        }
      } catch (error) {
        logger.error(`Erro ao remover motoboy ${motoBoyId} da fila: ${String(error)}`);
      }
    }
  }
);
