import { WebsiteRepository, type PPOBProduct } from './website.repository';
import { listAkrabProducts, type AkrabProduct } from '../providers/akrab';
import { createKajeOrder } from '../providers/kaje/order';

interface CreateOrderInput {
  userId: number;
  number: string;
  code: string;
}

interface CreateOrderResult {
  trx_id: string;
  invoice_no: string;
  product_id: string;
  number: string;
  status: string;
  description: string;
}

export class WebsiteService {
  constructor(private readonly websiteRepository: WebsiteRepository) {}

  async getProducts(): Promise<PPOBProduct[]> {
    return this.websiteRepository.listProducts();
  }

  async getAkrabProducts(): Promise<AkrabProduct[]> {
    return listAkrabProducts();
  }

  async createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
    const product = await this.websiteRepository.getProductByCode(input.code);
    if (!product) {
      throw new Error('PRODUCT_NOT_FOUND');
    }

    const order = await createKajeOrder({ number: input.number, code: input.code });

    await this.websiteRepository.createHistoryOrder({
      trxId: order.trx_id,
      invoiceNo: order.invoice_no,
      userId: input.userId,
      productCode: input.code,
      productName: product.name,
      amount: Number(product.price),
      adminFee: Number(product.admin_fee),
      number: order.number,
      status: order.status,
      description: order.description
    });

    return order;
  }
}
