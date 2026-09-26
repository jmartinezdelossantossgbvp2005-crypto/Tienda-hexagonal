export class OrderItem {
  constructor({ id = null, orderId = null, productId, productName = '', quantity, unitPrice }) {
    this.id = id;
    this.orderId = orderId;
    this.productId = productId;
    this.productName = productName;
    this.quantity = Number(quantity);
    this.unitPrice = Number(unitPrice);
    this.validate();
  }

  validate() {
    if (!this.productId) {
      throw new Error('El identificador del producto en el detalle del pedido es obligatorio');
    }
    if (isNaN(this.quantity) || !Number.isInteger(this.quantity) || this.quantity <= 0) {
      throw new Error('La cantidad de producto debe ser un entero estrictamente mayor a cero');
    }
    if (isNaN(this.unitPrice) || this.unitPrice < 0) {
      throw new Error('El precio unitario debe ser mayor o igual a cero');
    }
  }

  getSubtotal() {
    return Number((this.quantity * this.unitPrice).toFixed(2));
  }

  toJSON() {
    return {
      id: this.id,
      orderId: this.orderId,
      productId: this.productId,
      productName: this.productName,
      quantity: this.quantity,
      unitPrice: this.unitPrice,
      subtotal: this.getSubtotal()
    };
  }
}
