import { WebsiteRepository, type PPOBProduct } from './website.repository';

export class WebsiteService {
  constructor(private readonly websiteRepository: WebsiteRepository) {}

  async getProducts(): Promise<PPOBProduct[]> {
    return this.websiteRepository.listProducts();
  }
}
