export class Product {
  constructor({ id = null, name, description = '', price, stock, createdAt = new Date() }) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.price = Number(price);
    this.stock = Number(stock);
    this.createdAt = createdAt;
    this.validate();
  }

  validate() {
    if (!this.name || this.name.trim().length === 0) {
      throw new Error('El nombre del producto es obligatorio');
    }
    if (isNaN(this.price) || this.price < 0) {
      throw new Error('El precio del producto debe ser un número igual o superior a cero');
    }
    if (isNaN(this.stock) || !Number.isInteger(this.stock) || this.stock < 0) {
      throw new Error('El inventario debe ser un número entero mayor o igual a cero');
    }
  }

  hasSufficientStock(requestedQuantity) {
    return this.stock >= requestedQuantity;
  }

  reduceStock(quantityToReduce) {
    if (!this.hasSufficientStock(quantityToReduce)) {
      throw new Error(`Stock insuficiente para el producto "${this.name}". Disponible: ${this.stock}, Solicitado: ${quantityToReduce}`);
    }
    this.stock -= quantityToReduce;
  }

  restoreStock(quantityToRestore) {
    if (quantityToRestore <= 0) {
      throw new Error('La cantidad a reponer debe ser mayor a cero');
    }
    this.stock += quantityToRestore;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      price: this.price,
      stock: this.stock,
      createdAt: this.createdAt
    };
  }
}
