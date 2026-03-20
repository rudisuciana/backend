import { WebsiteRepository, type PPOBProduct } from './website.repository';
import { listAkrabProducts, type AkrabProduct } from '../akrab';

export class WebsiteService {
  constructor(private readonly websiteRepository: WebsiteRepository) {}

  async getProducts(): Promise<PPOBProduct[]> {
    return this.websiteRepository.listProducts();
  }

  async getAkrabProducts(): Promise<AkrabProduct[]> {
    return listAkrabProducts();
  }
}
