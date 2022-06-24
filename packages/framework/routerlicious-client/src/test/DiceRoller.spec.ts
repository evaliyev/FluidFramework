import { strict as assert } from "assert";
import { SharedMap } from "@fluidframework/map";
import { createRouterliciousClient } from "./RouterliciousClientFactory";

const containerSchema = {
    initialObjects: { diceMap: SharedMap },
};

class DiceClient {
    private readonly client: any;
    private diceMap: any;

    constructor() {
        this.client = createRouterliciousClient();
    }

    async createNewDice(initDiceValue: number = 1): Promise<string> {
        const { container } = await this.client.createContainer(containerSchema);
        this.diceMap = container.initialObjects.diceMap;
        // Set default data
        this.diceMap.set("dice-value-key", initDiceValue);
        // Attach container to service and return assigned ID
        const id: string = container.attach();
        return id;
    }

    async loadExistingDice(id: string) {
        const { container } = await this.client.getContainer(id, containerSchema);
        this.diceMap = container.initialObjects.diceMap;
    }

    getDiceValue(): number {
        return this.diceMap.get("dice-value-key") as number;
    }
}

describe("Dice Roller", () => {
    it("2 client values should match", async () => {
        const initDiceValue = 3;

        const client1 = new DiceClient();
        const containerId = await client1.createNewDice(initDiceValue);

        const client2 = new DiceClient();
        await client2.loadExistingDice(containerId);

        assert.strictEqual(client1.getDiceValue(), client2.getDiceValue(), "Dice values should match");
    });
});
