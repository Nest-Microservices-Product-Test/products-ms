import { HttpStatus, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaClient } from 'generated/prisma';
import { PaginationDto } from 'src/common';
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class ProductsService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(ProductsService.name);

  onModuleInit() {
    void this.$connect();
    this.logger.log('Prisma Client connected');
  }

  create(createProductDto: CreateProductDto) {
    return this.product.create({
      data: createProductDto,
    });
  }

  async findAll(paginationDto: PaginationDto) {
    const { page, limit } = paginationDto;
    const totalPages = await this.product.count({
      where: { available: true },
    });
    const lastPage = Math.ceil(totalPages / limit!);

    return {
      data: await this.product.findMany({
        skip: (page! - 1) * limit!,
        take: limit,
        where: {
          available: true,
        },
      }),
      meta: {
        page,
        lastPage,
        total: totalPages,
      },
    };
  }

  async findOne(id: number) {
    const product = await this.product.findUnique({
      where: {
        id,
        available: true,
      },
    });
    if (!product) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: `Product with id ${id} not found`,
      });
    }

    return product;
  }

  async update(id: number, updateProductDto: UpdateProductDto) {
    await this.findOne(id); // Ensure the product exists before updating
    return await this.product.update({
      where: { id },
      data: updateProductDto,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return await this.product.update({
      where: { id },
      data: { available: false },
    });
  }

  async validateProducts(ids: number[]) {
    ids = Array.from(new Set(ids));

    const products = await this.product.findMany({
      where: {
        id: { in: ids },
      },
    });

    if (products.length !== ids.length) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: `Some products were not found`,
      });
    }

    return products;
  }
}
