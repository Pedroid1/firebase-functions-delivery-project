import { onCreateDeliveryRequest } from "./onCreateDeliveryRequest";
import { onDeleteDeliveryRequest } from "./onDeleteDeliveryRequest";
import { setCompanyClaim } from "./setCompanyClaim";
import { setMotoBoyClaim } from "./setMotoBoyClaim";
import { setGlobalOptions } from "firebase-functions/v2/options";

setGlobalOptions({ region: "southamerica-east1" });

export { onCreateDeliveryRequest, onDeleteDeliveryRequest, setMotoBoyClaim, setCompanyClaim };