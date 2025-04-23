import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import { db } from "./admin";

export const onDeliveryStatusChanged = onDocumentUpdated(
    "delivery_request/{id}",
    async (event) => {
        const before = event.data?.before?.data();
        const after = event.data?.after?.data();

        if (!before || !after) return;

        const motoBoyIdBefore = before.motoBoyId;
        const motoBoyIdAfter = after.motoBoyId;
        const completedBefore = before.completed ?? false;
        const completedAfter = after.completed ?? false;

        const accepted = !motoBoyIdBefore && motoBoyIdAfter;
        const abandoned = motoBoyIdBefore && !motoBoyIdAfter;
        const completed = !completedBefore && completedAfter;

        const motoBoyId = motoBoyIdAfter || motoBoyIdBefore;

        if (!motoBoyId) return;

        const motoboyDocRef = db.collection("motoboy").doc(motoBoyId);

        if (accepted) {
            // Quando motoboy assume uma entrega → BUSY
            await motoboyDocRef.update({ status: "BUSY" });
            console.log(`Motoboy ${motoBoyId} agora está BUSY`);

            // Remove da fila se ele estava lá
            const queueDocRef = db.collection("queue").doc(motoBoyId);
            const queueDoc = await queueDocRef.get();

            if (queueDoc.exists) {
                await queueDocRef.delete();
                console.log(`Motoboy ${motoBoyId} removido da fila`);
            }

            return;
        }

        if (abandoned || completed) {
            // Verifica se ele ainda tem entregas pendentes
            const activeDeliveries = await db.collection("delivery_request")
                .where("motoBoyId", "==", motoBoyId)
                .where("completed", "==", false)
                .get();

            if (activeDeliveries.empty) {
                await motoboyDocRef.update({ status: "ONLINE" });
                console.log(`Motoboy ${motoBoyId} agora está ONLINE`);
            } else {
                console.log(`Motoboy ${motoBoyId} ainda tem entregas, status mantido`);
            }
        }
    }
);
