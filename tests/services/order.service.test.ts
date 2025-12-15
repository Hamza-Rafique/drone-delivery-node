import { OrderService } from "../../src/services/order.service";
import { Order } from "../../src/models/Order";

jest.mock("../src/models/Order");

describe("OrderService", () => {
  it("should create a new order", async () => {
    const mockSave = jest.fn().mockResolvedValue(true);
    (Order as any).mockImplementation(() => ({ save: mockSave }));

    const order = await OrderService.createOrder("user123", { lat: 1, lng: 2 }, { lat: 3, lng: 4 });

    expect(order).toBeDefined();
    expect(mockSave).toHaveBeenCalled();
  });
});
